package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.Vacancy;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VacancyRepository extends JpaRepository<Vacancy, UUID> {
}
