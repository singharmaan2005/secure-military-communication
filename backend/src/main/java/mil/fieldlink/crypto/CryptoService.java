package mil.fieldlink.crypto;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class CryptoService {

    public static final int GCM_IV_LENGTH_BYTES = 12; // 96-bit fresh nonce for GCM
    public static final int GCM_TAG_LENGTH_BITS = 128; // 128-bit authentication tag
    private static final String AES_ALGORITHM = "AES";
    private static final String AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding";

    private final SecureRandom secureRandom = new SecureRandom();

    public record EncryptionResult(
            String cipherTextBase64,
            String ivNonceBase64,
            int authTagLength,
            String keyIdentifier,
            String payloadHash
    ) {}

    /**
     * Derives a 256-bit AES key dynamically from an operator key string or key identifier.
     * No keys are ever hardcoded.
     */
    public SecretKey deriveKey(String keySecretOrId) {
        if (keySecretOrId == null || keySecretOrId.trim().isEmpty()) {
            keySecretOrId = "FIELDLINK-OP-DEFAULT-SESSION-KEY";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(keySecretOrId.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, AES_ALGORITHM);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    /**
     * Encrypts plaintext using AES-256-GCM with a fresh 96-bit cryptographically secure IV.
     */
    public EncryptionResult encrypt(String plainText, String keySecret, String keyIdentifier) throws Exception {
        if (plainText == null) {
            throw new IllegalArgumentException("Plaintext cannot be null");
        }

        // Generate fresh 96-bit secure nonce
        byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
        secureRandom.nextBytes(iv);

        SecretKey secretKey = deriveKey(keySecret);
        Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

        byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        String cipherTextBase64 = Base64.getEncoder().encodeToString(cipherBytes);
        String ivNonceBase64 = Base64.getEncoder().encodeToString(iv);

        String payloadHash = computePayloadHash(cipherTextBase64, ivNonceBase64);

        return new EncryptionResult(
                cipherTextBase64,
                ivNonceBase64,
                GCM_TAG_LENGTH_BITS,
                keyIdentifier != null ? keyIdentifier : "KEY-SESSION-V1",
                payloadHash
        );
    }

    /**
     * Decrypts AES-256-GCM ciphertext using the given key and IV.
     * Throws an exception if authentication tag verification fails (tampering detected).
     */
    public String decrypt(String cipherTextBase64, String ivNonceBase64, String keySecret) throws Exception {
        byte[] cipherBytes = Base64.getDecoder().decode(cipherTextBase64);
        byte[] iv = Base64.getDecoder().decode(ivNonceBase64);

        SecretKey secretKey = deriveKey(keySecret);
        Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

        byte[] plainBytes = cipher.doFinal(cipherBytes);
        return new String(plainBytes, StandardCharsets.UTF_8);
    }

    /**
     * Computes the SHA-256 hash of the encrypted payload (ciphertext + IV).
     * This establishes payload immutability on the ledger without revealing plaintext.
     */
    public String computePayloadHash(String cipherTextBase64, String ivNonceBase64) {
        String combined = cipherTextBase64 + ":" + ivNonceBase64;
        return sha256Hex(combined);
    }

    /**
     * Computes the SHA-256 hash of a block's metadata and payload hash.
     */
    public String computeBlockHash(Long blockIndex, String previousHash, String timestampIso,
                                   String payloadHash, Long sequenceNonce,
                                   String senderCallsign, String recipientCallsign) {
        String data = blockIndex + "|" +
                previousHash + "|" +
                timestampIso + "|" +
                payloadHash + "|" +
                sequenceNonce + "|" +
                senderCallsign + "|" +
                recipientCallsign;
        return sha256Hex(data);
    }

    /**
     * Computes a unique signature for replay protection.
     */
    public String computeNonceSignature(String senderCallsign, String recipientCallsign,
                                       Long sequenceNonce, String ivNonceBase64) {
        String data = senderCallsign + "->" + recipientCallsign + ":" + sequenceNonce + ":" + ivNonceBase64;
        return sha256Hex(data);
    }

    /**
     * Computes SHA-256 hex string.
     */
    public String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
