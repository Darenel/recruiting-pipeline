package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.Candidate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CandidateRepository extends JpaRepository<Candidate, UUID>, JpaSpecificationExecutor<Candidate> {

    Optional<Candidate> findByEmail(String email);
}
