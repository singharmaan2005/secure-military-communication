package mil.fieldlink.dto;

import jakarta.validation.constraints.NotBlank;

public record TamperRequest(
    @NotBlank(message = "Tamper action type is required")
    String tamperType, // CORRUPT_BLOCK_HASH, CORRUPT_PAYLOAD, REPLAY_ATTACK

    Long targetBlockIndex,
    String targetMessageId,
    String injectedValue
) {}
