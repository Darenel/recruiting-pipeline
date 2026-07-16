package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.catalog.PageResponse;
import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Interview;
import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Role;
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
import dev.darenel.recruiting.web.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationsService {

    private final RecruitingApplicationRepository applications;
    private final CandidateRepository candidates;
    private final VacancyRepository vacancies;
    private final StageEventRepository stageEvents;
    private final InterviewRepository interviews;
    private final UserRepository users;
    private final ScoringService scoringService;
    private final StageTransitionPolicy transitionPolicy;

    public ApplicationsService(RecruitingApplicationRepository applications, CandidateRepository candidates,
            VacancyRepository vacancies, StageEventRepository stageEvents, InterviewRepository interviews,
            UserRepository users, ScoringService scoringService) {
        this.applications = applications;
        this.candidates = candidates;
        this.vacancies = vacancies;
        this.stageEvents = stageEvents;
        this.interviews = interviews;
        this.users = users;
        this.scoringService = scoringService;
        this.transitionPolicy = new StageTransitionPolicy();
    }

    @Transactional
    public ApplicationSummaryResponse create(ApplicationCreateRequest request) {
        Candidate candidate = candidates.findById(request.candidateId())
                .orElseThrow(() -> new NotFoundException("Candidate not found"));
        Vacancy vacancy = vacancies.findById(request.vacancyId())
                .orElseThrow(() -> new NotFoundException("Vacancy not found"));
        if (applications.existsByCandidateIdAndVacancyId(candidate.getId(), vacancy.getId())) {
            throw new ConflictException("Application already exists for candidate and vacancy");
        }
        if (vacancy.getStatus() == VacancyStatus.CLOSED) {
            throw new ConflictException("Cannot apply to a closed vacancy");
        }

        int score = scoringService.score(vacancy, candidate);
        RecruitingApplication application = new RecruitingApplication(UUID.randomUUID(), candidate, vacancy,
                Stage.POSTULADO, score, OffsetDateTime.now());
        return ApplicationSummaryResponse.from(applications.save(application));
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationSummaryResponse> list(int page, int limit, Stage stage, UUID vacancyId,
            UUID candidateId, Integer minScore) {
        Page<RecruitingApplication> result = applications.findAll(filters(stage, vacancyId, candidateId, minScore),
                PageRequest.of(normalizedPage(page), normalizedLimit(limit),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(result.getContent().stream().map(ApplicationSummaryResponse::from).toList(),
                result.getTotalElements(), normalizedPage(page), normalizedLimit(limit));
    }

    @Transactional(readOnly = true)
    public ApplicationDetailResponse get(UUID id) {
        RecruitingApplication application = find(id);
        return ApplicationDetailResponse.from(application,
                stageEvents.findByApplicationIdOrderByCreatedAtDesc(id),
                interviews.findByApplicationIdOrderByScheduledAtAsc(id));
    }

    @Transactional(readOnly = true)
    public BoardResponse board(UUID vacancyId) {
        List<RecruitingApplication> source = vacancyId == null
                ? applications.findAllByOrderByScoreDesc()
                : applications.findAllByVacancyId(vacancyId);
        EnumMap<Stage, List<BoardApplicationResponse>> grouped = new EnumMap<>(Stage.class);
        for (Stage stage : Stage.values()) {
            grouped.put(stage, new ArrayList<>());
        }
        source.stream()
                .sorted(Comparator.comparingInt(RecruitingApplication::getScore).reversed())
                .forEach(application -> grouped.get(application.getStage()).add(boardCard(application)));

        List<BoardColumnResponse> columns = java.util.Arrays.stream(Stage.values())
                .map(stage -> new BoardColumnResponse(stage, List.copyOf(grouped.get(stage))))
                .toList();
        return new BoardResponse(columns);
    }

    @Transactional
    public ApplicationSummaryResponse moveStage(UUID id, StageChangeRequest request, String email, Role role) {
        RecruitingApplication application = find(id);
        Stage from = application.getStage();
        transitionPolicy.validate(from, request.toStage(), role);
        User user = currentUser(email);

        application.moveTo(request.toStage());
        stageEvents.save(new StageEvent(UUID.randomUUID(), application, from, request.toStage(), user,
                request.note(), OffsetDateTime.now()));
        return ApplicationSummaryResponse.from(application);
    }

    @Transactional(readOnly = true)
    public List<StageEventResponse> history(UUID id) {
        if (!applications.existsById(id)) {
            throw new NotFoundException("Application not found");
        }
        return stageEvents.findByApplicationIdOrderByCreatedAtDesc(id).stream()
                .map(StageEventResponse::from)
                .toList();
    }

    @Transactional
    public InterviewResponse createInterview(UUID applicationId, InterviewCreateRequest request, String email) {
        RecruitingApplication application = find(applicationId);
        guardInterviewStage(application.getStage());
        User user = currentUser(email);
        Interview interview = new Interview(UUID.randomUUID(), application, request.scheduledAt(), request.kind(),
                request.notes(), request.rating(), user, OffsetDateTime.now());
        return InterviewResponse.from(interviews.save(interview));
    }

    @Transactional
    public InterviewResponse updateInterview(UUID id, InterviewUpdateRequest request) {
        Interview interview = interviews.findById(id)
                .orElseThrow(() -> new NotFoundException("Interview not found"));
        interview.update(request.notes(), request.rating());
        return InterviewResponse.from(interview);
    }

    void guardInterviewStage(Stage stage) {
        if (stage != Stage.ENTREVISTA && stage != Stage.PRUEBA_TECNICA) {
            throw new ConflictException("Interviews are only allowed during ENTREVISTA or PRUEBA_TECNICA");
        }
    }

    private BoardApplicationResponse boardCard(RecruitingApplication application) {
        return new BoardApplicationResponse(
                application.getId(),
                application.getCandidate().getName(),
                application.getCandidate().getHeadline(),
                application.getScore(),
                daysInStage(application),
                interviews.countByApplicationId(application.getId()));
    }

    private long daysInStage(RecruitingApplication application) {
        OffsetDateTime since = stageEvents.findByApplicationIdOrderByCreatedAtDesc(application.getId()).stream()
                .filter(event -> event.getToStage() == application.getStage())
                .findFirst()
                .map(StageEvent::getCreatedAt)
                .orElse(application.getCreatedAt());
        return Math.max(0, ChronoUnit.DAYS.between(since, OffsetDateTime.now()));
    }

    private RecruitingApplication find(UUID id) {
        return applications.findById(id)
                .orElseThrow(() -> new NotFoundException("Application not found"));
    }

    private User currentUser(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Specification<RecruitingApplication> filters(Stage stage, UUID vacancyId, UUID candidateId,
            Integer minScore) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (stage != null) {
                predicates.add(builder.equal(root.get("stage"), stage));
            }
            if (vacancyId != null) {
                predicates.add(builder.equal(root.get("vacancy").get("id"), vacancyId));
            }
            if (candidateId != null) {
                predicates.add(builder.equal(root.get("candidate").get("id"), candidateId));
            }
            if (minScore != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("score"), minScore));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private int normalizedPage(int page) {
        return Math.max(page, 0);
    }

    private int normalizedLimit(int limit) {
        if (limit < 1) {
            return 20;
        }
        return Math.min(limit, 100);
    }
}
