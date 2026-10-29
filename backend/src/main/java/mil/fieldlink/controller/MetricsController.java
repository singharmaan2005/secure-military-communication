package mil.fieldlink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mil.fieldlink.dto.SystemMetricsDto;
import mil.fieldlink.service.MetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metrics")
@Tag(name = "System Telemetry", description = "Operational telemetry, health metrics, and ledger parameters")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping
    @Operation(summary = "Get system telemetry",
               description = "Returns active unit count, ledger height, chain integrity status, replay attempts blocked, and uptime.")
    public ResponseEntity<SystemMetricsDto> getMetrics() {
        return ResponseEntity.ok(metricsService.getSystemMetrics());
    }
}
