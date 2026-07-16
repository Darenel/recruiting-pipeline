package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.repository.CompanyRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import dev.darenel.recruiting.web.ConflictException;
import dev.darenel.recruiting.web.NotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    private static final Set<String> SORT_FIELDS = Set.of("name", "industry", "createdAt");

    private final CompanyRepository companies;
    private final VacancyRepository vacancies;

    public CompanyService(CompanyRepository companies, VacancyRepository vacancies) {
        this.companies = companies;
        this.vacancies = vacancies;
    }

    @Transactional(readOnly = true)
    public PageResponse<CompanyResponse> list(int page, int limit, String search, String sortBy, String sortDir) {
        Page<Company> result = companies.findAll(searchSpec(search), pageRequest(page, limit, sortBy, sortDir));
        List<CompanyResponse> data = result.getContent().stream()
                .map(CompanyResponse::from)
                .toList();
        return new PageResponse<>(data, result.getTotalElements(), normalizedPage(page), normalizedLimit(limit));
    }

    @Transactional(readOnly = true)
    public CompanyResponse get(UUID id) {
        return CompanyResponse.from(find(id));
    }

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        Company company = new Company(UUID.randomUUID(), request.name(), request.industry(), OffsetDateTime.now());
        return CompanyResponse.from(companies.save(company));
    }

    @Transactional
    public CompanyResponse update(UUID id, CompanyRequest request) {
        Company company = find(id);
        company.update(request.name(), request.industry());
        return CompanyResponse.from(company);
    }

    @Transactional
    public void delete(UUID id) {
        Company company = find(id);
        if (vacancies.existsByCompanyId(id)) {
            throw new ConflictException("Cannot delete company while vacancies reference it");
        }
        companies.delete(company);
    }

    private Company find(UUID id) {
        return companies.findById(id)
                .orElseThrow(() -> new NotFoundException("Company not found"));
    }

    private Specification<Company> searchSpec(String search) {
        return (root, query, builder) -> {
            if (search == null || search.isBlank()) {
                return builder.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return builder.like(builder.lower(root.get("name")), pattern);
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
