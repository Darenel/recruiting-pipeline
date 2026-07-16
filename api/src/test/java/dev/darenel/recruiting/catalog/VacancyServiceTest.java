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
import dev.darenel.recruiting.repository.CompanyRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VacancyServiceTest {

    @Mock
    private VacancyRepository vacancies;

    @Mock
    private CompanyRepository companies;

    @Mock
    private RecruitingApplicationRepository applications;

    @Mock
    private ScoringService scoringService;

    @InjectMocks
    private VacancyService service;

    @Test
    void deleteRejectsVacancyWithApplications() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000202");
        when(vacancies.findById(id)).thenReturn(Optional.of(vacancy()));
        when(applications.existsByVacancyId(id)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Cannot delete vacancy while applications reference it");
    }

    @Test
    void changingStacksRecomputesApplicationScores() {
        Vacancy vacancy = vacancy();
        Company company = vacancy.getCompany();
        Candidate candidate = candidate();
        RecruitingApplication application = new RecruitingApplication(
                UUID.fromString("00000000-0000-0000-0000-000000000401"),
                candidate,
                vacancy,
                Stage.POSTULADO,
                40,
                OffsetDateTime.parse("2026-07-16T10:30:00Z"));
        VacancyRequest request = new VacancyRequest(company.getId(), "Backend Engineer", 4, VacancyStatus.OPEN,
                Set.of(Stack.JAVA, Stack.SQL));
        when(vacancies.findById(vacancy.getId())).thenReturn(Optional.of(vacancy));
        when(companies.findById(company.getId())).thenReturn(Optional.of(company));
        when(applications.findByVacancyId(vacancy.getId())).thenReturn(List.of(application));
        when(scoringService.score(vacancy, candidate)).thenReturn(88);

        service.update(vacancy.getId(), request);

        verify(applications).findByVacancyId(vacancy.getId());
        verify(scoringService).score(vacancy, candidate);
        assertThat(application.getScore()).isEqualTo(88);
    }

    private Vacancy vacancy() {
        return new Vacancy(
                UUID.fromString("00000000-0000-0000-0000-000000000202"),
                company(),
                "Backend Engineer",
                4,
                VacancyStatus.OPEN,
                Set.of(Stack.JAVA),
                OffsetDateTime.parse("2026-07-16T10:10:00Z"));
    }

    private Company company() {
        return new Company(
                UUID.fromString("00000000-0000-0000-0000-000000000201"),
                "Nocturno Labs",
                "Software",
                OffsetDateTime.parse("2026-07-16T10:00:00Z"));
    }

    private Candidate candidate() {
        return new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                "Ana Torres",
                "ana@example.com",
                "React engineer",
                4,
                null,
                Set.of(Stack.JAVA, Stack.SQL),
                OffsetDateTime.parse("2026-07-16T10:20:00Z"));
    }
}
