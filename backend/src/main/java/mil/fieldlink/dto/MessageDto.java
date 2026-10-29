package mil.fieldlink.dto;

import java.time.Instant;

public record MessageDto(
    String messageId,
    String senderCallsign,
    String recipientCallsign,
    String classification,
    String priority,
    String cipherText,
    String ivNonce,
    int authTagLength,
    String keyIdentifier,
    String payloadHash,
    Long blockIndex,
    String blockHash,
    Instant createdAt
) {}
