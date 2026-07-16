package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.RecruitingApplication;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RecruitingApplicationRepository extends JpaRepository<RecruitingApplication, UUID>,
        JpaSpecificationExecutor<RecruitingApplication> {

    boolean existsByVacancyId(UUID vacancyId);

    boolean existsByCandidateId(UUID candidateId);

    boolean existsByCandidateIdAndVacancyId(UUID candidateId, UUID vacancyId);

    List<RecruitingApplication> findByVacancyId(UUID vacancyId);

    List<RecruitingApplication> findByCandidateId(UUID candidateId);

    @EntityGraph(attributePaths = {"candidate", "vacancy", "vacancy.company"})
    List<RecruitingApplication> findAllByVacancyId(UUID vacancyId);

    @EntityGraph(attributePaths = {"candidate", "vacancy", "vacancy.company"})
    List<RecruitingApplication> findAllByOrderByScoreDesc();
}
