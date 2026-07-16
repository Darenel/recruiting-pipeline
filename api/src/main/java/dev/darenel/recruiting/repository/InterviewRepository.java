package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.Interview;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByApplicationIdOrderByScheduledAtAsc(UUID applicationId);

    int countByApplicationId(UUID applicationId);
}
