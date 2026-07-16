package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.dashboard.StackCount;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface VacancyRepository extends JpaRepository<Vacancy, UUID>, JpaSpecificationExecutor<Vacancy> {

    boolean existsByCompanyId(UUID companyId);

    long countByStatus(VacancyStatus status);

    @Query("""
            select new dev.darenel.recruiting.dashboard.StackCount(stack, count(distinct vacancy.id))
            from Vacancy vacancy
            join vacancy.stacks stack
            where vacancy.status = dev.darenel.recruiting.domain.VacancyStatus.OPEN
            group by stack
            """)
    List<StackCount> countOpenVacanciesByStack();
}
