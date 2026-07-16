package dev.darenel.recruiting.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.repository.CandidateRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
import dev.darenel.recruiting.repository.StageEventRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-07-16T12:00:00Z"), ZoneOffset.UTC);
    private static final OffsetDateTime JULY_START = OffsetDateTime.parse("2026-07-01T00:00:00Z");
    private static final OffsetDateTime AUGUST_START = OffsetDateTime.parse("2026-08-01T00:00:00Z");

    @Mock
    private VacancyRepository vacancies;

    @Mock
    private CandidateRepository candidates;

    @Mock
    private RecruitingApplicationRepository applications;

    @Mock
    private StageEventRepository stageEvents;

    @Test
    void summaryMapsCountsAndFillsMissingStages() {
        DashboardService service = service();
        when(vacancies.countByStatus(VacancyStatus.OPEN)).thenReturn(4L);
        when(candidates.count()).thenReturn(12L);
        when(applications.countByStageIn(activeStages())).thenReturn(7L);
        when(stageEvents.countByToStageAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Stage.OFERTA,
                JULY_START, AUGUST_START)).thenReturn(2L);
        when(stageEvents.countByToStageAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Stage.RECHAZADO,
                JULY_START, AUGUST_START)).thenReturn(3L);
        when(applications.averageScoreByStageIn(activeStages())).thenReturn(Optional.of(78.5d));
        when(applications.countByStage()).thenReturn(List.of(
                new StageCount(Stage.POSTULADO, 5),
                new StageCount(Stage.OFERTA, 2)));

        DashboardSummaryResponse response = service.summary();

        assertThat(response.openVacancies()).isEqualTo(4);
        assertThat(response.totalCandidates()).isEqualTo(12);
        assertThat(response.activeApplications()).isEqualTo(7);
        assertThat(response.offersThisMonth()).isEqualTo(2);
        assertThat(response.rejectedThisMonth()).isEqualTo(3);
        assertThat(response.avgScoreActive()).isEqualTo(78.5d);
        assertThat(response.applicationsByStage())
                .containsEntry(Stage.POSTULADO, 5L)
                .containsEntry(Stage.ENTREVISTA, 0L)
                .containsEntry(Stage.PRUEBA_TECNICA, 0L)
                .containsEntry(Stage.OFERTA, 2L)
                .containsEntry(Stage.RECHAZADO, 0L);
    }

    @Test
    void funnelCalculatesConversionAndHandlesZeroDivision() {
        DashboardService service = service();
        when(applications.count()).thenReturn(10L);
        when(applications.countReachedStage(Stage.ENTREVISTA)).thenReturn(5L);
        when(applications.countReachedStage(Stage.PRUEBA_TECNICA)).thenReturn(0L);
        when(applications.countReachedStage(Stage.OFERTA)).thenReturn(2L);

        List<DashboardFunnelResponse> funnel = service.funnel();

        assertThat(funnel).containsExactly(
                new DashboardFunnelResponse(Stage.POSTULADO, 10, 100.0d),
                new DashboardFunnelResponse(Stage.ENTREVISTA, 5, 50.0d),
                new DashboardFunnelResponse(Stage.PRUEBA_TECNICA, 0, 0.0d),
                new DashboardFunnelResponse(Stage.OFERTA, 2, 0.0d));
    }

    @Test
    void stackDemandFillsAllStacksAndSortsByActiveApplicationsThenOpenVacancies() {
        DashboardService service = service();
        when(vacancies.countOpenVacanciesByStack()).thenReturn(List.of(
                new StackCount(Stack.JAVA, 2),
                new StackCount(Stack.REACT, 4),
                new StackCount(Stack.SQL, 3)));
        when(applications.countActiveApplicationsByStack(activeStages())).thenReturn(List.of(
                new StackCount(Stack.JAVA, 8),
                new StackCount(Stack.REACT, 8),
                new StackCount(Stack.SQL, 2)));

        List<DashboardStackDemandResponse> response = service.stackDemand();

        assertThat(response).containsExactly(
                new DashboardStackDemandResponse(Stack.REACT, 4, 8),
                new DashboardStackDemandResponse(Stack.JAVA, 2, 8),
                new DashboardStackDemandResponse(Stack.SQL, 3, 2),
                new DashboardStackDemandResponse(Stack.DOTNET, 0, 0),
                new DashboardStackDemandResponse(Stack.PYTHON, 0, 0));
    }

    @Test
    void timelineGapFillsUtcDays() {
        DashboardService service = service();
        OffsetDateTime start = OffsetDateTime.parse("2026-07-14T00:00:00Z");
        OffsetDateTime end = OffsetDateTime.parse("2026-07-17T00:00:00Z");
        when(applications.countApplicationsByDay(start, end)).thenReturn(List.of(
                new TestDailyCount(LocalDate.parse("2026-07-14"), 2),
                new TestDailyCount(LocalDate.parse("2026-07-16"), 1)));
        when(stageEvents.countOffersByDay(start, end)).thenReturn(List.of(
                new TestDailyCount(LocalDate.parse("2026-07-15"), 3)));

        List<DashboardTimelineResponse> response = service.timeline(3);

        assertThat(response).containsExactly(
                new DashboardTimelineResponse(LocalDate.parse("2026-07-14"), 2, 0),
                new DashboardTimelineResponse(LocalDate.parse("2026-07-15"), 0, 3),
                new DashboardTimelineResponse(LocalDate.parse("2026-07-16"), 1, 0));
    }

    private DashboardService service() {
        return new DashboardService(vacancies, candidates, applications, stageEvents, CLOCK);
    }

    private List<Stage> activeStages() {
        return List.of(Stage.POSTULADO, Stage.ENTREVISTA, Stage.PRUEBA_TECNICA);
    }

    private record TestDailyCount(LocalDate day, long count) implements DailyCountView {

        @Override
        public LocalDate getDay() {
            return day;
        }

        @Override
        public long getCount() {
            return count;
        }
    }
}
