import { Stack } from "../lib/types";
import { useI18n } from "../i18n";

type StackChipsProps = {
  stacks: Stack[];
};

export function StackChips({ stacks }: StackChipsProps) {
  return (
    <div className="chip-row">
      {stacks.map((stack) => (
        <span className="chip" key={stack}>
          {stack}
        </span>
      ))}
    </div>
  );
}

type StackToggleChipsProps = {
  all: Stack[];
  selected: Stack[];
  onChange: (next: Stack[]) => void;
};

export function StackToggleChips({ all, selected, onChange }: StackToggleChipsProps) {
  const { t } = useI18n();

  function toggle(stack: Stack) {
    onChange(selected.includes(stack) ? selected.filter((item) => item !== stack) : [...selected, stack]);
  }

  return (
    <div className="toggle-chip-row" role="group" aria-label={t("common.stacks")}>
      {all.map((stack) => (
        <button
          className={`toggle-chip ${selected.includes(stack) ? "is-selected" : ""}`}
          key={stack}
          onClick={() => toggle(stack)}
          type="button"
        >
          {stack}
        </button>
      ))}
    </div>
  );
}
