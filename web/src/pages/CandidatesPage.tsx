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
      showToast("Candidate saved.", "success");
      setEditing(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : "Could not save candidate."),
  });

  const remove = useMutation({
    mutationFn: (candidate: Candidate) => resources.candidates.remove(candidate.id),
    onSuccess: () => {
      showToast("Candidate deleted.", "success");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : "Could not delete candidate."),
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
      setError("Name, email, headline, and at least one stack are required.");
      return;
    }
    save.mutate();
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">Catalog</p>
          <h1>Candidates</h1>
        </div>
        <button className="primary" onClick={openCreate} type="button">New candidate</button>
      </header>
      <div className="toolbar panel">
        <SearchInput onChange={(value) => { setPage(0); setSearch(value); }} placeholder="Search candidates" value={search} />
        <StackToggleChips all={stacks} selected={selectedStacks} onChange={(next) => { setPage(0); setSelectedStacks(next); }} />
      </div>
      <section className="panel data-panel">
        <DataTable
          columns={[
            { key: "name", header: "Name", render: (row) => <strong>{row.name}</strong> },
            { key: "headline", header: "Headline", render: (row) => row.headline },
            { key: "stacks", header: "Stacks", render: (row) => <StackChips stacks={row.stacks} /> },
            { key: "years", header: "Years", render: (row) => row.yearsExperience },
          ]}
          rows={candidates.data?.data ?? []}
          getRowKey={(row) => row.id}
          loading={candidates.isLoading}
          actions={(row) => (
            <>
              <button className="ghost" onClick={() => openEdit(row)} type="button">Edit</button>
              <button className="danger" onClick={() => { setError(null); setDeleteTarget(row); }} type="button">Delete</button>
            </>
          )}
        />
        <Pagination page={page} limit={10} total={candidates.data?.total ?? 0} onPageChange={setPage} />
      </section>
      <Modal onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.id ? "Edit candidate" : "New candidate"} size="wide">
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <FormField label="Email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <FormField label="Headline" required value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
          <FormField label="Years experience" min={0} type="number" value={form.yearsExperience} onChange={(event) => setForm({ ...form, yearsExperience: Number(event.target.value) })} />
          <FormField as="textarea" label="Extra skills" value={form.extraSkills} onChange={(event) => setForm({ ...form, extraSkills: event.target.value })} />
          <StackToggleChips all={stacks} selected={form.stacks} onChange={(next) => setForm({ ...form, stacks: next })} />
          {error ? <div className="error-box">{error}</div> : null}
          <footer className="modal-actions">
            <button className="ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="primary" disabled={save.isPending} type="submit">Save</button>
          </footer>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete candidate"
        message={`Delete ${deleteTarget?.name ?? "this candidate"}?`}
        error={error}
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget)}
      />
    </section>
  );
}
