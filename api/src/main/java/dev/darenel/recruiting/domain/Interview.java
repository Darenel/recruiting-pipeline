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
@Table(name = "interviews")
public class Interview {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private RecruitingApplication application;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewKind kind;

    private String notes;

    private Integer rating;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "by_user_id", nullable = false)
    private User byUser;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Interview() {
    }

    public Interview(UUID id, RecruitingApplication application, OffsetDateTime scheduledAt, InterviewKind kind,
            String notes, Integer rating, User byUser, OffsetDateTime createdAt) {
        this.id = id;
        this.application = application;
        this.scheduledAt = scheduledAt;
        this.kind = kind;
        this.notes = notes;
        this.rating = rating;
        this.byUser = byUser;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public RecruitingApplication getApplication() {
        return application;
    }

    public OffsetDateTime getScheduledAt() {
        return scheduledAt;
    }

    public InterviewKind getKind() {
        return kind;
    }

    public String getNotes() {
        return notes;
    }

    public Integer getRating() {
        return rating;
    }

    public User getByUser() {
        return byUser;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void update(String notes, Integer rating) {
        this.notes = notes;
        this.rating = rating;
    }
}
