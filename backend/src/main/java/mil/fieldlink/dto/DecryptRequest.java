package mil.fieldlink.dto;

import jakarta.validation.constraints.NotBlank;

public record DecryptRequest(
    @NotBlank(message = "Message ID is required")
    String messageId,

    @NotBlank(message = "Tactical key is required for decryption")
    String tacticalKey
) {}
