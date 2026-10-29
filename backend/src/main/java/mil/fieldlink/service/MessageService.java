package mil.fieldlink.service;

import mil.fieldlink.crypto.CryptoService;
import mil.fieldlink.dto.*;
import mil.fieldlink.model.entity.EncryptedPayloadEntity;
import mil.fieldlink.model.entity.LedgerBlockEntity;
import mil.fieldlink.model.entity.ProcessedNonceEntity;
import mil.fieldlink.repository.EncryptedPayloadRepository;
import mil.fieldlink.repository.LedgerBlockRepository;
import mil.fieldlink.repository.ProcessedNonceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MessageService {

    private final EncryptedPayloadRepository encryptedPayloadRepository;
    private final LedgerBlockRepository ledgerBlockRepository;
    private final ProcessedNonceRepository processedNonceRepository;
    private final CryptoService cryptoService;
    private final LedgerService ledgerService;

    // Counter for telemetry
    private long replayAttemptsBlockedCount = 0;

    public MessageService(EncryptedPayloadRepository encryptedPayloadRepository,
                          LedgerBlockRepository ledgerBlockRepository,
                          ProcessedNonceRepository processedNonceRepository,
                          CryptoService cryptoService,
                          LedgerService ledgerService) {
        this.encryptedPayloadRepository = encryptedPayloadRepository;
        this.ledgerBlockRepository = ledgerBlockRepository;
        this.processedNonceRepository = processedNonceRepository;
        this.cryptoService = cryptoService;
        this.ledgerService = ledgerService;
    }

    public synchronized long getReplayAttemptsBlockedCount() {
        return replayAttemptsBlockedCount;
    }

    public synchronized void incrementReplayBlockedCount() {
        replayAttemptsBlockedCount++;
    }

    @Transactional
    public MessageDto sendMessage(SendMessageRequest req) {
        String messageId = (req.messageId() != null && !req.messageId().trim().isEmpty())
                ? req.messageId().trim()
                : "MSG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Replay & Duplicate Detection: check Message ID
        if (processedNonceRepository.existsByMessageId(messageId)) {
            incrementReplayBlockedCount();
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "REPLAY ATTACK REJECTED: Message ID [" + messageId + "] has already been transmitted and verified on the ledger.");
        }

        long sequenceNonce = (req.sequenceNonce() != null) ? req.sequenceNonce() : System.currentTimeMillis();

        // 2. Encrypt plaintext using AES-256-GCM with fresh 96-bit nonce
        CryptoService.EncryptionResult encryption;
        try {
            encryption = cryptoService.encrypt(
                    req.plainTextContent(),
                    req.tacticalKey(),
                    req.keyIdentifier()
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Cryptographic processing failed: " + e.getMessage(), e);
        }

        // 3. Verify Nonce Signature to prevent cryptographic replay
        String nonceSig = cryptoService.computeNonceSignature(
                req.senderCallsign(),
                req.recipientCallsign(),
                sequenceNonce,
                encryption.ivNonceBase64()
        );

        if (processedNonceRepository.existsByNonceSignature(nonceSig)) {
            incrementReplayBlockedCount();
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "CRYPTOGRAPHIC REPLAY DETECTED: Nonce signature collision for sender " + req.senderCallsign());
        }

        // 4. Store encrypted payload SEPARATELY from ledger (NO PLAINTEXT PERSISTED)
        Instant now = Instant.now();
        String classification = req.classification() != null ? req.classification() : "RESTRICTED";
        String priority = req.priority() != null ? req.priority() : "ROUTINE";

        EncryptedPayloadEntity payloadEntity = new EncryptedPayloadEntity(
                messageId,
                req.senderCallsign(),
                req.recipientCallsign(),
                classification,
                priority,
                encryption.cipherTextBase64(),
                encryption.ivNonceBase64(),
                encryption.authTagLength(),
                encryption.keyIdentifier(),
                now
        );
        EncryptedPayloadEntity savedPayload = encryptedPayloadRepository.save(payloadEntity);

        // 5. Append hash-linked block to ledger simulation (contains only payload SHA-256 and metadata)
        LedgerBlockEntity block = ledgerService.appendMessageBlock(savedPayload, sequenceNonce);

        // 6. Record processed nonce to guard future transmissions
        ProcessedNonceEntity nonceRecord = new ProcessedNonceEntity(
                messageId,
                nonceSig,
                req.senderCallsign(),
                sequenceNonce,
                now
        );
        processedNonceRepository.save(nonceRecord);

        return new MessageDto(
                savedPayload.getMessageId(),
                savedPayload.getSenderCallsign(),
                savedPayload.getRecipientCallsign(),
                savedPayload.getClassification(),
                savedPayload.getPriority(),
                savedPayload.getCipherText(),
                savedPayload.getIvNonce(),
                savedPayload.getAuthTagLength(),
                savedPayload.getKeyIdentifier(),
                block.getPayloadHash(),
                block.getBlockIndex(),
                block.getCurrentHash(),
                savedPayload.getCreatedAt()
        );
    }

    @Transactional
    public BatchSyncResponse syncQueue(BatchSyncRequest req) {
        int total = req.queuedMessages().size();
        int synced = 0;
        int duplicatesBlocked = 0;
        List<String> auditLogs = new ArrayList<>();

        for (SendMessageRequest queued : req.queuedMessages()) {
            try {
                MessageDto dto = sendMessage(queued);
                synced++;
                auditLogs.add("SYNC SUCCESS: " + dto.messageId() + " (Block #" + dto.blockIndex() + " linked)");
            } catch (ResponseStatusException e) {
                if (e.getStatusCode() == HttpStatus.CONFLICT) {
                    duplicatesBlocked++;
                    auditLogs.add("SYNC WARNING: Blocked duplicate/replay: " + e.getReason());
                } else {
                    auditLogs.add("SYNC ERROR: Message failed - " + e.getReason());
                }
            } catch (Exception e) {
                auditLogs.add("SYNC ERROR: Unexpected failure for message: " + e.getMessage());
            }
        }

        long height = ledgerService.getLedgerHeight();
        return new BatchSyncResponse(total, synced, duplicatesBlocked, auditLogs, height);
    }

    public DecryptResponse decryptMessage(DecryptRequest req) {
        Optional<EncryptedPayloadEntity> payloadOpt = encryptedPayloadRepository.findByMessageId(req.messageId());
        if (payloadOpt.isEmpty()) {
            return DecryptResponse.failure(req.messageId(), "Message ID [" + req.messageId() + "] not found in secure store");
        }

        EncryptedPayloadEntity payload = payloadOpt.get();

        try {
            String plainText = cryptoService.decrypt(payload.getCipherText(), payload.getIvNonce(), req.tacticalKey());
            return DecryptResponse.success(
                    payload.getMessageId(),
                    plainText,
                    payload.getKeyIdentifier(),
                    payload.getClassification(),
                    payload.getPriority()
            );
        } catch (Exception e) {
            return DecryptResponse.failure(
                    req.messageId(),
                    "AUTHENTICATION TAG FAILURE / CORRUPTED: " + e.getClass().getSimpleName() + " - " + e.getMessage()
            );
        }
    }

    public List<MessageDto> getInbox(String recipientFilter) {
        List<EncryptedPayloadEntity> list;
        if (recipientFilter != null && !recipientFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(recipientFilter)) {
            list = encryptedPayloadRepository.findByRecipientCallsignOrderByCreatedAtDesc(recipientFilter.trim());
        } else {
            list = encryptedPayloadRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream().map(payload -> {
            Optional<LedgerBlockEntity> blockOpt = ledgerBlockRepository.findByMessageId(payload.getMessageId());
            Long blockIndex = blockOpt.map(LedgerBlockEntity::getBlockIndex).orElse(null);
            String blockHash = blockOpt.map(LedgerBlockEntity::getCurrentHash).orElse(null);
            String payloadHash = blockOpt.map(LedgerBlockEntity::getPayloadHash).orElse(null);

            return new MessageDto(
                    payload.getMessageId(),
                    payload.getSenderCallsign(),
                    payload.getRecipientCallsign(),
                    payload.getClassification(),
                    payload.getPriority(),
                    payload.getCipherText(),
                    payload.getIvNonce(),
                    payload.getAuthTagLength(),
                    payload.getKeyIdentifier(),
                    payloadHash,
                    blockIndex,
                    blockHash,
                    payload.getCreatedAt()
            );
        }).toList();
    }
}
