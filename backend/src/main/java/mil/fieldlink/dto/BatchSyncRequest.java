package mil.fieldlink.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BatchSyncRequest(
    @NotNull(message = "Queued messages list cannot be null")
    @Valid
    List<SendMessageRequest> queuedMessages
) {}
