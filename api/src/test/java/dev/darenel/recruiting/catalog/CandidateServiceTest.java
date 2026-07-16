package dev.darenel.recruiting.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.repository.CandidateRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
import dev.darenel.recruiting.scoring.ScoringService;
import dev.darenel.recruiting.web.ConflictException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CandidateServiceTest {

    @Mock
    private CandidateRepository candidates;

    @Mock
    private RecruitingApplicationRepository applications;

    @Mock
    private ScoringService scoringService;

    @InjectMocks
    private CandidateService service;

    @Test
    void deleteRejectsCandidateWithApplications() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000301");
        when(candidates.findById(id)).thenReturn(Optional.of(candidate()));
        when(applications.existsByCandidateId(id)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Cannot delete candidate while applications reference it");
    }

    @Test
    void changingSkillsRecomputesApplicationScores() {
        Candidate candidate = candidate();
        Vacancy vacancy = vacancy();
        RecruitingApplication application = new RecruitingApplication(
                UUID.fromString("00000000-0000-0000-0000-000000000401"),
                candidate,
                vacancy,
                Stage.POSTULADO,
                40,
                OffsetDateTime.parse("2026-07-16T10:30:00Z"));
        CandidateRequest request = new CandidateRequest("Ana Torres", "ANA@example.com", "Full-stack engineer", 4,
                "Testing", Set.of(Stack.JAVA, Stack.SQL));
        when(candidates.findById(candidate.getId())).thenReturn(Optional.of(candidate));
        when(applications.findByCandidateId(candidate.getId())).thenReturn(List.of(application));
        when(scoringService.score(vacancy, candidate)).thenReturn(91);

        service.update(candidate.getId(), request);

        verify(applications).findByCandidateId(candidate.getId());
        verify(scoringService).score(vacancy, candidate);
        assertThat(candidate.getEmail()).isEqualTo("ana@example.com");
        assertThat(application.getScore()).isEqualTo(91);
    }

    private Candidate candidate() {
        return new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                "Ana Torres",
                "ana@example.com",
                "React engineer",
                4,
                null,
                Set.of(Stack.REACT),
                OffsetDateTime.parse("2026-07-16T10:20:00Z"));
    }

    private Vacancy vacancy() {
        return new Vacancy(
                UUID.fromString("00000000-0000-0000-0000-000000000202"),
                new Company(
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        "Nocturno Labs",
                        "Software",
                        OffsetDateTime.parse("2026-07-16T10:00:00Z")),
                "Backend Engineer",
                4,
                VacancyStatus.OPEN,
                Set.of(Stack.JAVA, Stack.SQL),
                OffsetDateTime.parse("2026-07-16T10:10:00Z"));
    }
}
