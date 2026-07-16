package dev.darenel.recruiting.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.repository.CompanyRepository;
import dev.darenel.recruiting.repository.VacancyRepository;
import dev.darenel.recruiting.web.ConflictException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companies;

    @Mock
    private VacancyRepository vacancies;

    @InjectMocks
    private CompanyService service;

    @Test
    void listNormalizesPaginationAndSort() {
        Company company = company();
        when(companies.findAll(ArgumentMatchers.<Specification<Company>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(company)));

        PageResponse<CompanyResponse> response = service.list(-2, 500, "nocturno", "name", "asc");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(companies).findAll(ArgumentMatchers.<Specification<Company>>any(), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
        assertThat(pageable.getValue().getSort().getOrderFor("name").isAscending()).isTrue();
        assertThat(response.page()).isZero();
        assertThat(response.limit()).isEqualTo(100);
        assertThat(response.total()).isEqualTo(1);
    }

    @Test
    void deleteRejectsCompanyWithVacancies() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000101");
        when(companies.findById(id)).thenReturn(Optional.of(company()));
        when(vacancies.existsByCompanyId(id)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Cannot delete company while vacancies reference it");
    }

    private Company company() {
        return new Company(
                UUID.fromString("00000000-0000-0000-0000-000000000101"),
                "Nocturno Labs",
                "Software",
                OffsetDateTime.parse("2026-07-16T10:00:00Z"));
    }
}
