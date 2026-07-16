import { FormEvent, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ProtectedRoute, RoleGate, useAuth } from "./auth";
import { ApiError } from "./lib/api";
import { BoardPage } from "./pages/BoardPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { VacanciesPage } from "./pages/VacanciesPage";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const tabs = [
  { to: "/board", label: "Board" },
  { to: "/candidates", label: "Candidates" },
  { to: "/vacancies", label: "Vacancies" },
  { to: "/companies", label: "Companies", adminOnly: true },
  { to: "/dashboard", label: "Dashboard" },
];

function LoginPage() {
  const { accessToken, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("recruiter@recruiting.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/board";

  if (accessToken) {
    return <Navigate to="/board" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (nextError) {
      const message =
        nextError instanceof ApiError ? nextError.message : "Could not start the session.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="panel login-panel" aria-labelledby="login-title">
        <h1 className="wordmark" id="login-title">
          Recruiting
        </h1>
        <p className="login-copy">Pipeline control for recruiters and admins.</p>
        <div className="demo-note">Demo users: recruiter@recruiting.local or admin@recruiting.local</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="recruiter@recruiting.local"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <aside className="hint-box">
          <p>Seed password</p>
          <ul className="hint-list">
            <li>
              <code>demo1234</code>
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-layout">
      <header className="top-tabs">
        <NavLink className="shell-brand" to="/board">
          Recruiting
        </NavLink>

        <nav className="tab-list" aria-label="Primary">
          {tabs.map((tab) =>
            tab.adminOnly ? (
              <RoleGate allow={["ADMIN"]} key={tab.to}>
                <NavLink className="tab-link" to={tab.to}>
                  {tab.label}
                </NavLink>
              </RoleGate>
            ) : (
              <NavLink className="tab-link" key={tab.to} to={tab.to}>
                {tab.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="session-area">
          <span className="user-chip">{user?.name ?? "Recruiter"}</span>
          <span className="role-badge">{user?.role ?? "RECRUITER"}</span>
          <button className="ghost" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route
            path="/companies"
            element={
              <RoleGate allow={["ADMIN"]}>
                <CompaniesPage />
              </RoleGate>
            }
          />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}
