package mil.fieldlink.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "encrypted_payloads", indexes = {
    @Index(name = "idx_payload_msg_id", columnList = "messageId", unique = true),
    @Index(name = "idx_payload_recipient", columnList = "recipientCallsign")
})
public class EncryptedPayloadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String messageId;

    @Column(nullable = false, length = 32)
    private String senderCallsign;

    @Column(nullable = false, length = 32)
    private String recipientCallsign;

    @Column(nullable = false, length = 24)
    private String classification; // RESTRICTED, CONFIDENTIAL, SECRET

    @Column(nullable = false, length = 16)
    private String priority; // ROUTINE, PRIORITY, FLASH

    @Column(nullable = false, columnDefinition = "TEXT")
    private String cipherText; // Base64 encoded AES-256-GCM ciphertext + tag

    @Column(nullable = false, length = 64)
    private String ivNonce; // Base64 encoded 12-byte fresh IV

    @Column(nullable = false)
    private int authTagLength; // 128 bits

    @Column(nullable = false, length = 64)
    private String keyIdentifier; // e.g., KEY-TACTICAL-ORION

    @Column(nullable = false)
    private Instant createdAt;

    public EncryptedPayloadEntity() {
    }

    public EncryptedPayloadEntity(String messageId, String senderCallsign, String recipientCallsign,
                                  String classification, String priority, String cipherText,
                                  String ivNonce, int authTagLength, String keyIdentifier, Instant createdAt) {
        this.messageId = messageId;
        this.senderCallsign = senderCallsign;
        this.recipientCallsign = recipientCallsign;
        this.classification = classification;
        this.priority = priority;
        this.cipherText = cipherText;
        this.ivNonce = ivNonce;
        this.authTagLength = authTagLength;
        this.keyIdentifier = keyIdentifier;
        this.createdAt = createdAt;
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

    public String getClassification() {
        return classification;
    }

    public void setClassification(String classification) {
        this.classification = classification;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getCipherText() {
        return cipherText;
    }

    public void setCipherText(String cipherText) {
        this.cipherText = cipherText;
    }

    public String getIvNonce() {
        return ivNonce;
    }

    public void setIvNonce(String ivNonce) {
        this.ivNonce = ivNonce;
    }

    public int getAuthTagLength() {
        return authTagLength;
    }

    public void setAuthTagLength(int authTagLength) {
        this.authTagLength = authTagLength;
    }

    public String getKeyIdentifier() {
        return keyIdentifier;
    }

    public void setKeyIdentifier(String keyIdentifier) {
        this.keyIdentifier = keyIdentifier;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
