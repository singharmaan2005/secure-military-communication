package mil.fieldlink.repository;

import mil.fieldlink.model.entity.EncryptedPayloadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EncryptedPayloadRepository extends JpaRepository<EncryptedPayloadEntity, Long> {
    Optional<EncryptedPayloadEntity> findByMessageId(String messageId);
    List<EncryptedPayloadEntity> findByRecipientCallsignOrderByCreatedAtDesc(String recipientCallsign);
    List<EncryptedPayloadEntity> findAllByOrderByCreatedAtDesc();
}
