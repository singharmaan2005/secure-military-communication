package mil.fieldlink.dto;

import java.util.List;

public record IntegrityReportDto(
    boolean isValid,
    long totalBlocks,
    Long firstCorruptedBlockIndex,
    int compromisedBlocksCount,
    String statusSummary,
    List<BlockAuditDetail> auditDetails
) {}
