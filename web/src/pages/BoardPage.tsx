import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth";
import {
  Drawer,
  FormField,
  Modal,
  NewApplicationModal,
  ScoreBadge,
  StackChips,
  useToast,
} from "../components";
import { ApiError } from "../lib/api";
import { useI18n, type TranslationKey } from "../i18n";
import { resources } from "../lib/resources";
import {
  ApplicationDetail,
  Board,
  BoardApplication,
  BoardColumn,
  interviewKinds,
  stages,
  Stage,
  UUID,
  Vacancy,
  InterviewKind,
} from "../lib/types";
import { formatDate } from "../utils";

type MoveRequest = {
  id: UUID;
  fromStage: Stage;
  toStage: Stage;
  note: string;
};

const stageLabelKeys: Record<Stage, TranslationKey> = {
  POSTULADO: "stage.POSTULADO",
  ENTREVISTA: "stage.ENTREVISTA",
  PRUEBA_TECNICA: "stage.PRUEBA_TECNICA",
  OFERTA: "stage.OFERTA",
  RECHAZADO: "stage.RECHAZADO",
};

const interviewKindLabelKeys: Record<InterviewKind, TranslationKey> = {
  PHONE: "interview.PHONE",
  TECHNICAL: "interview.TECHNICAL",
  CULTURAL: "interview.CULTURAL",
  FINAL: "interview.FINAL",
};

function normalizeBoard(board?: Board): Board {
  return {
    columns: stages.map((stage) => ({
      stage,
      applications: board?.columns.find((column) => column.stage === stage)?.applications ?? [],
    })),
  };
}

function findCard(board: Board | undefined, id: UUID): { card: BoardApplication; stage: Stage } | null {
  for (const column of board?.columns ?? []) {
    const card = column.applications.find((item) => item.id === id);
    if (card) {
      return { card, stage: column.stage };
    }
  }
  return null;
}

function moveCard(board: Board, id: UUID, toStage: Stage): Board {
  const found = findCard(board, id);
  if (!found) {
    return board;
  }

  return {
    columns: board.columns.map((column) => {
      const applications = column.applications.filter((item) => item.id !== id);
      return column.stage === toStage ? { ...column, applications: [found.card, ...applications] } : { ...column, applications };
    }),
  };
}

export function BoardPage() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [vacancySearch, setVacancySearch] = useState("");
  const [vacancyId, setVacancyId] = useState<UUID | "">("");
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [moveDraft, setMoveDraft] = useState<MoveRequest | null>(null);
  const [moveMenuId, setMoveMenuId] = useState<UUID | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<UUID | null>(null);
  const [newApplicationVacancy, setNewApplicationVacancy] = useState<Vacancy | null>(null);

  const vacancies = useQuery({
    queryKey: ["vacancies", "open", vacancySearch],
    queryFn: () => resources.vacancies.list({ page: 0, limit: 100, status: "OPEN", search: vacancySearch }),
  });

  const boardQueryKey = ["board", vacancyId] as const;
  const board = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => resources.applications.board(vacancyId),
  });

  const detail = useQuery({
    queryKey: ["applications", selectedApplicationId],
    queryFn: () => resources.applications.get(selectedApplicationId ?? ""),
    enabled: Boolean(selectedApplicationId),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, toStage, note }: MoveRequest) => resources.applications.move(id, toStage, note),
    onMutate: async ({ id, toStage }) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const previous = queryClient.getQueryData<Board>(boardQueryKey);
      if (previous) {
        queryClient.setQueryData<Board>(boardQueryKey, moveCard(previous, id, toStage));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardQueryKey, context.previous);
      }
      showToast(error instanceof ApiError ? error.message : t("board.moveError"), "error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", selectedApplicationId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
  });

  const boardData = normalizeBoard(board.data);
  const selectedVacancy = useMemo(
    () => vacancies.data?.data.find((vacancy) => vacancy.id === vacancyId) ?? null,
    [vacancies.data, vacancyId],
  );

  function startMove(id: UUID, fromStage: Stage, toStage: Stage) {
    if (fromStage === toStage) {
      return;
    }
    setMoveDraft({ id, fromStage, toStage, note: "" });
  }

  function submitMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (moveDraft) {
      moveMutation.mutate(moveDraft);
      setMoveDraft(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>, toStage: Stage) {
    event.preventDefault();
    setDragOverStage(null);
    const id = event.dataTransfer.getData("application/id");
    const fromStage = event.dataTransfer.getData("application/stage") as Stage;
    if (id && fromStage) {
      startMove(id, fromStage, toStage);
    }
  }

  const openNewApplication = () => setNewApplicationVacancy(selectedVacancy ?? ({ id: "", title: "", companyName: "" } as Vacancy));

  return (
    <section className="module-page" aria-labelledby="board-title">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">{t("board.kicker")}</p>
          <h1 id="board-title">{t("board.title")}</h1>
        </div>
        <button className="primary" onClick={openNewApplication} type="button">
          {t("board.newApplication")}
        </button>
      </header>

      <div className="toolbar panel">
        <label className="searchable-select">
          {t("board.openVacancy")}
          <input
            list="open-vacancies"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setVacancySearch(event.target.value)}
            placeholder={t("board.searchOpenVacancies")}
            type="search"
            value={vacancySearch}
          />
          <datalist id="open-vacancies">
            {vacancies.data?.data.map((vacancy) => (
              <option key={vacancy.id} value={`${vacancy.title} - ${vacancy.companyName}`} />
            ))}
          </datalist>
        </label>
        <select aria-label={t("board.filterByVacancy")} onChange={(event) => setVacancyId(event.target.value)} value={vacancyId}>
          <option value="">{t("board.allOpenVacancies")}</option>
          {vacancies.data?.data.map((vacancy) => (
            <option key={vacancy.id} value={vacancy.id}>
              {vacancy.title} - {vacancy.companyName}
            </option>
          ))}
        </select>
      </div>

      <div className="board-preview" aria-busy={board.isLoading} aria-label={t("board.pipelineStages")}>
        {boardData.columns.map((column: BoardColumn) => (
          <section
            className={`stage-column stage-${column.stage.toLowerCase()} ${dragOverStage === column.stage ? "is-drop-target" : ""}`}
            key={column.stage}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStage(column.stage);
            }}
            onDrop={(event) => handleDrop(event, column.stage)}
          >
            <header className="stage-header">
              <span className="stage-title">{t(stageLabelKeys[column.stage])}</span>
              <span className="chip">{column.applications.length}</span>
            </header>
            {column.applications.map((card) => (
              <article
                className="candidate-card"
                draggable
                key={card.id}
                onClick={() => setSelectedApplicationId(card.id)}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/id", card.id);
                  event.dataTransfer.setData("application/stage", column.stage);
                }}
                role="button"
                tabIndex={0}
              >
                <strong>{card.candidateName}</strong>
                <span>{card.headline}</span>
                <div className="card-meta">
                  <ScoreBadge score={card.score} />
                  <span>{card.daysInStage}{t("board.daysInStageShort")}</span>
                  <span aria-label={`${card.interviewCount} ${t("board.interviews")}`}>@ {card.interviewCount}</span>
                </div>
                <div className="move-menu" onClick={(event) => event.stopPropagation()}>
                  <button
                    aria-expanded={moveMenuId === card.id}
                    aria-haspopup="listbox"
                    className="ghost"
                    onClick={() => setMoveMenuId(moveMenuId === card.id ? null : card.id)}
                    type="button"
                  >
                    {t("board.moveTo")}
                  </button>
                  {moveMenuId === card.id ? (
                    <div className="move-listbox" role="listbox" aria-label={`${t("board.moveCandidate")} ${card.candidateName}`}>
                      {stages
                        .filter((stage) => stage !== column.stage)
                        .map((stage) => (
                          <button
                            className="move-option"
                            key={stage}
                            onClick={() => {
                              setMoveMenuId(null);
                              startMove(card.id, column.stage, stage);
                            }}
                            role="option"
                            type="button"
                          >
                            {t(stageLabelKeys[stage])}
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
                {role === "ADMIN" && column.stage === "RECHAZADO" ? (
                  <button
                    className="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      startMove(card.id, column.stage, "POSTULADO");
                    }}
                    type="button"
                  >
                    {t("board.reopen")}
                  </button>
                ) : null}
              </article>
            ))}
          </section>
        ))}
      </div>

      <CandidateDrawer
        application={detail.data}
        loading={detail.isLoading}
        onClose={() => setSelectedApplicationId(null)}
        open={Boolean(selectedApplicationId)}
      />

      <Modal onClose={() => setMoveDraft(null)} open={Boolean(moveDraft)} title={t("board.moveApplication")}>
        <form className="modal-form" onSubmit={submitMove}>
          <p className="muted-copy">
            {t("board.moveFrom")} {moveDraft ? t(stageLabelKeys[moveDraft.fromStage]) : ""} {t("board.to")} {moveDraft ? t(stageLabelKeys[moveDraft.toStage]) : ""}.
          </p>
          <FormField
            as="textarea"
            label={t("board.note")}
            maxLength={2000}
            onChange={(event) => setMoveDraft((current) => (current ? { ...current, note: event.target.value } : current))}
            placeholder={t("board.notePlaceholder")}
            value={moveDraft?.note ?? ""}
          />
          <footer className="modal-actions">
            <button className="ghost" onClick={() => setMoveDraft(null)} type="button">
              {t("common.cancel")}
            </button>
            <button className="primary" disabled={moveMutation.isPending} type="submit">
              {t("board.move")}
            </button>
          </footer>
        </form>
      </Modal>

      <NewApplicationModal
        onClose={() => setNewApplicationVacancy(null)}
        open={Boolean(newApplicationVacancy)}
        vacancy={newApplicationVacancy?.id ? newApplicationVacancy : undefined}
      />
    </section>
  );
}

function CandidateDrawer({
  application,
  loading,
  open,
  onClose,
}: {
  application?: ApplicationDetail;
  loading: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [scheduledAt, setScheduledAt] = useState("");
  const [kind, setKind] = useState("PHONE");
  const [rating, setRating] = useState("3");
  const [notes, setNotes] = useState("");
  const canAddInterview = application?.stage === "ENTREVISTA" || application?.stage === "PRUEBA_TECNICA";

  const addInterview = useMutation({
    mutationFn: () =>
      resources.applications.addInterview(application?.id ?? "", {
        scheduledAt: new Date(scheduledAt).toISOString(),
        kind: kind as (typeof interviewKinds)[number],
        notes,
        rating: rating ? Number(rating) : null,
      }),
    onSuccess: () => {
      showToast(t("drawer.interviewAdded"), "success");
      setScheduledAt("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["applications", application?.id] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : t("drawer.addInterviewError"), "error"),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addInterview.mutate();
  }

  return (
    <Drawer onClose={onClose} open={open} title={application?.candidate.name ?? t("drawer.application")}>
      {loading || !application ? (
        <div className="drawer-body">{t("common.loading")}</div>
      ) : (
        <div className="drawer-body">
          <section className="detail-summary">
            <ScoreBadge score={application.score} />
            <div>
              <strong>{application.vacancy.title}</strong>
              <span>{application.vacancy.companyName}</span>
            </div>
            <StackChips stacks={application.candidate.stacks} />
          </section>

          <section className="drawer-section">
            <h3>{t("drawer.stageHistory")}</h3>
            <ol className="timeline">
              {application.history.map((event) => (
                <li key={event.id}>
                  <strong>{t(stageLabelKeys[event.toStage])}</strong>
                  <span>
                    {formatDate(event.createdAt)} {t("common.by")} {event.byUserName}
                  </span>
                  {event.note ? <p>{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="drawer-section">
            <h3>{t("drawer.interviews")}</h3>
            <div className="interview-list">
              {application.interviews.map((interview) => (
                <article className="interview-item" key={interview.id}>
                  <strong>{t(interviewKindLabelKeys[interview.kind])}</strong>
                  <span>{formatDate(interview.scheduledAt)}</span>
                  <span aria-label={`${interview.rating ?? 0} ${t("drawer.stars")}`}>{"*".repeat(interview.rating ?? 0)}</span>
                  {interview.notes ? <p>{interview.notes}</p> : null}
                </article>
              ))}
              {application.interviews.length === 0 ? <p className="muted-copy">{t("drawer.noInterviews")}</p> : null}
            </div>

            {canAddInterview ? (
              <form className="drawer-form" onSubmit={handleSubmit}>
                <FormField label={t("drawer.scheduledAt")} onChange={(event) => setScheduledAt(event.target.value)} required type="datetime-local" value={scheduledAt} />
                <FormField as="select" label={t("drawer.kind")} onChange={(event) => setKind(event.target.value)} value={kind}>
                  {interviewKinds.map((item) => (
                    <option key={item} value={item}>
                      {t(interviewKindLabelKeys[item])}
                    </option>
                  ))}
                </FormField>
                <FormField as="select" label={t("drawer.rating")} onChange={(event) => setRating(event.target.value)} value={rating}>
                  <option value="">{t("drawer.unrated")}</option>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </FormField>
                <FormField as="textarea" label={t("drawer.notes")} onChange={(event) => setNotes(event.target.value)} value={notes} />
                <button className="primary" disabled={addInterview.isPending} type="submit">
                  {t("drawer.addInterview")}
                </button>
              </form>
            ) : null}
          </section>
        </div>
      )}
    </Drawer>
  );
}
