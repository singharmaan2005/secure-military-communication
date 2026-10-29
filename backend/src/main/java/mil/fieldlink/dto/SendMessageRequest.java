package mil.fieldlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    String messageId,

    @NotBlank(message = "Sender callsign is required")
    @Size(max = 32, message = "Sender callsign max length is 32")
    String senderCallsign,

    @NotBlank(message = "Recipient callsign is required")
    @Size(max = 32, message = "Recipient callsign max length is 32")
    String recipientCallsign,

    String classification, // RESTRICTED, CONFIDENTIAL, SECRET
    String priority,       // ROUTINE, PRIORITY, FLASH

    @NotBlank(message = "Message plaintext payload cannot be empty")
    String plainTextContent,

    String tacticalKey,     // Operator passkey/tactical secret
    String keyIdentifier,  // e.g., KEY-BRAVO-2026
    Long sequenceNonce     // Operator sequence nonce for replay protection
) {}
