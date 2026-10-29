package mil.fieldlink.dto;

public record BlockAuditDetail(
    Long blockIndex,
    boolean hashValid,
    boolean prevHashValid,
    boolean payloadHashValid,
    String recordedHash,
    String expectedHash,
    String recordedPrevHash,
    String expectedPrevHash,
    String recordedPayloadHash,
    String expectedPayloadHash,
    String diagnosis
) {}
