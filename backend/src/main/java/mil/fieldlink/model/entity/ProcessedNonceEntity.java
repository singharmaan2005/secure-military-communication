package mil.fieldlink.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "processed_nonces", indexes = {
    @Index(name = "idx_nonce_signature", columnList = "nonceSignature", unique = true),
    @Index(name = "idx_processed_msg_id", columnList = "messageId", unique = true)
})
public class ProcessedNonceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String messageId;

    @Column(nullable = false, unique = true, length = 128)
    private String nonceSignature; // Hash of (sender + recipient + sequenceNonce + ivNonce)

    @Column(nullable = false, length = 32)
    private String senderCallsign;

    @Column(nullable = false)
    private Long sequenceNonce;

    @Column(nullable = false)
    private Instant processedAt;

    public ProcessedNonceEntity() {
    }

    public ProcessedNonceEntity(String messageId, String nonceSignature, String senderCallsign, Long sequenceNonce, Instant processedAt) {
        this.messageId = messageId;
        this.nonceSignature = nonceSignature;
        this.senderCallsign = senderCallsign;
        this.sequenceNonce = sequenceNonce;
        this.processedAt = processedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getNonceSignature() {
        return nonceSignature;
    }

    public void setNonceSignature(String nonceSignature) {
        this.nonceSignature = nonceSignature;
    }

    public String getSenderCallsign() {
        return senderCallsign;
    }

    public void setSenderCallsign(String senderCallsign) {
        this.senderCallsign = senderCallsign;
    }

    public Long getSequenceNonce() {
        return sequenceNonce;
    }

    public void setSequenceNonce(Long sequenceNonce) {
        this.sequenceNonce = sequenceNonce;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }
}
