package mil.fieldlink.repository;

import mil.fieldlink.model.entity.LedgerBlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerBlockRepository extends JpaRepository<LedgerBlockEntity, Long> {
    Optional<LedgerBlockEntity> findTopByOrderByBlockIndexDesc();
    Optional<LedgerBlockEntity> findByBlockIndex(Long blockIndex);
    Optional<LedgerBlockEntity> findByMessageId(String messageId);
    List<LedgerBlockEntity> findAllByOrderByBlockIndexAsc();
    List<LedgerBlockEntity> findAllByOrderByBlockIndexDesc();
}
