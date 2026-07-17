import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable, FormField, Modal, Pagination, SearchInput, useToast } from "../components";
import { ApiError } from "../lib/api";
import { useI18n } from "../i18n";
import { resources } from "../lib/resources";
import { Company, CompanyRequest } from "../lib/types";
import { formatDate } from "../utils";

const emptyCompany: CompanyRequest = { name: "", industry: "" };

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyRequest>(emptyCompany);
  const [error, setError] = useState<string | null>(null);

  const companies = useQuery({
    queryKey: ["companies", page, search],
    queryFn: () => resources.companies.list({ page, limit: 10, search }),
  });

  const save = useMutation({
    mutationFn: () => (editing?.id ? resources.companies.update(editing.id, form) : resources.companies.create(form)),
    onSuccess: () => {
      showToast(t("companies.saved"), "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : t("companies.saveError")),
  });

  function openCreate() {
    setEditing({ id: "", createdAt: "", ...emptyCompany });
    setForm(emptyCompany);
    setError(null);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({ name: company.name, industry: company.industry });
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.industry.trim()) {
      setError(t("companies.validationRequired"));
      return;
    }
    save.mutate();
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">{t("companies.kicker")}</p>
          <h1>{t("companies.title")}</h1>
        </div>
        <button className="primary" onClick={openCreate} type="button">{t("companies.new")}</button>
      </header>
      <div className="toolbar panel">
        <SearchInput onChange={(value) => { setPage(0); setSearch(value); }} placeholder={t("companies.search")} value={search} />
      </div>
      <section className="panel data-panel">
        <DataTable
          columns={[
            { key: "name", header: t("common.name"), render: (row) => <strong>{row.name}</strong> },
            { key: "industry", header: t("common.industry"), render: (row) => row.industry },
            { key: "created", header: t("common.created"), render: (row) => formatDate(row.createdAt) },
          ]}
          rows={companies.data?.data ?? []}
          getRowKey={(row) => row.id}
          loading={companies.isLoading}
          actions={(row) => <button className="ghost" onClick={() => openEdit(row)} type="button">{t("common.edit")}</button>}
        />
        <Pagination page={page} limit={10} total={companies.data?.total ?? 0} onPageChange={setPage} />
      </section>
      <Modal onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.id ? t("companies.editTitle") : t("companies.newTitle")}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField label={t("common.name")} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <FormField label={t("common.industry")} required value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} />
          {error ? <div className="error-box">{error}</div> : null}
          <footer className="modal-actions">
            <button className="ghost" onClick={() => setEditing(null)} type="button">{t("common.cancel")}</button>
            <button className="primary" disabled={save.isPending} type="submit">{t("common.save")}</button>
          </footer>
        </form>
      </Modal>
    </section>
  );
}
