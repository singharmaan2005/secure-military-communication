package mil.fieldlink.service;

import jakarta.annotation.PostConstruct;
import mil.fieldlink.crypto.CryptoService;
import mil.fieldlink.dto.BlockAuditDetail;
import mil.fieldlink.dto.IntegrityReportDto;
import mil.fieldlink.dto.LedgerBlockDto;
import mil.fieldlink.model.entity.EncryptedPayloadEntity;
import mil.fieldlink.model.entity.LedgerBlockEntity;
import mil.fieldlink.repository.EncryptedPayloadRepository;
import mil.fieldlink.repository.LedgerBlockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LedgerService {

    public static final String GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final LedgerBlockRepository ledgerBlockRepository;
    private final EncryptedPayloadRepository encryptedPayloadRepository;
    private final CryptoService cryptoService;

    public LedgerService(LedgerBlockRepository ledgerBlockRepository,
                         EncryptedPayloadRepository encryptedPayloadRepository,
                         CryptoService cryptoService) {
        this.ledgerBlockRepository = ledgerBlockRepository;
        this.encryptedPayloadRepository = encryptedPayloadRepository;
        this.cryptoService = cryptoService;
    }

    @PostConstruct
    @Transactional
    public void initGenesisBlockIfNeeded() {
        if (ledgerBlockRepository.count() == 0) {
            Instant genesisTime = Instant.parse("2026-10-28T00:00:00Z");
            String payloadHash = cryptoService.sha256Hex("GENESIS_TACTICAL_NETWORK_ROOT_INITIALIZED");
            String currentHash = cryptoService.computeBlockHash(
                    0L,
                    GENESIS_PREV_HASH,
                    genesisTime.toString(),
                    payloadHash,
                    0L,
                    "TACTICAL-HQ",
                    "BROADCAST"
            );

            LedgerBlockEntity genesis = new LedgerBlockEntity(
                    0L,
                    GENESIS_PREV_HASH,
                    currentHash,
                    payloadHash,
                    "MSG-GENESIS-ROOT",
                    "TACTICAL-HQ",
                    "BROADCAST",
                    0L,
                    genesisTime,
                    "GENESIS"
            );
            ledgerBlockRepository.save(genesis);
        }
    }

    @Transactional
    public synchronized LedgerBlockEntity appendMessageBlock(EncryptedPayloadEntity payload, Long sequenceNonce) {
        LedgerBlockEntity latestBlock = ledgerBlockRepository.findTopByOrderByBlockIndexDesc()
                .orElseThrow(() -> new IllegalStateException("Genesis block missing from simulated ledger"));

        long nextIndex = latestBlock.getBlockIndex() + 1;
        String prevHash = latestBlock.getCurrentHash();
        Instant now = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        String payloadHash = cryptoService.computePayloadHash(payload.getCipherText(), payload.getIvNonce());

        long effectiveNonce = sequenceNonce != null ? sequenceNonce : System.currentTimeMillis();

        String currentHash = cryptoService.computeBlockHash(
                nextIndex,
                prevHash,
                now.toString(),
                payloadHash,
                effectiveNonce,
                payload.getSenderCallsign(),
                payload.getRecipientCallsign()
        );

        LedgerBlockEntity block = new LedgerBlockEntity(
                nextIndex,
                prevHash,
                currentHash,
                payloadHash,
                payload.getMessageId(),
                payload.getSenderCallsign(),
                payload.getRecipientCallsign(),
                effectiveNonce,
                now,
                "TACTICAL_TRANSMISSION"
        );

        return ledgerBlockRepository.save(block);
    }

    public List<LedgerBlockDto> getAllBlocks() {
        return ledgerBlockRepository.findAllByOrderByBlockIndexAsc().stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<LedgerBlockDto> getBlockByIndex(Long index) {
        return ledgerBlockRepository.findByBlockIndex(index).map(this::toDto);
    }

    public long getLedgerHeight() {
        return ledgerBlockRepository.count();
    }

    /**
     * Conducts a cryptographic verification of the entire hash-linked ledger.
     */
    public IntegrityReportDto verifyChainIntegrity() {
        List<LedgerBlockEntity> blocks = ledgerBlockRepository.findAllByOrderByBlockIndexAsc();
        List<BlockAuditDetail> auditDetails = new ArrayList<>();

        boolean overallValid = true;
        Long firstCorruptedIndex = null;
        int compromisedCount = 0;

        LedgerBlockEntity previousBlock = null;

        for (LedgerBlockEntity block : blocks) {
            boolean hashValid = true;
            boolean prevHashValid = true;
            boolean payloadHashValid = true;
            StringBuilder diagnosis = new StringBuilder();

            // 1. Verify previous hash linkage
            String expectedPrevHash = (previousBlock == null) ? GENESIS_PREV_HASH : previousBlock.getCurrentHash();
            if (!block.getPreviousHash().equals(expectedPrevHash)) {
                prevHashValid = false;
                diagnosis.append("Chain broken: previousHash mismatch (expected: ")
                         .append(expectedPrevHash.substring(0, 10))
                         .append("... but recorded: ")
                         .append(block.getPreviousHash().substring(0, 10))
                         .append("...). ");
            }

            // 2. Re-compute block hash
            String expectedBlockHash = cryptoService.computeBlockHash(
                    block.getBlockIndex(),
                    block.getPreviousHash(),
                    block.getTimestamp().toString(),
                    block.getPayloadHash(),
                    block.getSequenceNonce(),
                    block.getSenderCallsign(),
                    block.getRecipientCallsign()
            );

            if (!block.getCurrentHash().equals(expectedBlockHash)) {
                hashValid = false;
                diagnosis.append("Block header corrupted: SHA-256 mismatch. ");
            }

            // 3. Verify payload immutability if it is a tactical transmission
            String recordedPayloadHash = block.getPayloadHash();
            String expectedPayloadHash = recordedPayloadHash;

            if (!"GENESIS".equals(block.getBlockType())) {
                Optional<EncryptedPayloadEntity> payloadOpt = encryptedPayloadRepository.findByMessageId(block.getMessageId());
                if (payloadOpt.isEmpty()) {
                    payloadHashValid = false;
                    diagnosis.append("Encrypted payload missing for message ").append(block.getMessageId()).append(". ");
                } else {
                    EncryptedPayloadEntity payload = payloadOpt.get();
                    expectedPayloadHash = cryptoService.computePayloadHash(payload.getCipherText(), payload.getIvNonce());
                    if (!recordedPayloadHash.equals(expectedPayloadHash)) {
                        payloadHashValid = false;
                        diagnosis.append("Payload tampering detected: Ciphertext/IV SHA-256 does not match ledger record! ");
                    }
                }
            }

            boolean blockValid = hashValid && prevHashValid && payloadHashValid;
            if (!blockValid) {
                overallValid = false;
                compromisedCount++;
                if (firstCorruptedIndex == null) {
                    firstCorruptedIndex = block.getBlockIndex();
                }
            } else {
                diagnosis.append("Cryptographically verified. Hashes and payload immutability intact.");
            }

            auditDetails.add(new BlockAuditDetail(
                    block.getBlockIndex(),
                    hashValid,
                    prevHashValid,
                    payloadHashValid,
                    block.getCurrentHash(),
                    expectedBlockHash,
                    block.getPreviousHash(),
                    expectedPrevHash,
                    recordedPayloadHash,
                    expectedPayloadHash,
                    diagnosis.toString()
            ));

            previousBlock = block;
        }

        String summary = overallValid
                ? "LEDGER INTEGRITY VERIFIED: All " + blocks.size() + " blocks cryptographically sound. No tampering detected."
                : "COMPROMISE ALERT: " + compromisedCount + " block(s) corrupted. First failure at Block #" + firstCorruptedIndex + ".";

        return new IntegrityReportDto(
                overallValid,
                blocks.size(),
                firstCorruptedIndex,
                compromisedCount,
                summary,
                auditDetails
        );
    }

    /**
     * Resets or repairs the ledger by re-computing all hashes from Genesis forward.
     */
    @Transactional
    public void repairOrRebuildLedger() {
        List<LedgerBlockEntity> blocks = ledgerBlockRepository.findAllByOrderByBlockIndexAsc();
        String previousHash = GENESIS_PREV_HASH;

        for (LedgerBlockEntity block : blocks) {
            if ("GENESIS".equals(block.getBlockType())) {
                block.setPreviousHash(GENESIS_PREV_HASH);
                String pHash = cryptoService.sha256Hex("GENESIS_TACTICAL_NETWORK_ROOT_INITIALIZED");
                block.setPayloadHash(pHash);
                String cHash = cryptoService.computeBlockHash(
                        0L,
                        GENESIS_PREV_HASH,
                        block.getTimestamp().toString(),
                        pHash,
                        0L,
                        block.getSenderCallsign(),
                        block.getRecipientCallsign()
                );
                block.setCurrentHash(cHash);
                previousHash = cHash;
            } else {
                block.setPreviousHash(previousHash);
                // Synchronize payload hash with actual stored payload if exists
                Optional<EncryptedPayloadEntity> pOpt = encryptedPayloadRepository.findByMessageId(block.getMessageId());
                if (pOpt.isPresent()) {
                    String pHash = cryptoService.computePayloadHash(pOpt.get().getCipherText(), pOpt.get().getIvNonce());
                    block.setPayloadHash(pHash);
                }
                String cHash = cryptoService.computeBlockHash(
                        block.getBlockIndex(),
                        previousHash,
                        block.getTimestamp().toString(),
                        block.getPayloadHash(),
                        block.getSequenceNonce(),
                        block.getSenderCallsign(),
                        block.getRecipientCallsign()
                );
                block.setCurrentHash(cHash);
                previousHash = cHash;
            }
            ledgerBlockRepository.save(block);
        }
    }

    private LedgerBlockDto toDto(LedgerBlockEntity e) {
        return new LedgerBlockDto(
                e.getBlockIndex(),
                e.getPreviousHash(),
                e.getCurrentHash(),
                e.getPayloadHash(),
                e.getMessageId(),
                e.getSenderCallsign(),
                e.getRecipientCallsign(),
                e.getSequenceNonce(),
                e.getTimestamp(),
                e.getBlockType()
        );
    }
}
