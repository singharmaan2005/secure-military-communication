package mil.fieldlink.service;

import mil.fieldlink.dto.IntegrityReportDto;
import mil.fieldlink.dto.SystemMetricsDto;
import mil.fieldlink.repository.EncryptedPayloadRepository;
import mil.fieldlink.repository.LedgerBlockRepository;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class MetricsService {

    private final EncryptedPayloadRepository encryptedPayloadRepository;
    private final LedgerBlockRepository ledgerBlockRepository;
    private final LedgerService ledgerService;
    private final MessageService messageService;
    private final TamperService tamperService;

    public MetricsService(EncryptedPayloadRepository encryptedPayloadRepository,
                          LedgerBlockRepository ledgerBlockRepository,
                          LedgerService ledgerService,
                          MessageService messageService,
                          TamperService tamperService) {
        this.encryptedPayloadRepository = encryptedPayloadRepository;
        this.ledgerBlockRepository = ledgerBlockRepository;
        this.ledgerService = ledgerService;
        this.messageService = messageService;
        this.tamperService = tamperService;
    }

    public SystemMetricsDto getSystemMetrics() {
        long totalMessages = encryptedPayloadRepository.count();
        long ledgerHeight = ledgerBlockRepository.count();

        IntegrityReportDto integrity = ledgerService.verifyChainIntegrity();

        Set<String> callsigns = new HashSet<>();
        callsigns.add("TACTICAL-HQ");
        callsigns.add("ALPHA-BASE");
        callsigns.add("FORWARD-OP-1");
        callsigns.add("RECON-EAGLE");
        callsigns.add("TACTICAL-CP");

        encryptedPayloadRepository.findAll().forEach(p -> {
            callsigns.add(p.getSenderCallsign());
            callsigns.add(p.getRecipientCallsign());
        });

        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        long minutes = TimeUnit.MILLISECONDS.toMinutes(uptimeMillis);
        long seconds = TimeUnit.MILLISECONDS.toSeconds(uptimeMillis) % 60;
        String uptimeStr = String.format("%02d:%02d operational", minutes, seconds);

        return new SystemMetricsDto(
                totalMessages,
                ledgerHeight,
                integrity.isValid(),
                messageService.getReplayAttemptsBlockedCount(),
                tamperService.getTamperedEventsCount(),
                callsigns.size(),
                uptimeStr,
                "RESTRICTED // SIMULATION",
                "LOCAL HASH-LINKED LEDGER SIMULATION"
        );
    }
}
