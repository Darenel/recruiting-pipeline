package dev.darenel.recruiting.dashboard;

import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.repository.CandidateRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
import dev.darenel.recruiting.repository.StageEventRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private static final List<Stage> ACTIVE_STAGES = List.of(Stage.POSTULADO, Stage.ENTREVISTA,
            Stage.PRUEBA_TECNICA);
    private static final List<Stage> FORWARD_STAGES = List.of(Stage.POSTULADO, Stage.ENTREVISTA,
            Stage.PRUEBA_TECNICA, Stage.OFERTA);

    private final VacancyRepository vacancies;
    private final CandidateRepository candidates;
    private final RecruitingApplicationRepository applications;
    private final StageEventRepository stageEvents;
    private final Clock clock;

    public DashboardService(VacancyRepository vacancies, CandidateRepository candidates,
            RecruitingApplicationRepository applications, StageEventRepository stageEvents) {
        this(vacancies, candidates, applications, stageEvents, Clock.systemUTC());
    }

    DashboardService(VacancyRepository vacancies, CandidateRepository candidates,
            RecruitingApplicationRepository applications, StageEventRepository stageEvents, Clock clock) {
        this.vacancies = vacancies;
        this.candidates = candidates;
        this.applications = applications;
        this.stageEvents = stageEvents;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        OffsetDateTime monthStart = OffsetDateTime.now(clock)
                .withDayOfMonth(1)
                .truncatedTo(ChronoUnit.DAYS);
        OffsetDateTime nextMonth = monthStart.plusMonths(1);
        EnumMap<Stage, Long> byStage = emptyStageMap();
        applications.countByStage().forEach(count -> byStage.put(count.stage(), count.count()));

        return new DashboardSummaryResponse(
                vacancies.countByStatus(VacancyStatus.OPEN),
                candidates.count(),
                applications.countByStageIn(ACTIVE_STAGES),
                stageEvents.countByToStageAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Stage.OFERTA,
                        monthStart, nextMonth),
                stageEvents.countByToStageAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Stage.RECHAZADO,
                        monthStart, nextMonth),
                applications.averageScoreByStageIn(ACTIVE_STAGES).orElse(0.0d),
                byStage);
    }

    @Transactional(readOnly = true)
    public List<DashboardFunnelResponse> funnel() {
        List<DashboardFunnelResponse> response = new ArrayList<>();
        long previous = 0;
        for (Stage stage : FORWARD_STAGES) {
            // POSTULADO is implicit on creation; later stages are reached by current state or a stage event.
            long count = stage == Stage.POSTULADO ? applications.count() : applications.countReachedStage(stage);
            double conversion = response.isEmpty() ? 100.0d : conversion(count, previous);
            response.add(new DashboardFunnelResponse(stage, count, conversion));
            previous = count;
        }
        return response;
    }

    @Transactional(readOnly = true)
    public List<DashboardStackDemandResponse> stackDemand() {
        EnumMap<Stack, Long> openVacancies = emptyStackMap();
        EnumMap<Stack, Long> activeApplications = emptyStackMap();
        vacancies.countOpenVacanciesByStack().forEach(count -> openVacancies.put(count.stack(), count.count()));
        applications.countActiveApplicationsByStack(ACTIVE_STAGES)
                .forEach(count -> activeApplications.put(count.stack(), count.count()));

        return java.util.Arrays.stream(Stack.values())
                .map(stack -> new DashboardStackDemandResponse(stack, openVacancies.get(stack),
                        activeApplications.get(stack)))
                .sorted(Comparator.comparingLong(DashboardStackDemandResponse::activeApplications).reversed()
                        .thenComparing(Comparator.comparingLong(DashboardStackDemandResponse::openVacancies)
                                .reversed())
                        .thenComparing(response -> response.stack().name()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DashboardTimelineResponse> timeline(int days) {
        int normalizedDays = normalizedDays(days);
        LocalDate startDate = LocalDate.now(clock).minusDays(normalizedDays - 1L);
        OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = start.plusDays(normalizedDays);
        Map<LocalDate, Long> applicationCounts = dailyMap(applications.countApplicationsByDay(start, end));
        Map<LocalDate, Long> offerCounts = dailyMap(stageEvents.countOffersByDay(start, end));

        List<DashboardTimelineResponse> response = new ArrayList<>();
        for (int i = 0; i < normalizedDays; i++) {
            LocalDate date = startDate.plusDays(i);
            response.add(new DashboardTimelineResponse(date, applicationCounts.getOrDefault(date, 0L),
                    offerCounts.getOrDefault(date, 0L)));
        }
        return response;
    }

    private EnumMap<Stage, Long> emptyStageMap() {
        EnumMap<Stage, Long> counts = new EnumMap<>(Stage.class);
        for (Stage stage : Stage.values()) {
            counts.put(stage, 0L);
        }
        return counts;
    }

    private EnumMap<Stack, Long> emptyStackMap() {
        EnumMap<Stack, Long> counts = new EnumMap<>(Stack.class);
        for (Stack stack : Stack.values()) {
            counts.put(stack, 0L);
        }
        return counts;
    }

    private double conversion(long count, long previous) {
        if (previous == 0) {
            return 0.0d;
        }
        return Math.round((count * 10000.0d) / previous) / 100.0d;
    }

    private Map<LocalDate, Long> dailyMap(List<DailyCountView> counts) {
        return counts.stream().collect(java.util.stream.Collectors.toMap(DailyCountView::getDay,
                DailyCountView::getCount));
    }

    private int normalizedDays(int days) {
        if (days < 1) {
            return 30;
        }
        return Math.min(days, 365);
    }
}
