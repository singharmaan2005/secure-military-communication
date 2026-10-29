package mil.fieldlink.dto;

import java.util.List;

public record BatchSyncResponse(
    int totalReceived,
    int successfullySynced,
    int duplicatesBlocked,
    List<String> auditLogs,
    long currentLedgerHeight
) {}
