package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.repository.CompanyRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import dev.darenel.recruiting.scoring.ScoringService;
import dev.darenel.recruiting.web.ConflictException;
import dev.darenel.recruiting.web.NotFoundException;
import jakarta.persistence.criteria.Join;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VacancyService {

    private static final Set<String> SORT_FIELDS = Set.of("title", "seniorityYears", "status", "createdAt");

    private final VacancyRepository vacancies;
    private final CompanyRepository companies;
    private final RecruitingApplicationRepository applications;
    private final ScoringService scoringService;

    public VacancyService(VacancyRepository vacancies, CompanyRepository companies,
            RecruitingApplicationRepository applications, ScoringService scoringService) {
        this.vacancies = vacancies;
        this.companies = companies;
        this.applications = applications;
        this.scoringService = scoringService;
    }

    @Transactional(readOnly = true)
    public PageResponse<VacancyResponse> list(int page, int limit, Stack stack, VacancyStatus status, UUID companyId,
            String search, String sortBy, String sortDir) {
        Page<Vacancy> result = vacancies.findAll(filters(stack, status, companyId, search),
                pageRequest(page, limit, sortBy, sortDir));
        List<VacancyResponse> data = result.getContent().stream()
                .map(VacancyResponse::from)
                .toList();
        return new PageResponse<>(data, result.getTotalElements(), normalizedPage(page), normalizedLimit(limit));
    }

    @Transactional(readOnly = true)
    public VacancyResponse get(UUID id) {
        return VacancyResponse.from(find(id));
    }

    @Transactional
    public VacancyResponse create(VacancyRequest request) {
        Company company = findCompany(request.companyId());
        Vacancy vacancy = new Vacancy(UUID.randomUUID(), company, request.title(), request.seniorityYears(),
                request.status(), request.stacks(), OffsetDateTime.now());
        return VacancyResponse.from(vacancies.save(vacancy));
    }

    @Transactional
    public VacancyResponse update(UUID id, VacancyRequest request) {
        Vacancy vacancy = find(id);
        boolean recompute = vacancy.getSeniorityYears() != request.seniorityYears()
                || !Objects.equals(vacancy.getStacks(), request.stacks());
        vacancy.update(findCompany(request.companyId()), request.title(), request.seniorityYears(), request.status(),
                request.stacks());
        if (recompute) {
            recomputeScores(vacancy);
        }
        return VacancyResponse.from(vacancy);
    }

    @Transactional
    public void delete(UUID id) {
        Vacancy vacancy = find(id);
        if (applications.existsByVacancyId(id)) {
            throw new ConflictException("Cannot delete vacancy while applications reference it");
        }
        vacancies.delete(vacancy);
    }

    private void recomputeScores(Vacancy vacancy) {
        applications.findByVacancyId(vacancy.getId()).forEach(application -> {
            int score = scoringService.score(vacancy, application.getCandidate());
            application.updateScore(score);
        });
    }

    private Vacancy find(UUID id) {
        return vacancies.findById(id)
                .orElseThrow(() -> new NotFoundException("Vacancy not found"));
    }

    private Company findCompany(UUID id) {
        return companies.findById(id)
                .orElseThrow(() -> new NotFoundException("Company not found"));
    }

    private Specification<Vacancy> filters(Stack stack, VacancyStatus status, UUID companyId, String search) {
        return (root, query, builder) -> {
            query.distinct(true);
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (stack != null) {
                Join<Vacancy, Stack> stacks = root.join("stacks");
                predicates.add(builder.equal(stacks, stack));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (companyId != null) {
                predicates.add(builder.equal(root.get("company").get("id"), companyId));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("title")), "%" + search.toLowerCase() + "%"));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private PageRequest pageRequest(int page, int limit, String sortBy, String sortDir) {
        String field = SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(normalizedPage(page), normalizedLimit(limit), Sort.by(direction, field));
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
