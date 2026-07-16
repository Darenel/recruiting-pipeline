package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.StageEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageEventRepository extends JpaRepository<StageEvent, UUID> {

    List<StageEvent> findByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    List<StageEvent> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
