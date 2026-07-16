package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.RecruitingApplication;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruitingApplicationRepository extends JpaRepository<RecruitingApplication, UUID> {

    boolean existsByVacancyId(UUID vacancyId);

    boolean existsByCandidateId(UUID candidateId);

    List<RecruitingApplication> findByVacancyId(UUID vacancyId);

    List<RecruitingApplication> findByCandidateId(UUID candidateId);
}
