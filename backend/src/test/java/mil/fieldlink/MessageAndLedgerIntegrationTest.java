package mil.fieldlink;

import mil.fieldlink.dto.IntegrityReportDto;
import mil.fieldlink.dto.MessageDto;
import mil.fieldlink.dto.SendMessageRequest;
import mil.fieldlink.dto.TamperRequest;
import mil.fieldlink.model.entity.EncryptedPayloadEntity;
import mil.fieldlink.model.entity.LedgerBlockEntity;
import mil.fieldlink.repository.EncryptedPayloadRepository;
import mil.fieldlink.repository.LedgerBlockRepository;
import mil.fieldlink.service.LedgerService;
import mil.fieldlink.service.MessageService;
import mil.fieldlink.service.TamperService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MessageAndLedgerIntegrationTest {

    @Autowired
    private MessageService messageService;

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private TamperService tamperService;

    @Autowired
    private LedgerBlockRepository ledgerBlockRepository;

    @Autowired
    private EncryptedPayloadRepository encryptedPayloadRepository;

    @Test
    @DisplayName("Ledger Initialization: Genesis block (Block 0) exists with 64-zero previousHash")
    void testGenesisBlockInitialized() {
        Optional<LedgerBlockEntity> genesisOpt = ledgerBlockRepository.findByBlockIndex(0L);
        assertTrue(genesisOpt.isPresent(), "Genesis block must exist");
        LedgerBlockEntity genesis = genesisOpt.get();
        assertEquals(LedgerService.GENESIS_PREV_HASH, genesis.getPreviousHash());
        assertEquals("GENESIS", genesis.getBlockType());
        assertNotNull(genesis.getCurrentHash());
    }

    @Test
    @DisplayName("End-to-End Transmission: Encrypted payload separate from ledger; zero plaintext stored; ledger valid")
    void testMessageTransmissionAndZeroPlaintext() {
        String secretPlaintext = "TACTICAL_ORDERS_ENCRYPTED_ONLY_48102";
        SendMessageRequest req = new SendMessageRequest(
                "MSG-TEST-001",
                "ALPHA-BASE",
                "FORWARD-OP-1",
                "SECRET",
                "FLASH",
                secretPlaintext,
                "KEY-TACTICAL-ALPHA",
                "KEY-SLOT-01",
                1001L
        );

        MessageDto sent = messageService.sendMessage(req);
        assertNotNull(sent);
        assertEquals("MSG-TEST-001", sent.messageId());
        assertTrue(sent.blockIndex() > 0);

        // Verify stored payload in encrypted_payloads table does NOT contain plaintext
        EncryptedPayloadEntity payload = encryptedPayloadRepository.findByMessageId("MSG-TEST-001")
                .orElseThrow();
        assertFalse(payload.getCipherText().contains(secretPlaintext), "Payload ciphertext must be encrypted");
        assertNotEquals(secretPlaintext, payload.getCipherText());

        // Verify stored ledger block does NOT contain plaintext
        LedgerBlockEntity block = ledgerBlockRepository.findByMessageId("MSG-TEST-001")
                .orElseThrow();
        assertFalse(block.getPayloadHash().contains(secretPlaintext), "Ledger block only contains SHA-256 hash");

        // Verify ledger integrity
        IntegrityReportDto integrity = ledgerService.verifyChainIntegrity();
        assertTrue(integrity.isValid(), "Ledger chain must be cryptographically valid");
    }

    @Test
    @DisplayName("Replay Protection: Duplicate transmission of identical Message ID is rejected with Conflict")
    void testDuplicateReplayRejected() {
        SendMessageRequest req1 = new SendMessageRequest(
                "MSG-REPLAY-TEST",
                "RECON-EAGLE",
                "TACTICAL-CP",
                "CONFIDENTIAL",
                "ROUTINE",
                "Reconnaissance clear sector 4.",
                "KEY-OP-RECON",
                "KEY-SLOT-02",
                2001L
        );
        messageService.sendMessage(req1);

        // Attempting to send again with the same Message ID
        assertThrows(ResponseStatusException.class, () ->
            messageService.sendMessage(req1),
            "Duplicate message ID must be rejected as a replay attack"
        );
    }

    @Test
    @DisplayName("Adversarial Tamper & Audit: Corrupting block hash breaks verification; repair restores it")
    void testTamperDetectionAndRestoration() {
        // First ensure we have a valid state
        IntegrityReportDto before = ledgerService.verifyChainIntegrity();
        assertTrue(before.isValid());

        // Tamper with Block 0 or 1
        tamperService.executeTamper(new TamperRequest("CORRUPT_BLOCK_HASH", 0L, null, null));

        // Audit must now flag failure
        IntegrityReportDto audit = ledgerService.verifyChainIntegrity();
        assertFalse(audit.isValid(), "Tampered block must fail cryptographic audit");
        assertTrue(audit.compromisedBlocksCount() > 0);

        // Repair ledger
        tamperService.repairLedger();

        // Audit after repair must pass
        IntegrityReportDto restored = ledgerService.verifyChainIntegrity();
        assertTrue(restored.isValid(), "Ledger should be cryptographically restored after repair");
    }
}
