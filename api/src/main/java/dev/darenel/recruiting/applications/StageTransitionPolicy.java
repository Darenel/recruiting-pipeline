package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.web.ConflictException;
import java.util.Map;

public class StageTransitionPolicy {

    private static final Map<Stage, Stage> NEXT = Map.of(
            Stage.POSTULADO, Stage.ENTREVISTA,
            Stage.ENTREVISTA, Stage.PRUEBA_TECNICA,
            Stage.PRUEBA_TECNICA, Stage.OFERTA);

    public void validate(Stage from, Stage to, Role role) {
        if (from == to) {
            throw new ConflictException("Application is already in stage " + to);
        }
        if (from == Stage.RECHAZADO && to == Stage.POSTULADO && role == Role.ADMIN) {
            return;
        }
        if (from == Stage.OFERTA || from == Stage.RECHAZADO) {
            throw new ConflictException("Application is in a terminal stage");
        }
        if (to == Stage.RECHAZADO) {
            return;
        }
        if (NEXT.get(from) == to) {
            return;
        }
        throw new ConflictException("Illegal stage transition from " + from + " to " + to);
    }
}
