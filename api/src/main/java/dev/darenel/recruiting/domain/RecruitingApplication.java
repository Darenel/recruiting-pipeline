package dev.darenel.recruiting.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "applications")
public class RecruitingApplication {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vacancy_id", nullable = false)
    private Vacancy vacancy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stage stage;

    @Column(nullable = false)
    private int score;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected RecruitingApplication() {
    }

    public RecruitingApplication(UUID id, Candidate candidate, Vacancy vacancy, Stage stage, int score,
            OffsetDateTime createdAt) {
        this.id = id;
        this.candidate = candidate;
        this.vacancy = vacancy;
        this.stage = stage;
        this.score = score;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public Vacancy getVacancy() {
        return vacancy;
    }

    public Stage getStage() {
        return stage;
    }

    public int getScore() {
        return score;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void updateScore(int score) {
        this.score = score;
    }
}
