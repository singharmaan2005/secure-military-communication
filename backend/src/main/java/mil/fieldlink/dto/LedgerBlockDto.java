package mil.fieldlink.dto;

import java.time.Instant;

public record LedgerBlockDto(
    Long blockIndex,
    String previousHash,
    String currentHash,
    String payloadHash,
    String messageId,
    String senderCallsign,
    String recipientCallsign,
    Long sequenceNonce,
    Instant timestamp,
    String blockType
) {}
