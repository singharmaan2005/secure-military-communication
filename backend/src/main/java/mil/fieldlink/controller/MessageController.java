package mil.fieldlink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import mil.fieldlink.dto.*;
import mil.fieldlink.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@Tag(name = "Tactical Messaging", description = "Secure military message encryption, transmission, and retrieval operations")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/send")
    @Operation(summary = "Transmit secure message",
               description = "Encrypts plaintext with AES-256-GCM using a fresh 96-bit nonce, stores encrypted payload, links payload SHA-256 hash to ledger, and guards against replays.")
    public ResponseEntity<MessageDto> sendMessage(@Valid @RequestBody SendMessageRequest req) {
        MessageDto sent = messageService.sendMessage(req);
        return ResponseEntity.ok(sent);
    }

    @PostMapping("/sync-queue")
    @Operation(summary = "Synchronize offline transmission queue",
               description = "Processes batch transmissions recorded during tactical radio silence / offline operation, enforcing cryptographic replay checks.")
    public ResponseEntity<BatchSyncResponse> syncQueue(@Valid @RequestBody BatchSyncRequest req) {
        BatchSyncResponse res = messageService.syncQueue(req);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/decrypt")
    @Operation(summary = "Decrypt incoming transmission",
               description = "Performs authenticated AES-256-GCM decryption. Fails with authentication tag error if tampered or unauthorized key.")
    public ResponseEntity<DecryptResponse> decryptMessage(@Valid @RequestBody DecryptRequest req) {
        DecryptResponse res = messageService.decryptMessage(req);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/inbox")
    @Operation(summary = "Retrieve tactical message list",
               description = "Fetches list of encrypted transmissions with ledger block references. Plaintext is never exposed in the ledger.")
    public ResponseEntity<List<MessageDto>> getInbox(@RequestParam(required = false) String recipient) {
        List<MessageDto> inbox = messageService.getInbox(recipient);
        return ResponseEntity.ok(inbox);
    }
}
