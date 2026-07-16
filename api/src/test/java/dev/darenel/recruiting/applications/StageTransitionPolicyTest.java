package dev.darenel.recruiting.applications;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.web.ConflictException;
import java.util.EnumSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StageTransitionPolicyTest {

    private final StageTransitionPolicy policy = new StageTransitionPolicy();

    @Test
    void recruiterMatrixCoversEveryStagePair() {
        for (Stage from : Stage.values()) {
            for (Stage to : Stage.values()) {
                if (legalRecruiterTransition(from, to)) {
                    assertThatCode(() -> policy.validate(from, to, Role.RECRUITER))
                            .as("%s -> %s should be legal for recruiter", from, to)
                            .doesNotThrowAnyException();
                } else {
                    assertThatThrownBy(() -> policy.validate(from, to, Role.RECRUITER))
                            .as("%s -> %s should be rejected for recruiter", from, to)
                            .isInstanceOf(ConflictException.class);
                }
            }
        }
    }

    @Test
    void adminMatrixAddsOnlyRejectedReopen() {
        for (Stage from : Stage.values()) {
            for (Stage to : Stage.values()) {
                if (legalAdminTransition(from, to)) {
                    assertThatCode(() -> policy.validate(from, to, Role.ADMIN))
                            .as("%s -> %s should be legal for admin", from, to)
                            .doesNotThrowAnyException();
                } else {
                    assertThatThrownBy(() -> policy.validate(from, to, Role.ADMIN))
                            .as("%s -> %s should be rejected for admin", from, to)
                            .isInstanceOf(ConflictException.class);
                }
            }
        }
    }

    @Test
    void terminalStagesRejectFurtherMovementExceptAdminReopenFromRejected() {
        Set<Stage> terminalStages = EnumSet.of(Stage.OFERTA, Stage.RECHAZADO);
        for (Stage from : terminalStages) {
            for (Stage to : Stage.values()) {
                if (from == Stage.RECHAZADO && to == Stage.POSTULADO) {
                    assertThatCode(() -> policy.validate(from, to, Role.ADMIN)).doesNotThrowAnyException();
                } else {
                    assertThatThrownBy(() -> policy.validate(from, to, Role.ADMIN))
                            .isInstanceOf(ConflictException.class);
                }
            }
        }
    }

    private boolean legalRecruiterTransition(Stage from, Stage to) {
        return switch (from) {
            case POSTULADO -> to == Stage.ENTREVISTA || to == Stage.RECHAZADO;
            case ENTREVISTA -> to == Stage.PRUEBA_TECNICA || to == Stage.RECHAZADO;
            case PRUEBA_TECNICA -> to == Stage.OFERTA || to == Stage.RECHAZADO;
            case OFERTA, RECHAZADO -> false;
        };
    }

    private boolean legalAdminTransition(Stage from, Stage to) {
        return legalRecruiterTransition(from, to) || (from == Stage.RECHAZADO && to == Stage.POSTULADO);
    }
}
