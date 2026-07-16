package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.Vacancy;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VacancyRepository extends JpaRepository<Vacancy, UUID>, JpaSpecificationExecutor<Vacancy> {

    boolean existsByCompanyId(UUID companyId);
}
