package mil.fieldlink.dto;

public record SystemMetricsDto(
    long totalMessages,
    long ledgerHeight,
    boolean chainIntegrityValid,
    long replayAttemptsBlocked,
    long tamperedEventsDetected,
    int activeUnitsCount,
    String systemUptime,
    String classificationLabel,
    String ledgerTypeLabel
) {}
