import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable, FormField, Modal, Pagination, SearchInput, useToast } from "../components";
import { ApiError } from "../lib/api";
import { resources } from "../lib/resources";
import { Company, CompanyRequest } from "../lib/types";
import { formatDate } from "../utils";

const emptyCompany: CompanyRequest = { name: "", industry: "" };

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
      showToast("Company saved.", "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (nextError) => setError(nextError instanceof ApiError ? nextError.message : "Could not save company."),
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
      setError("Name and industry are required.");
      return;
    }
    save.mutate();
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">Admin</p>
          <h1>Companies</h1>
        </div>
        <button className="primary" onClick={openCreate} type="button">New company</button>
      </header>
      <div className="toolbar panel">
        <SearchInput onChange={(value) => { setPage(0); setSearch(value); }} placeholder="Search companies" value={search} />
      </div>
      <section className="panel data-panel">
        <DataTable
          columns={[
            { key: "name", header: "Name", render: (row) => <strong>{row.name}</strong> },
            { key: "industry", header: "Industry", render: (row) => row.industry },
            { key: "created", header: "Created", render: (row) => formatDate(row.createdAt) },
          ]}
          rows={companies.data?.data ?? []}
          getRowKey={(row) => row.id}
          loading={companies.isLoading}
          actions={(row) => <button className="ghost" onClick={() => openEdit(row)} type="button">Edit</button>}
        />
        <Pagination page={page} limit={10} total={companies.data?.total ?? 0} onPageChange={setPage} />
      </section>
      <Modal onClose={() => setEditing(null)} open={Boolean(editing)} title={editing?.id ? "Edit company" : "New company"}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <FormField label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <FormField label="Industry" required value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} />
          {error ? <div className="error-box">{error}</div> : null}
          <footer className="modal-actions">
            <button className="ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="primary" disabled={save.isPending} type="submit">Save</button>
          </footer>
        </form>
      </Modal>
    </section>
  );
}
