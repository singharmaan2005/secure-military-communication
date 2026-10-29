package mil.fieldlink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mil.fieldlink.dto.IntegrityReportDto;
import mil.fieldlink.dto.LedgerBlockDto;
import mil.fieldlink.service.LedgerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ledger")
@Tag(name = "Simulated Ledger", description = "Local hash-linked blockchain simulation and integrity auditing operations")
public class LedgerController {

    private final LedgerService ledgerService;

    public LedgerController(LedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping("/blocks")
    @Operation(summary = "List all ledger blocks",
               description = "Returns simulated blockchain blocks from Genesis (Block 0) to tip. Plaintext is not stored on blocks.")
    public ResponseEntity<List<LedgerBlockDto>> getAllBlocks() {
        return ResponseEntity.ok(ledgerService.getAllBlocks());
    }

    @GetMapping("/blocks/{index}")
    @Operation(summary = "Get single block details",
               description = "Inspect block headers, previous hash, current hash, and payload SHA-256 hash.")
    public ResponseEntity<LedgerBlockDto> getBlockByIndex(@PathVariable Long index) {
        return ledgerService.getBlockByIndex(index)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/verify")
    @Operation(summary = "Verify ledger integrity",
               description = "Conducts full cryptographic SHA-256 audit validating previousHash linkages and payload immutability against the encrypted store.")
    public ResponseEntity<IntegrityReportDto> verifyLedger() {
        return ResponseEntity.ok(ledgerService.verifyChainIntegrity());
    }

    @PostMapping("/repair")
    @Operation(summary = "Repair ledger chain",
               description = "Recalculates block hashes and linkages across the chain to restore verified state after a tampering demonstration.")
    public ResponseEntity<String> repairLedger() {
        ledgerService.repairOrRebuildLedger();
        return ResponseEntity.ok("Ledger successfully repaired and re-hashed.");
    }
}
