package mil.fieldlink.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CryptoServiceTest {

    private CryptoService cryptoService;

    @BeforeEach
    void setUp() {
        cryptoService = new CryptoService();
    }

    @Test
    @DisplayName("AES-256-GCM: Encrypt and decrypt successfully matches original plaintext")
    void testEncryptAndDecryptSuccess() throws Exception {
        String plainText = "ORDERS: Alpha element advance to coordinate 32.441, 74.882 immediately.";
        String tacticalKey = "KEY-DELTA-TEST-SECRET-2026";
        String keyId = "KEY-SLOT-01";

        CryptoService.EncryptionResult res = cryptoService.encrypt(plainText, tacticalKey, keyId);

        assertNotNull(res);
        assertNotNull(res.cipherTextBase64());
        assertNotNull(res.ivNonceBase64());
        assertNotEquals(plainText, res.cipherTextBase64());
        assertEquals(128, res.authTagLength());

        String decrypted = cryptoService.decrypt(res.cipherTextBase64(), res.ivNonceBase64(), tacticalKey);
        assertEquals(plainText, decrypted);
    }

    @Test
    @DisplayName("Fresh Nonce: Two encryptions of identical plaintext produce distinct IVs and ciphertexts")
    void testFreshNoncePerEncryption() throws Exception {
        String plainText = "SITREP: Position secure.";
        String tacticalKey = "KEY-TACTICAL-COMMON";

        CryptoService.EncryptionResult res1 = cryptoService.encrypt(plainText, tacticalKey, "KEY-1");
        CryptoService.EncryptionResult res2 = cryptoService.encrypt(plainText, tacticalKey, "KEY-1");

        assertNotEquals(res1.ivNonceBase64(), res2.ivNonceBase64(), "Each encryption must use a fresh 96-bit IV");
        assertNotEquals(res1.cipherTextBase64(), res2.cipherTextBase64(), "Different IVs must yield distinct ciphertexts");
    }

    @Test
    @DisplayName("AEAD Authentication Tag: Altered ciphertext fails authentication")
    void testCiphertextTamperingDetected() throws Exception {
        String plainText = "CLASSIFIED: Target rendezvous at 0400 hours.";
        String tacticalKey = "KEY-SECRET-99";

        CryptoService.EncryptionResult res = cryptoService.encrypt(plainText, tacticalKey, "KEY-1");

        // Corrupt 1 byte in ciphertext
        byte[] corrupted = java.util.Base64.getDecoder().decode(res.cipherTextBase64());
        corrupted[0] = (byte) (corrupted[0] ^ 0xFF);
        String corruptedBase64 = java.util.Base64.getEncoder().encodeToString(corrupted);

        assertThrows(Exception.class, () ->
            cryptoService.decrypt(corruptedBase64, res.ivNonceBase64(), tacticalKey),
            "Decryption must throw an exception when the AEAD auth tag does not match"
        );
    }

    @Test
    @DisplayName("Unauthorized Key: Decryption with incorrect tactical key fails")
    void testWrongKeyFailsDecryption() throws Exception {
        String plainText = "INTEL: Unmanned aerial activity spotted north.";
        CryptoService.EncryptionResult res = cryptoService.encrypt(plainText, "CORRECT-KEY-2026", "KEY-A");

        assertThrows(Exception.class, () ->
            cryptoService.decrypt(res.cipherTextBase64(), res.ivNonceBase64(), "WRONG-KEY-9999")
        );
    }

    @Test
    @DisplayName("SHA-256 Hashing: Produces consistent 64-character lowercase hex digest")
    void testSha256Hex() {
        String input = "FIELDLINK-TACTICAL-CORE";
        String hash1 = cryptoService.sha256Hex(input);
        String hash2 = cryptoService.sha256Hex(input);

        assertNotNull(hash1);
        assertEquals(64, hash1.length());
        assertEquals(hash1, hash2);
    }
}
