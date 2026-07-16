package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.dashboard.DailyCountView;
import dev.darenel.recruiting.dashboard.StackCount;
import dev.darenel.recruiting.dashboard.StageCount;
import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Stage;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    long countByStageIn(List<Stage> stages);

    @Query("select avg(application.score) from RecruitingApplication application where application.stage in :stages")
    Optional<Double> averageScoreByStageIn(@Param("stages") List<Stage> stages);

    @Query("""
            select new dev.darenel.recruiting.dashboard.StageCount(application.stage, count(application))
            from RecruitingApplication application
            group by application.stage
            """)
    List<StageCount> countByStage();

    @Query("""
            select count(application)
            from RecruitingApplication application
            where application.stage = :stage
               or exists (
                   select event.id
                   from StageEvent event
                   where event.application = application
                     and event.toStage = :stage
               )
            """)
    long countReachedStage(@Param("stage") Stage stage);

    @Query("""
            select new dev.darenel.recruiting.dashboard.StackCount(stack, count(distinct application.id))
            from RecruitingApplication application
            join application.vacancy.stacks stack
            where application.stage in :activeStages
            group by stack
            """)
    List<StackCount> countActiveApplicationsByStack(@Param("activeStages") List<Stage> activeStages);

    @Query(value = """
            select cast(application.created_at at time zone 'UTC' as date) as day, count(*) as count
            from applications application
            where application.created_at >= :start and application.created_at < :end
            group by cast(application.created_at at time zone 'UTC' as date)
            order by day
            """, nativeQuery = true)
    List<DailyCountView> countApplicationsByDay(@Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end);
}
