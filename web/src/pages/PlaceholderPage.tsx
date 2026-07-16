type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  copy: string;
};

export function PlaceholderPage({ copy, eyebrow, title }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page" aria-labelledby={`${title.toLowerCase()}-title`}>
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">{eyebrow}</p>
          <h1 id={`${title.toLowerCase()}-title`}>{title}</h1>
        </div>
        <span className="chip">Phase 6+</span>
      </header>

      <p className="page-copy">{copy}</p>

      <section className="panel data-panel" aria-label={`${title} table preview`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>API integration pending</td>
                <td>
                  <span className="badge badge-primary">Ready</span>
                </td>
                <td>Recruiting team</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
