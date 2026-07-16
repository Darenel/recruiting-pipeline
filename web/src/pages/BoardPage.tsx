const stages = [
  {
    title: "postulado",
    cards: [
      { name: "Camila Torres", role: "React engineer", score: 88 },
      { name: "Mateo Ruiz", role: "Java backend", score: 81 },
    ],
  },
  {
    title: "entrevista",
    cards: [{ name: "Laura Medina", role: "Full-stack SQL", score: 84 }],
  },
  {
    title: "prueba_tecnica",
    cards: [{ name: "Nicolas Vega", role: "Python data", score: 79 }],
  },
  {
    title: "oferta",
    cards: [{ name: "Sara Leon", role: ".NET developer", score: 91 }],
  },
  {
    title: "rechazado",
    cards: [{ name: "Diego Mora", role: "React junior", score: 52 }],
  },
];

export function BoardPage() {
  return (
    <section className="placeholder-page" aria-labelledby="board-title">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">Pipeline</p>
          <h1 id="board-title">Board</h1>
        </div>
        <span className="chip chip-primary">Default route</span>
      </header>

      <p className="page-copy">
        The Kanban board is the first authenticated workspace. Phase 6 will connect these columns
        to stage transitions, vacancy filters, and candidate drawers.
      </p>

      <div className="board-preview" aria-label="Pipeline stages">
        {stages.map((stage) => (
          <section className="stage-column" key={stage.title}>
            <span className="stage-title">{stage.title}</span>
            {stage.cards.map((card) => (
              <article className="candidate-card" key={card.name}>
                <strong>{card.name}</strong>
                <span>{card.role}</span>
                <span className={stage.title === "rechazado" ? "badge badge-danger" : "badge badge-primary"}>
                  Score {card.score}
                </span>
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
