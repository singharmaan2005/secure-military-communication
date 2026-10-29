# FIELDLINK // Secure Military Communication Prototype

**B.Tech Major Project:** Secure Military Communication Using Blockchain and Encryption  
**System Designation:** FIELDLINK Tactical Operational Terminal (C2 Node)  
**Evaluation Target:** Demonstrable Prototype for Mentor Review (29 October 2026)  
**Classification:** RESTRICTED // LOCAL PROTOCOL SIMULATION  

---

## 1. Executive Summary & Objective

**FIELDLINK** is a secure tactical communication and command-and-control (C2) operational prototype designed for contested electronic warfare environments. It addresses key vulnerabilities in forward military messaging:
1. **Message Confidentiality & Authenticity:** Implements authenticated **AES-256-GCM** encryption with dynamic key derivation and fresh, unique 96-bit nonces per packet.
2. **Payload-to-Ledger Separation:** Protects operational security by **never storing plaintext messages** on the ledger or database. Stored records consist strictly of Base64 ciphertext and IVs.
3. **Cryptographic Immutability:** Uses an authentic **hash-linked blockchain simulation** where each block seals the SHA-256 digest of the encrypted payload (`payloadHash`) and references the previous block's SHA-256 hash.
4. **Replay & Injection Defense:** Enforces strict sequence and cryptographic nonce-signature filters, rejecting replayed or duplicate message packets with HTTP 409 Conflict.
5. **Electronic Warfare Resilience:** Simulates tactical **Radio Silence (Offline mode)**, allowing operators to enqueue encrypted packets locally in persistent browser storage and batch-synchronize them when communication uplink is restored.
6. **Integrity Auditing & Adversarial Red-Team Simulator:** Provides built-in cryptographic audit and controlled tampering simulation for mentor evaluation.

> [!NOTE]  
> **Simulation Disclaimer:** As labeled across the dashboard, the ledger engine operates as an authentic local hash-linked blockchain simulation tailored for low-latency tactical edge nodes, not a high-overhead proof-of-work/distributed consensus network.

---

## 2. Technology Stack

| Layer | Technologies | Key Specifications |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS | Custom military palette (`#F3F2EC` warm ivory, `#252923` graphite, `#69745D` muted olive, `#A65F43` muted rust), IBM Plex Sans & IBM Plex Mono typography, Lucide tactical icons. |
| **Backend** | Java 21 / 22, Spring Boot 3.3.4, Maven | RESTful C2 services, Spring Data JPA, Jakarta Validation, Springdoc OpenAPI 2.6.0. |
| **Database** | H2 Database Engine | Persistent file storage at `./data/fieldlinkdb` with isolated in-memory test configuration. |
| **Cryptography** | Java Cryptography Extension (JCE) | `AES/GCM/NoPadding` (256-bit), 96-bit (12-byte) `SecureRandom` IV, 128-bit AEAD tag, SHA-256 digests. |
| **API Docs** | Swagger UI / OpenAPI 3 | Interactive testing console at `http://localhost:8080/swagger-ui.html`. |

---

## 3. Cryptographic & Architectural Design

### 3.1 Separate Storage Architecture

```
+---------------------------------------------------------------------------------------+
|                               FIELDLINK C2 ENGINE                                      |
+---------------------------------------------------------------------------------------+
                                  |
            [ Incoming Message: Plaintext + Tactical Key Slot ]
                                  |
                     AES-256-GCM Authenticated Encryption
                     + Fresh 96-bit SecureRandom Nonce
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+--------------------------+               +--------------------------+
|  ENCRYPTED PAYLOAD STORE |               |  HASH-LINKED LEDGER      |
|  (encrypted_payloads)    |               |  (ledger_blocks)         |
+--------------------------+               +--------------------------+
| - messageId: MSG-xxx     |               | - blockIndex: #1         |
| - sender: ALPHA-BASE     |               | - prevHash: SHA256(...)  |
| - recipient: FORWARD-1   |               | - currentHash: SHA256(.) |
| - cipherText: Base64     |               | - payloadHash: SHA256(   |
| - ivNonce: Base64 (12B)  |               |     cipherText + ivNonce |
| - authTagLength: 128     |               |   )                      |
| - keyIdentifier: KEY-01  |               | - messageId: MSG-xxx     |
|   (NO PLAINTEXT SAVED)   |               | - sender / recipient     |
+--------------------------+               | - sequenceNonce          |
                                           |   (NO PLAINTEXT ON BLOCK)|
                                           +--------------------------+
```

### 3.2 Block Hash Formula
Every block's SHA-256 hash is computed using:
```
currentHash = SHA-256(
    blockIndex + "|" +
    previousHash + "|" +
    timestampIso + "|" +
    payloadHash + "|" +
    sequenceNonce + "|" +
    senderCallsign + "|" +
    recipientCallsign
)
```

Where `payloadHash = SHA-256(cipherTextBase64 + ":" + ivNonceBase64)`.

---

## 4. Quick Start & Execution Guide

### 4.1 Prerequisites
- **Java:** JDK 21 or newer (`java -version`)
- **Maven:** Version 3.8+ (`mvn -v`)
- **Node.js:** v18+ or v20+ (`node -v`)
- **npm:** v9+ or v10+ (`npm -v`)

### 4.2 Running the Backend (Spring Boot)
1. Open a terminal in the `backend/` directory:
   ```bash
   cd c:\projects\Major_Project\backend
   ```
2. Run backend tests to verify cryptographic engines and ledger linking:
   ```bash
   mvn test
   ```
   *(All 9 unit and integration tests will execute and pass)*
3. Launch the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
4. The backend starts on port **8080**:
   - Health / Metrics: `http://localhost:8080/api/metrics`
   - Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
   - OpenAPI v3 JSON: `http://localhost:8080/api-docs`
   - H2 Database Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/fieldlinkdb`, User: `sa`, Password: blank)

### 4.3 Running the Frontend (React + Vite + TypeScript)
1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd c:\projects\Major_Project\frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run the TypeScript build check:
   ```bash
   npm run build
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Access the tactical dashboard in your web browser:
   **`http://localhost:5173`**

---

## 5. Step-by-Step Mentor Demonstration Script

Use this structured walkthrough during your mentor evaluation to demonstrate every required capability:

### Step 1: Dashboard Overview & Initial Ledger State
1. Open `http://localhost:5173`.
2. Point out the **tactical design aesthetic**:
   - Palette: Warm ivory (`#F3F2EC`), graphite base (`#252923`), muted olive (`#69745D`), and muted rust (`#A65F43`).
   - Monospaced hashes, callsign routing, and operational status headers.
   - Distinct badges clearly stating: **"LOCAL SIMULATION // NOT DISTRIBUTED CONSENSUS"**.
3. Point out the HUD Metrics Bar:
   - **Genesis Block #0** already initialized.
   - **Chain Integrity:** `VERIFIED (SHA-256)`.

### Step 2: Live Message Encryption & Ledger Block Linking
1. In the **Tactical Message Composer**:
   - Sender: `ALPHA-BASE`
   - Recipient: `FORWARD-OP-1`
   - Classification: `SECRET`
   - Priority: `FLASH`
   - Key Slot: `Slot 1: ALPHA-C2 Key` (`KEY-TACTICAL-ALPHA`)
   - Content: Click **Preset Order** or type custom tactical instructions.
2. Click **TRANSMIT SECURE PACKET**.
3. Show the resulting receipt:
   - Unique tactical message ID (e.g. `MSG-DBD49D8B`).
   - Fresh 96-bit (12-byte) IV in Base64 (e.g. `tpGPrxjTntyBNrn6`).
   - Dedicated SHA-256 payload seal.
   - Linked block index: **Block #1**.
4. Show that the **Ledger Height** metric immediately updates.

### Step 3: Decrypted Message Intercept & GCM Auth Tag Verification
1. On the right panel (**Tactical Message Intercept / Inbox**):
   - Notice the stored message displays only the **AES-256-GCM ciphertext** and metadata. **No plaintext is stored on disk or on the ledger.**
2. Click **DECRYPT TRANSMISSION** with the matching slot key:
   - Observe the success banner: `DECRYPTION SUCCESSFUL // AES-GCM 128-BIT AUTH TAG VERIFIED`.
   - The plaintext is decrypted on-demand in memory.
3. In the key dropdown, select **Simulate Unauthorized / Wrong Key** and click decrypt:
   - Notice the immediate security alert: `AUTHENTICATION FAILURE / CIPHERTEXT TAMPERED: AEADBadTagException - Tag mismatch`.
   - This proves authentic AES-GCM cryptographic integrity verification.

### Step 4: Blockchain Ledger Inspection
1. Click the **HASH-LINKED LEDGER** tab in the navigation bar.
2. Observe the chain of blocks starting from **Genesis (Block 0)** to **Block #1**.
3. Note how `block[1].previousHash` matches `block[0].currentHash`.
4. Click on **Block #1** to open the **Deep Inspector**:
   - Inspect the complete 64-character SHA-256 hexadecimal digests.
   - Point out the cryptographic formula proof:
     `currentHash = SHA-256(index | prevHash | timestamp | payloadHash | nonce | sender | recipient)`.
   - Close the inspector modal.

### Step 5: Adversarial Tampering Simulation & Self-Repair
1. Click the **INTEGRITY & ADVERSARIAL LAB** tab.
2. Notice the initial green banner: `ALL BLOCKS VERIFIED // IMMUTABLE`.
3. Under **Controlled Adversarial Attack Simulation (Mentor Demo)**, click **1. Corrupt Block Hash**:
   - The backend modifies the block's currentHash in the database to simulate host-level database tampering.
   - The audit immediately triggers: `LEDGER TAMPERING DETECTED // INTEGRITY COMPROMISED`.
   - The audit table highlights Block #1 with red `BROKEN / ALTERED` flags and provides the exact diagnosis:
     `"Block header corrupted: SHA-256 mismatch."`
4. Click **3. Restore Clean State** (or **RESTORE / REPAIR LEDGER**):
   - The engine recalculates the authentic cryptographic hash chain.
   - The status returns to `ALL BLOCKS VERIFIED`.

### Step 6: Cryptographic Replay Attack Defense
1. Return to the **TACTICAL C2 OPERATIONS** tab.
2. In the composer receipt, click **Test Replay on [MSG-ID]**:
   - The system attempts to re-transmit an identical message packet.
   - The backend security guard intercepts it and responds with:
     `HTTP 409 Conflict: REPLAY ATTACK REJECTED: Message ID has already been transmitted and verified on the ledger.`
   - Point out that the **Replays Blocked** counter in the HUD metrics increments.

### Step 7: Radio Silence (Offline Queuing & Batch Synchronization)
1. In the top navigation bar, click **UPLINK: ONLINE** to toggle to **RADIO SILENCE: OFFLINE**.
2. Notice the indicator switches to rust: `RADIO SILENCE: OFFLINE`.
3. In the composer, type: `SITREP: Electronic jamming detected. Holding positions.`
4. Click **ENQUEUE TO OFFLINE STORE**:
   - The message is stored in browser local storage.
   - The **OUTBOX QUEUE** badge counter updates to `1`.
5. Click the **OUTBOX QUEUE (1)** button in the header to view the queued packet.
6. Toggle back to **UPLINK: ONLINE** and click **SYNCHRONIZE QUEUE NOW**:
   - The batch synchronizer sends the queued packet to `/api/messages/sync-queue`.
   - The ledger height advances, a new block is appended, and the queue is cleared.

### Step 8: Interactive Swagger UI Documentation
1. Click the **SWAGGER UI** link in the top right of the dashboard (or navigate to `http://localhost:8080/swagger-ui.html`).
2. Show the mentor all 4 REST controller groups:
   - `Tactical Messaging` (`/api/messages/*`)
   - `Simulated Ledger` (`/api/ledger/*`)
   - `Adversarial Simulation` (`/api/tamper/*`)
   - `System Telemetry` (`/api/metrics`)
3. Demonstrate invoking any endpoint live directly from the Swagger UI.

---

## 6. Project Directory Structure

```
c:/projects/Major_Project/
├── backend/
│   ├── pom.xml                                   # Maven build configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/mil/fieldlink/
│   │   │   │   ├── FieldLinkApplication.java     # Spring Boot application entrypoint
│   │   │   │   ├── config/                       # CORS & OpenAPI/Swagger configuration
│   │   │   │   ├── crypto/                       # AES-256-GCM & SHA-256 cryptographic engine
│   │   │   │   ├── dto/                          # Strong typed request/response records
│   │   │   │   ├── model/entity/                 # JPA entities (Payload, LedgerBlock, Nonce)
│   │   │   │   ├── repository/                   # Spring Data JPA repositories
│   │   │   │   ├── service/                      # Core business, ledger, and tamper services
│   │   │   │   └── controller/                   # REST API controllers
│   │   │   └── resources/
│   │   │       └── application.properties        # Persistent H2 database & Swagger config
│   │   └── test/
│   │       ├── java/mil/fieldlink/               # Comprehensive unit & integration tests
│   │       └── resources/
│   │           └── application.properties        # Fast in-memory test configuration
├── frontend/
│   ├── package.json                              # Node dependencies (React 18, Vite, Tailwind)
│   ├── tsconfig.json                             # Strict TypeScript configuration
│   ├── vite.config.ts                            # Vite build & API proxy setup
│   ├── tailwind.config.js                        # Tactical color palette & typography
│   ├── index.html                                # IBM Plex fonts and root HTML
│   └── src/
│       ├── main.tsx                              # React DOM root
│       ├── App.tsx                               # Primary tactical dashboard orchestration
│       ├── index.css                             # Tailwind directives & tactical scrollbars
│       ├── types.ts                              # TypeScript models matching backend DTOs
│       ├── services/
│       │   ├── api.ts                            # Typed REST API client
│       │   └── offlineQueue.ts                   # LocalStorage tactical offline store
│       └── components/
│           ├── Header.tsx                        # Classification banner, uplink toggle, outbox
│           ├── MetricsBar.tsx                    # HUD operational telemetry indicators
│           ├── MessageComposer.tsx               # Tactical composer with key ring & replay test
│           ├── DecryptedInbox.tsx                # Encrypted message store with GCM decryption
│           ├── LedgerChainView.tsx               # Simulated blockchain flow & deep inspector
│           ├── IntegrityAuditor.tsx              # SHA-256 audit table & red-team tamper lab
│           └── OfflineQueueModal.tsx             # Outbox inspection & batch sync controller
└── README.md                                     # System documentation and demo instructions
```

---

## 7. Security Assertions

- **Zero Plaintext on Ledger:** Ledger blocks contain only metadata, cryptographic links, and SHA-256 payload digests.
- **Zero Hardcoded Secrets:** Keys are derived dynamically from operator tactical key slots using SHA-256 key stretching (`SecretKeySpec(sha256(secret), "AES")`).
- **Fresh Nonce Guarantee:** Every encryption invokes `SecureRandom` to generate a fresh 96-bit IV, ensuring two identical plaintexts never produce the same ciphertext.
- **AEAD Integrity Guarantee:** GCM tag authentication ensures any in-flight or database bit-flip is caught upon decryption attempt.
- **Tamper Alarm:** Modifying stored ciphertext triggers both a ledger `payloadHash` mismatch and an `AEADBadTagException`.

---

**Developed for B.Tech Major Project Evaluation // 29 October 2026**
