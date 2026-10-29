package mil.fieldlink.repository;

import mil.fieldlink.model.entity.ProcessedNonceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessedNonceRepository extends JpaRepository<ProcessedNonceEntity, Long> {
    boolean existsByMessageId(String messageId);
    boolean existsByNonceSignature(String nonceSignature);
    Optional<ProcessedNonceEntity> findByMessageId(String messageId);
}
