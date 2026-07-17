import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ConfirmDialog,
  DataTable,
  FormField,
  Modal,
  Pagination,
  SearchInput,
  StackChips,
  StackToggleChips,
  useToast,
} from "../components";
import { ApiError } from "../lib/api";
import { useI18n } from "../i18n";
import { resources } from "../lib/resources";
import { Candidate, CandidateRequest, stacks, Stack } from "../lib/types";

const emptyCandidate: CandidateRequest = {
  name: "",
  email: "",
  headline: "",
  yearsExperience: 0,
  extraSkills: "",
  stacks: [],
};

export function CandidatesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedStacks, setSelectedStacks] = useState<Stack[]>([]);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState<CandidateRequest>(emptyCandidate);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeStack = selectedStacks[0] ?? "";
  const candidates = useQuery({
    queryKey: ["candidates", page, search, activeStack],
    queryFn: () => resources.candidates.list({ page, limit: 10, search, stack: activeStack }),
  });

  const save = useMutation({
    mutationFn: () => (editing?.id ? resources.candidates.update(editing.id, form) : resources.candidates.create(form)),
    onSuccess: () => {
      showToast(t("candidates.saved"), "success");
      setEditing(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : t("candidates.saveError")),
  });

  const remove = useMutation({
    mutationFn: (candidate: Candidate) => resources.candidates.remove(candidate.id),
    onSuccess: () => {
      showToast(t("candidates.deleted"), "success");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : t("candidates.deleteError")),
  });

  function openCreate() {
    setForm(emptyCandidate);
    setEditing({ id: "", createdAt: "", ...emptyCandidate } as Candidate);
    setError(null);
  }

  function openEdit(candidate: Candidate) {
    setEditing(candidate);
    setForm({
      name: candidate.name,
      email: candidate.email,
      headline: candidate.headline,
      yearsExperience: candidate.yearsExperience,
      extraSkills: candidate.extraSkills ?? "",
      stacks: candidate.stacks,
    });
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.headline.trim() || form.stacks.length === 0) {
      setError(t("candidates.validationRequired"));
      return;
    }
    save.mutate();
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">{t("candidates.kicker")}</p>
          <h1>{t("candidates.title")}</h1>
        </div>
        <button className="primary" onClick={openCreate} type="button">{t("candidates.new")}</button>
      </header>
      <div className="toolbar panel">
        <SearchInput onChange={(value) => { setPage(0); setSearch(value); }} placeholder={t("candidates.search")} value={search} />
        <StackToggleChips all={stacks} selected={selectedStacks} onChange={(next) => { setPage(0); setSelectedStacks(next); }} />
      </div>
      <section className="panel data-panel">
        <DataTable
          columns={[
            { key: "name", header: t("common.name"), render: (row) => <strong>{row.name}</strong> },
            { key: "headline", header: t("common.headline"), render: (row) => row.headline },
            { key: "stacks", header: t("common.stacks"), render: (row) => <StackChips stacks={row.stacks} /> },
            { key: "years", header: t("common.years"), render: (row) => row.yearsExperience },
          ]}
          rows={candidates.data?.data ?? []}
          getRowKey={(row) => row.id}
          loading={candidates.isLoading}
          actions={(row) => (
            <>
              <button className="ghost" onClick={() => openEdit(row)} type="button">{t("common.edit")}</button>
              <button className="danger" onClick={() => { setError(null); setDeleteTarget(row); }} type="button">{t("common.delete")}</button>
            </>
          )}
        />
        <Pagination page={page} limit={10} total={candidates.data?.total ?? 0} onPageChange={setPage} />
      </section>
      <Modal onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.id ? t("candidates.editTitle") : t("candidates.newTitle")} size="wide">
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField label={t("common.name")} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <FormField label={t("common.email")} required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <FormField label={t("common.headline")} required value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
          <FormField label={t("candidates.yearsExperience")} min={0} type="number" value={form.yearsExperience} onChange={(event) => setForm({ ...form, yearsExperience: Number(event.target.value) })} />
          <FormField as="textarea" label={t("candidates.extraSkills")} value={form.extraSkills} onChange={(event) => setForm({ ...form, extraSkills: event.target.value })} />
          <StackToggleChips all={stacks} selected={form.stacks} onChange={(next) => setForm({ ...form, stacks: next })} />
          {error ? <div className="error-box">{error}</div> : null}
          <footer className="modal-actions">
            <button className="ghost" onClick={() => setEditing(null)} type="button">{t("common.cancel")}</button>
            <button className="primary" disabled={save.isPending} type="submit">{t("common.save")}</button>
          </footer>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("candidates.deleteTitle")}
        message={`${t("candidates.deleteMessagePrefix")} ${deleteTarget?.name ?? t("candidates.deleteMessageFallback")}?`}
        error={error}
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget)}
      />
    </section>
  );
}
