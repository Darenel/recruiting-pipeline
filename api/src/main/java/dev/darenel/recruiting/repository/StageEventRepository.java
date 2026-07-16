package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.dashboard.DailyCountView;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.StageEvent;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StageEventRepository extends JpaRepository<StageEvent, UUID> {

    List<StageEvent> findByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    List<StageEvent> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    long countByToStageAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Stage toStage, OffsetDateTime start,
            OffsetDateTime end);

    @Query(value = """
            select cast(event.created_at at time zone 'UTC' as date) as day, count(*) as count
            from stage_events event
            where event.to_stage = 'OFERTA'
              and event.created_at >= :start
              and event.created_at < :end
            group by cast(event.created_at at time zone 'UTC' as date)
            order by day
            """, nativeQuery = true)
    List<DailyCountView> countOffersByDay(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);
}
