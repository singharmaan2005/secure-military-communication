package mil.fieldlink.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ledger_blocks", indexes = {
    @Index(name = "idx_ledger_block_index", columnList = "blockIndex", unique = true),
    @Index(name = "idx_ledger_msg_id", columnList = "messageId")
})
public class LedgerBlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long blockIndex;

    @Column(nullable = false, length = 64)
    private String previousHash; // 64-char hex SHA-256

    @Column(nullable = false, length = 64)
    private String currentHash; // 64-char hex SHA-256

    @Column(nullable = false, length = 64)
    private String payloadHash; // SHA-256 of encrypted ciphertext + IV (NO PLAINTEXT ON LEDGER)

    @Column(nullable = false, length = 64)
    private String messageId; // Reference to encrypted payload

    @Column(nullable = false, length = 32)
    private String senderCallsign;

    @Column(nullable = false, length = 32)
    private String recipientCallsign;

    @Column(nullable = false)
    private Long sequenceNonce;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, length = 24)
    private String blockType; // GENESIS, TACTICAL_TRANSMISSION

    public LedgerBlockEntity() {
    }

    public LedgerBlockEntity(Long blockIndex, String previousHash, String currentHash,
                             String payloadHash, String messageId, String senderCallsign,
                             String recipientCallsign, Long sequenceNonce, Instant timestamp,
                             String blockType) {
        this.blockIndex = blockIndex;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.payloadHash = payloadHash;
        this.messageId = messageId;
        this.senderCallsign = senderCallsign;
        this.recipientCallsign = recipientCallsign;
        this.sequenceNonce = sequenceNonce;
        this.timestamp = timestamp;
        this.blockType = blockType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBlockIndex() {
        return blockIndex;
    }

    public void setBlockIndex(Long blockIndex) {
        this.blockIndex = blockIndex;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public void setCurrentHash(String currentHash) {
        this.currentHash = currentHash;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public void setPayloadHash(String payloadHash) {
        this.payloadHash = payloadHash;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getSenderCallsign() {
        return senderCallsign;
    }

    public void setSenderCallsign(String senderCallsign) {
        this.senderCallsign = senderCallsign;
    }

    public String getRecipientCallsign() {
        return recipientCallsign;
    }

    public void setRecipientCallsign(String recipientCallsign) {
        this.recipientCallsign = recipientCallsign;
    }

    public Long getSequenceNonce() {
        return sequenceNonce;
    }

    public void setSequenceNonce(Long sequenceNonce) {
        this.sequenceNonce = sequenceNonce;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getBlockType() {
        return blockType;
    }

    public void setBlockType(String blockType) {
        this.blockType = blockType;
    }
}
