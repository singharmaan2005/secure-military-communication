package mil.fieldlink.service;

import mil.fieldlink.dto.TamperRequest;
import mil.fieldlink.model.entity.EncryptedPayloadEntity;
import mil.fieldlink.model.entity.LedgerBlockEntity;
import mil.fieldlink.repository.EncryptedPayloadRepository;
import mil.fieldlink.repository.LedgerBlockRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class TamperService {

    private final LedgerBlockRepository ledgerBlockRepository;
    private final EncryptedPayloadRepository encryptedPayloadRepository;
    private final LedgerService ledgerService;

    private long tamperedEventsDetectedCount = 0;

    public TamperService(LedgerBlockRepository ledgerBlockRepository,
                         EncryptedPayloadRepository encryptedPayloadRepository,
                         LedgerService ledgerService) {
        this.ledgerBlockRepository = ledgerBlockRepository;
        this.encryptedPayloadRepository = encryptedPayloadRepository;
        this.ledgerService = ledgerService;
    }

    public synchronized long getTamperedEventsCount() {
        return tamperedEventsDetectedCount;
    }

    public synchronized void recordTamperEvent() {
        tamperedEventsDetectedCount++;
    }

    /**
     * Executes controlled adversarial tampering simulation for mentor demonstrations.
     */
    @Transactional
    public String executeTamper(TamperRequest req) {
        String type = req.tamperType();
        recordTamperEvent();

        if ("CORRUPT_BLOCK_HASH".equalsIgnoreCase(type)) {
            Long index = req.targetBlockIndex() != null ? req.targetBlockIndex() : 1L;
            Optional<LedgerBlockEntity> blockOpt = ledgerBlockRepository.findByBlockIndex(index);
            if (blockOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target Block #" + index + " not found");
            }
            LedgerBlockEntity block = blockOpt.get();
            // Invert the first characters of the block's currentHash to break the SHA-256 seal
            String originalHash = block.getCurrentHash();
            String corruptedHash = (originalHash.startsWith("deadbeef"))
                    ? "cafebabe" + originalHash.substring(8)
                    : "deadbeef" + originalHash.substring(8);
            block.setCurrentHash(corruptedHash);
            ledgerBlockRepository.save(block);
            return "ADVERSARIAL SIMULATION SUCCESS: Block #" + index + " currentHash maliciously altered in database.";
        }

        if ("CORRUPT_PAYLOAD".equalsIgnoreCase(type)) {
            String messageId = req.targetMessageId();
            Optional<EncryptedPayloadEntity> payloadOpt = (messageId != null && !messageId.isEmpty())
                    ? encryptedPayloadRepository.findByMessageId(messageId)
                    : encryptedPayloadRepository.findAll().stream().findFirst();

            if (payloadOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No encrypted payload available to tamper with");
            }

            EncryptedPayloadEntity payload = payloadOpt.get();
            // Flip characters in the Base64 ciphertext
            String originalCipher = payload.getCipherText();
            String corruptedCipher = (originalCipher.startsWith("AAAA"))
                    ? "ZZZZ" + originalCipher.substring(4)
                    : "AAAA" + (originalCipher.length() > 4 ? originalCipher.substring(4) : "X9==");
            payload.setCipherText(corruptedCipher);
            encryptedPayloadRepository.save(payload);

            return "ADVERSARIAL SIMULATION SUCCESS: Encrypted ciphertext for Message [" + payload.getMessageId() +
                    "] tampered in storage. This will trigger both Ledger Payload Hash mismatch and AES-GCM AEAD Tag rejection!";
        }

        if ("REPLAY_ATTACK".equalsIgnoreCase(type)) {
            return "SIMULATION READY: Transmit a message using an existing Message ID or identical sequence nonce. The backend replay guard will intercept it.";
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown tamper action type: " + type);
    }

    /**
     * Repairs and recalculates cryptographic validity for clean state demonstration.
     */
    @Transactional
    public String repairLedger() {
        ledgerService.repairOrRebuildLedger();
        return "TACTICAL RESTORATION COMPLETE: All cryptographic links and block headers repaired and verified against stored payloads.";
    }
}
