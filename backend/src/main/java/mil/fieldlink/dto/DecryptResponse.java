package mil.fieldlink.dto;

public record DecryptResponse(
    String messageId,
    String decryptedText,
    boolean authTagVerified,
    String keyIdentifier,
    String classification,
    String priority,
    String error
) {
    public static DecryptResponse success(String messageId, String decryptedText, String keyIdentifier, String classification, String priority) {
        return new DecryptResponse(messageId, decryptedText, true, keyIdentifier, classification, priority, null);
    }

    public static DecryptResponse failure(String messageId, String error) {
        return new DecryptResponse(messageId, null, false, null, null, null, error);
    }
}
