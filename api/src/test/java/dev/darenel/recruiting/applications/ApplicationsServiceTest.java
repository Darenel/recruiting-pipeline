package dev.darenel.recruiting.applications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.StageEvent;
import dev.darenel.recruiting.domain.User;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.repository.CandidateRepository;
import dev.darenel.recruiting.repository.InterviewRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
import dev.darenel.recruiting.repository.StageEventRepository;
import dev.darenel.recruiting.repository.UserRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import dev.darenel.recruiting.scoring.ScoringService;
import dev.darenel.recruiting.web.ConflictException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApplicationsServiceTest {

    @Mock
    private RecruitingApplicationRepository applications;

    @Mock
    private CandidateRepository candidates;

    @Mock
    private VacancyRepository vacancies;

    @Mock
    private StageEventRepository stageEvents;

    @Mock
    private InterviewRepository interviews;

    @Mock
    private UserRepository users;

    @Mock
    private ScoringService scoringService;

    @InjectMocks
    private ApplicationsService service;

    @Test
    void createRejectsDuplicateCandidateVacancyPair() {
        Candidate candidate = candidate();
        Vacancy vacancy = vacancy(VacancyStatus.OPEN);
        when(candidates.findById(candidate.getId())).thenReturn(Optional.of(candidate));
        when(vacancies.findById(vacancy.getId())).thenReturn(Optional.of(vacancy));
        when(applications.existsByCandidateIdAndVacancyId(candidate.getId(), vacancy.getId())).thenReturn(true);

        assertThatThrownBy(() -> service.create(new ApplicationCreateRequest(candidate.getId(), vacancy.getId())))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Application already exists for candidate and vacancy");
    }

    @Test
    void createRejectsClosedVacancy() {
        Candidate candidate = candidate();
        Vacancy vacancy = vacancy(VacancyStatus.CLOSED);
        when(candidates.findById(candidate.getId())).thenReturn(Optional.of(candidate));
        when(vacancies.findById(vacancy.getId())).thenReturn(Optional.of(vacancy));

        assertThatThrownBy(() -> service.create(new ApplicationCreateRequest(candidate.getId(), vacancy.getId())))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Cannot apply to a closed vacancy");
    }

    @Test
    void createSetsScoreFromScoringService() {
        Candidate candidate = candidate();
        Vacancy vacancy = vacancy(VacancyStatus.OPEN);
        when(candidates.findById(candidate.getId())).thenReturn(Optional.of(candidate));
        when(vacancies.findById(vacancy.getId())).thenReturn(Optional.of(vacancy));
        when(scoringService.score(vacancy, candidate)).thenReturn(88);
        when(applications.save(any(RecruitingApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationSummaryResponse response = service.create(new ApplicationCreateRequest(candidate.getId(),
                vacancy.getId()));

        ArgumentCaptor<RecruitingApplication> saved = ArgumentCaptor.forClass(RecruitingApplication.class);
        verify(applications).save(saved.capture());
        assertThat(saved.getValue().getScore()).isEqualTo(88);
        assertThat(response.score()).isEqualTo(88);
        assertThat(response.stage()).isEqualTo(Stage.POSTULADO);
    }

    @Test
    void boardKeepsAllStagesAndSortsEachColumnByScoreDescending() {
        RecruitingApplication low = application(Stage.POSTULADO, 45,
                "00000000-0000-0000-0000-000000000451", "Ana Torres");
        RecruitingApplication high = application(Stage.POSTULADO, 91,
                "00000000-0000-0000-0000-000000000452", "Ben Vega");
        RecruitingApplication interview = application(Stage.ENTREVISTA, 70,
                "00000000-0000-0000-0000-000000000453", "Cara Ruiz");
        when(applications.findAllByOrderByScoreDesc()).thenReturn(List.of(low, interview, high));
        when(stageEvents.findByApplicationIdOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(interviews.countByApplicationId(any())).thenReturn(0);

        BoardResponse board = service.board(null);

        assertThat(board.columns()).extracting(BoardColumnResponse::stage)
                .containsExactly(Stage.POSTULADO, Stage.ENTREVISTA, Stage.PRUEBA_TECNICA, Stage.OFERTA,
                        Stage.RECHAZADO);
        BoardColumnResponse postulado = board.columns().get(0);
        assertThat(postulado.applications()).extracting(BoardApplicationResponse::score)
                .containsExactly(91, 45);
        assertThat(board.columns().get(2).applications()).isEmpty();
        assertThat(board.columns().get(3).applications()).isEmpty();
        assertThat(board.columns().get(4).applications()).isEmpty();
    }

    @Test
    void moveStageUpdatesApplicationAndWritesHistoryEvent() {
        RecruitingApplication application = application(Stage.POSTULADO, 80,
                "00000000-0000-0000-0000-000000000401", "Ana Torres");
        User user = new User(UUID.fromString("00000000-0000-0000-0000-000000000002"), "Maya Recruiter",
                "recruiter@recruiting.local", "hash", Role.RECRUITER,
                OffsetDateTime.parse("2026-07-16T08:00:00Z"));
        when(applications.findById(application.getId())).thenReturn(Optional.of(application));
        when(users.findByEmail("recruiter@recruiting.local")).thenReturn(Optional.of(user));

        service.moveStage(application.getId(), new StageChangeRequest(Stage.ENTREVISTA, "Ready"),
                "recruiter@recruiting.local", Role.RECRUITER);

        ArgumentCaptor<StageEvent> event = ArgumentCaptor.forClass(StageEvent.class);
        verify(stageEvents).save(event.capture());
        assertThat(application.getStage()).isEqualTo(Stage.ENTREVISTA);
        assertThat(event.getValue().getFromStage()).isEqualTo(Stage.POSTULADO);
        assertThat(event.getValue().getToStage()).isEqualTo(Stage.ENTREVISTA);
        assertThat(event.getValue().getByUser().getEmail()).isEqualTo("recruiter@recruiting.local");
        assertThat(event.getValue().getNote()).isEqualTo("Ready");
    }

    @Test
    void interviewsAreAllowedOnlyInInterviewAndTechnicalTestStages() {
        for (Stage stage : Stage.values()) {
            if (stage == Stage.ENTREVISTA || stage == Stage.PRUEBA_TECNICA) {
                service.guardInterviewStage(stage);
            } else {
                assertThatThrownBy(() -> service.guardInterviewStage(stage))
                        .as("%s should reject interviews", stage)
                        .isInstanceOf(ConflictException.class);
            }
        }
    }

    private RecruitingApplication application(Stage stage, int score, String id, String candidateName) {
        return new RecruitingApplication(UUID.fromString(id), candidate(candidateName), vacancy(VacancyStatus.OPEN),
                stage, score, OffsetDateTime.parse("2026-07-16T10:00:00Z"));
    }

    private Candidate candidate() {
        return candidate("Ana Torres");
    }

    private Candidate candidate(String name) {
        return new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                name,
                name.toLowerCase().replace(" ", ".") + "@example.com",
                "Java engineer",
                4,
                null,
                Set.of(Stack.JAVA),
                OffsetDateTime.parse("2026-07-16T10:00:00Z"));
    }

    private Vacancy vacancy(VacancyStatus status) {
        return new Vacancy(
                UUID.fromString("00000000-0000-0000-0000-000000000202"),
                new Company(
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        "Nocturno Labs",
                        "Software",
                        OffsetDateTime.parse("2026-07-16T09:00:00Z")),
                "Backend Engineer",
                4,
                status,
                Set.of(Stack.JAVA, Stack.SQL),
                OffsetDateTime.parse("2026-07-16T09:30:00Z"));
    }
}
