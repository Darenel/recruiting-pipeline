package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.repository.CandidateRepository;
import dev.darenel.recruiting.repository.RecruitingApplicationRepository;
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
public class CandidateService {

    private static final Set<String> SORT_FIELDS = Set.of("name", "email", "headline", "yearsExperience", "createdAt");

    private final CandidateRepository candidates;
    private final RecruitingApplicationRepository applications;
    private final ScoringService scoringService;

    public CandidateService(CandidateRepository candidates, RecruitingApplicationRepository applications,
            ScoringService scoringService) {
        this.candidates = candidates;
        this.applications = applications;
        this.scoringService = scoringService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CandidateResponse> list(int page, int limit, Stack stack, String search, Integer minYears,
            Integer maxYears, String sortBy, String sortDir) {
        Page<Candidate> result = candidates.findAll(filters(stack, search, minYears, maxYears),
                pageRequest(page, limit, sortBy, sortDir));
        List<CandidateResponse> data = result.getContent().stream()
                .map(CandidateResponse::from)
                .toList();
        return new PageResponse<>(data, result.getTotalElements(), normalizedPage(page), normalizedLimit(limit));
    }

    @Transactional(readOnly = true)
    public CandidateResponse get(UUID id) {
        return CandidateResponse.from(find(id));
    }

    @Transactional
    public CandidateResponse create(CandidateRequest request) {
        Candidate candidate = new Candidate(UUID.randomUUID(), request.name(), request.email().toLowerCase(),
                request.headline(), request.yearsExperience(), request.extraSkills(), request.stacks(),
                OffsetDateTime.now());
        return CandidateResponse.from(candidates.save(candidate));
    }

    @Transactional
    public CandidateResponse update(UUID id, CandidateRequest request) {
        Candidate candidate = find(id);
        boolean recompute = !Objects.equals(candidate.getStacks(), request.stacks());
        candidate.update(request.name(), request.email().toLowerCase(), request.headline(), request.yearsExperience(),
                request.extraSkills(), request.stacks());
        if (recompute) {
            recomputeScores(candidate);
        }
        return CandidateResponse.from(candidate);
    }

    @Transactional
    public void delete(UUID id) {
        Candidate candidate = find(id);
        if (applications.existsByCandidateId(id)) {
            throw new ConflictException("Cannot delete candidate while applications reference it");
        }
        candidates.delete(candidate);
    }

    private void recomputeScores(Candidate candidate) {
        applications.findByCandidateId(candidate.getId()).forEach(application -> {
            int score = scoringService.score(application.getVacancy(), candidate);
            application.updateScore(score);
        });
    }

    private Candidate find(UUID id) {
        return candidates.findById(id)
                .orElseThrow(() -> new NotFoundException("Candidate not found"));
    }

    private Specification<Candidate> filters(Stack stack, String search, Integer minYears, Integer maxYears) {
        return (root, query, builder) -> {
            query.distinct(true);
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (stack != null) {
                Join<Candidate, Stack> stacks = root.join("stacks");
                predicates.add(builder.equal(stacks, stack));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("email")), pattern),
                        builder.like(builder.lower(root.get("headline")), pattern)));
            }
            if (minYears != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("yearsExperience"), minYears));
            }
            if (maxYears != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("yearsExperience"), maxYears));
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
