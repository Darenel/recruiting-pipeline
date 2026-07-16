package dev.darenel.recruiting.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "vacancies")
public class Vacancy {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String title;

    @Column(name = "seniority_years", nullable = false)
    private int seniorityYears;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VacancyStatus status;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "vacancy_stacks", joinColumns = @JoinColumn(name = "vacancy_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stack", nullable = false)
    private Set<Stack> stacks = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Vacancy() {
    }

    public Vacancy(UUID id, Company company, String title, int seniorityYears, VacancyStatus status, Set<Stack> stacks,
            OffsetDateTime createdAt) {
        this.id = id;
        this.company = company;
        this.title = title;
        this.seniorityYears = seniorityYears;
        this.status = status;
        this.stacks = new LinkedHashSet<>(stacks);
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Company getCompany() {
        return company;
    }

    public String getTitle() {
        return title;
    }

    public int getSeniorityYears() {
        return seniorityYears;
    }

    public VacancyStatus getStatus() {
        return status;
    }

    public Set<Stack> getStacks() {
        return stacks;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void update(Company company, String title, int seniorityYears, VacancyStatus status, Set<Stack> stacks) {
        this.company = company;
        this.title = title;
        this.seniorityYears = seniorityYears;
        this.status = status;
        this.stacks = new LinkedHashSet<>(stacks);
    }
}
