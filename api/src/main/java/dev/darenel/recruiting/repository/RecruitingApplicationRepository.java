package dev.darenel.recruiting.repository;

import dev.darenel.recruiting.domain.RecruitingApplication;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruitingApplicationRepository extends JpaRepository<RecruitingApplication, UUID> {
}
