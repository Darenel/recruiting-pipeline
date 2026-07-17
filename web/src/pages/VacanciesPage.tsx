import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { DataTable, FormField, Modal, NewApplicationModal, Pagination, SearchInput, StackChips, StackToggleChips, useToast } from "../components";
import { ApiError } from "../lib/api";
import { useI18n, type TranslationKey } from "../i18n";
import { resources } from "../lib/resources";
import { Stack, stacks, Vacancy, VacancyRequest, VacancyStatus } from "../lib/types";

const emptyVacancy: VacancyRequest = { companyId: "", title: "", seniorityYears: 0, status: "OPEN", stacks: [] };
const statusLabelKeys: Record<VacancyStatus, TranslationKey> = {
  OPEN: "status.OPEN",
  CLOSED: "status.CLOSED",
};

export function VacanciesPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [stack, setStack] = useState<Stack | "">("");
  const [status, setStatus] = useState<VacancyStatus | "">("");
  const [companyId, setCompanyId] = useState("");
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [form, setForm] = useState<VacancyRequest>(emptyVacancy);
  const [newApplicationVacancy, setNewApplicationVacancy] = useState<Vacancy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vacancies = useQuery({ queryKey: ["vacancies", page, search, stack, status, companyId], queryFn: () => resources.vacancies.list({ page, limit: 10, search, stack, status, companyId }) });
  const companies = useQuery({ queryKey: ["companies", "all"], queryFn: () => resources.companies.list({ page: 0, limit: 100 }) });

  const save = useMutation({
    mutationFn: () => (editing?.id ? resources.vacancies.update(editing.id, form) : resources.vacancies.create(form)),
    onSuccess: () => { showToast(t("vacancies.saved"), "success"); setEditing(null); queryClient.invalidateQueries({ queryKey: ["vacancies"] }); },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : t("vacancies.saveError")),
  });

  const openCreate = () => { setEditing({ id: "", companyName: "", createdAt: "", ...emptyVacancy } as Vacancy); setForm(emptyVacancy); setError(null); };
  const openEdit = (vacancy: Vacancy) => { setEditing(vacancy); setForm({ companyId: vacancy.companyId, title: vacancy.title, seniorityYears: vacancy.seniorityYears, status: vacancy.status, stacks: vacancy.stacks }); setError(null); };
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyId || !form.title.trim() || form.stacks.length === 0) {
      setError(t("vacancies.validationRequired"));
      return;
    }
    save.mutate();
  }

  function closeOrOpen(vacancy: Vacancy) {
    resources.vacancies
      .update(vacancy.id, { companyId: vacancy.companyId, title: vacancy.title, seniorityYears: vacancy.seniorityYears, status: vacancy.status === "OPEN" ? "CLOSED" : "OPEN", stacks: vacancy.stacks })
      .then(() => { showToast(t("vacancies.statusUpdated"), "success"); queryClient.invalidateQueries({ queryKey: ["vacancies"] }); queryClient.invalidateQueries({ queryKey: ["board"] }); })
      .catch((nextError) => showToast(nextError instanceof ApiError ? nextError.message : t("vacancies.updateError"), "error"));
  }

  return (
    <section className="module-page">
      <header className="page-header"><div><p className="placeholder-kicker">{t("vacancies.kicker")}</p><h1>{t("vacancies.title")}</h1></div>{role === "ADMIN" ? <button className="primary" onClick={openCreate} type="button">{t("vacancies.new")}</button> : null}</header>
      <div className="toolbar panel">
        <SearchInput onChange={(value) => { setPage(0); setSearch(value); }} placeholder={t("vacancies.search")} value={search} />
        <select aria-label={t("common.stacks")} onChange={(event) => setStack(event.target.value as Stack | "")} value={stack}><option value="">{t("common.allStacks")}</option>{stacks.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select aria-label={t("common.status")} onChange={(event) => setStatus(event.target.value as VacancyStatus | "")} value={status}><option value="">{t("common.allStatus")}</option><option value="OPEN">{t("status.OPEN")}</option><option value="CLOSED">{t("status.CLOSED")}</option></select>
        <select aria-label={t("common.company")} onChange={(event) => setCompanyId(event.target.value)} value={companyId}><option value="">{t("common.allCompanies")}</option>{companies.data?.data.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
      </div>
      <section className="panel data-panel">
        <DataTable
          columns={[
            { key: "title", header: t("common.title"), render: (row) => <strong>{row.title}</strong> },
            { key: "company", header: t("common.company"), render: (row) => row.companyName },
            { key: "stacks", header: t("common.stacks"), render: (row) => <StackChips stacks={row.stacks} /> },
            { key: "seniority", header: t("vacancies.seniority"), render: (row) => `${row.seniorityYears}+ ${t("common.yearsSuffix")}` },
            { key: "status", header: t("common.status"), render: (row) => <span className={`badge ${row.status === "OPEN" ? "badge-success" : "badge-quiet"}`}>{t(statusLabelKeys[row.status])}</span> },
          ]}
          rows={vacancies.data?.data ?? []}
          getRowKey={(row) => row.id}
          loading={vacancies.isLoading}
          actions={(row) => (
            <>
              <button className="ghost" onClick={() => setNewApplicationVacancy(row)} disabled={row.status !== "OPEN"} type="button">{t("common.apply")}</button>
              {role === "ADMIN" ? <button className="ghost" onClick={() => openEdit(row)} type="button">{t("common.edit")}</button> : null}
              {role === "ADMIN" ? <button className="ghost" onClick={() => closeOrOpen(row)} type="button">{row.status === "OPEN" ? t("common.close") : t("common.open")}</button> : null}
            </>
          )}
        />
        <Pagination page={page} limit={10} total={vacancies.data?.total ?? 0} onPageChange={setPage} />
      </section>
      <Modal onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.id ? t("vacancies.editTitle") : t("vacancies.newTitle")} size="wide">
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField as="select" label={t("common.company")} required value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">{t("common.pickCompany")}</option>{companies.data?.data.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</FormField>
          <FormField label={t("common.title")} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <FormField label={t("vacancies.seniorityYears")} min={0} type="number" value={form.seniorityYears} onChange={(event) => setForm({ ...form, seniorityYears: Number(event.target.value) })} />
          <FormField as="select" label={t("common.status")} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as VacancyStatus })}><option value="OPEN">{t("status.OPEN")}</option><option value="CLOSED">{t("status.CLOSED")}</option></FormField>
          <StackToggleChips all={stacks} selected={form.stacks} onChange={(next) => setForm({ ...form, stacks: next })} />
          {error ? <div className="error-box">{error}</div> : null}
          <footer className="modal-actions"><button className="ghost" onClick={() => setEditing(null)} type="button">{t("common.cancel")}</button><button className="primary" disabled={save.isPending} type="submit">{t("common.save")}</button></footer>
        </form>
      </Modal>
      <NewApplicationModal open={Boolean(newApplicationVacancy)} vacancy={newApplicationVacancy} onClose={() => setNewApplicationVacancy(null)} />
    </section>
  );
}
