package mil.fieldlink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mil.fieldlink.dto.TamperRequest;
import mil.fieldlink.service.TamperService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tamper")
@Tag(name = "Adversarial Simulation", description = "Controlled red-team attack simulation for evaluating tamper detection and cryptographic alerts")
public class TamperController {

    private final TamperService tamperService;

    public TamperController(TamperService tamperService) {
        this.tamperService = tamperService;
    }

    @PostMapping("/execute")
    @Operation(summary = "Inject controlled tampering",
               description = "Allows mentors to test security by deliberately altering a block hash or payload ciphertext in the database.")
    public ResponseEntity<String> executeTamper(@Valid @RequestBody TamperRequest req) {
        String outcome = tamperService.executeTamper(req);
        return ResponseEntity.ok(outcome);
    }

    @PostMapping("/restore")
    @Operation(summary = "Restore cryptographic state",
               description = "Re-computes correct cryptographic hashes across the ledger to return to verified state.")
    public ResponseEntity<String> restoreState() {
        String msg = tamperService.repairLedger();
        return ResponseEntity.ok(msg);
    }
}
