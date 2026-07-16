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
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String headline;

    @Column(name = "years_experience", nullable = false)
    private int yearsExperience;

    @Column(name = "extra_skills")
    private String extraSkills;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "candidate_stacks", joinColumns = @JoinColumn(name = "candidate_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stack", nullable = false)
    private Set<Stack> stacks = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Candidate() {
    }

    public Candidate(UUID id, String name, String email, String headline, int yearsExperience, String extraSkills,
            Set<Stack> stacks, OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.headline = headline;
        this.yearsExperience = yearsExperience;
        this.extraSkills = extraSkills;
        this.stacks = new LinkedHashSet<>(stacks);
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getHeadline() {
        return headline;
    }

    public int getYearsExperience() {
        return yearsExperience;
    }

    public String getExtraSkills() {
        return extraSkills;
    }

    public Set<Stack> getStacks() {
        return stacks;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
