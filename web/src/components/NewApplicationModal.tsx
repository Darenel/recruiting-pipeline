import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../lib/api";
import { resources } from "../lib/resources";
import { Candidate, UUID, Vacancy } from "../lib/types";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { SearchInput } from "./SearchInput";
import { useToast } from "./Toast";

type NewApplicationModalProps = {
  open: boolean;
  vacancy?: Vacancy | null;
  onClose: () => void;
};

export function NewApplicationModal({ open, vacancy, onClose }: NewApplicationModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedVacancyId, setSelectedVacancyId] = useState<UUID>(vacancy?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const vacancies = useQuery({
    queryKey: ["vacancies", "open", "application-picker"],
    queryFn: () => resources.vacancies.list({ page: 0, limit: 100, status: "OPEN" }),
    enabled: open && !vacancy,
  });
  const candidates = useQuery({
    queryKey: ["candidates", "application-picker", candidateSearch],
    queryFn: () => resources.candidates.list({ page: 0, limit: 20, search: candidateSearch }),
    enabled: open,
  });

  const vacancyOptions = useMemo(() => vacancies.data?.data ?? [], [vacancies.data]);
  const candidateOptions = candidates.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => resources.applications.create(selectedCandidateId, vacancy?.id ?? selectedVacancyId),
    onSuccess: () => {
      showToast("Application created.", "success");
      setError(null);
      setSelectedCandidateId("");
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      onClose();
    },
    onError: (nextError) => {
      setError(nextError instanceof ApiError ? nextError.message : "Could not create the application.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <Modal onClose={onClose} open={open} title="New application" size="wide">
      <form className="modal-form" onSubmit={handleSubmit}>
        {vacancy ? (
          <div className="selected-summary">
            <span>Vacancy</span>
            <strong>{vacancy.title}</strong>
            <small>{vacancy.companyName}</small>
          </div>
        ) : (
          <FormField
            as="select"
            label="Vacancy"
            onChange={(event) => setSelectedVacancyId(event.target.value)}
            required
            value={selectedVacancyId}
          >
            <option value="">Pick an open vacancy</option>
            {vacancyOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} - {item.companyName}
              </option>
            ))}
          </FormField>
        )}

        <div className="candidate-picker">
          <SearchInput onChange={setCandidateSearch} placeholder="Search candidates" value={candidateSearch} />
          <div className="picker-list" role="listbox" aria-label="Candidates">
            {candidateOptions.map((candidate: Candidate) => (
              <button
                aria-selected={selectedCandidateId === candidate.id}
                className={`picker-option ${selectedCandidateId === candidate.id ? "is-selected" : ""}`}
                key={candidate.id}
                onClick={() => setSelectedCandidateId(candidate.id)}
                role="option"
                type="button"
              >
                <strong>{candidate.name}</strong>
                <span>{candidate.headline}</span>
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <footer className="modal-actions">
          <button className="ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary" disabled={!selectedCandidateId || !(vacancy?.id ?? selectedVacancyId) || createMutation.isPending} type="submit">
            {createMutation.isPending ? "Creating..." : "Create application"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
