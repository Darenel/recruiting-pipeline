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
@Table(name = "stage_events")
public class StageEvent {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private RecruitingApplication application;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_stage")
    private Stage fromStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_stage", nullable = false)
    private Stage toStage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "by_user_id", nullable = false)
    private User byUser;

    private String note;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected StageEvent() {
    }

    public StageEvent(UUID id, RecruitingApplication application, Stage fromStage, Stage toStage, User byUser,
            String note, OffsetDateTime createdAt) {
        this.id = id;
        this.application = application;
        this.fromStage = fromStage;
        this.toStage = toStage;
        this.byUser = byUser;
        this.note = note;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public RecruitingApplication getApplication() {
        return application;
    }

    public Stage getFromStage() {
        return fromStage;
    }

    public Stage getToStage() {
        return toStage;
    }

    public User getByUser() {
        return byUser;
    }

    public String getNote() {
        return note;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
