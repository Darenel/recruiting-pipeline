package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.Interview;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {
}
