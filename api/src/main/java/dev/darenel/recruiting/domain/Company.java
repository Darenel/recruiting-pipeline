package dev.darenel.recruiting.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String industry;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Company() {
    }

    public Company(UUID id, String name, String industry, OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.industry = industry;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getIndustry() {
        return industry;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void update(String name, String industry) {
        this.name = name;
        this.industry = industry;
    }
}
