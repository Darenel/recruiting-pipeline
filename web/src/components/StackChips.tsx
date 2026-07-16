import { Stack } from "../lib/types";

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
  function toggle(stack: Stack) {
    onChange(selected.includes(stack) ? selected.filter((item) => item !== stack) : [...selected, stack]);
  }

  return (
    <div className="toggle-chip-row" role="group" aria-label="Stacks">
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
