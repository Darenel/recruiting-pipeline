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
import { LangToggle } from "./components";
import { useI18n, type TranslationKey } from "./i18n";
import { ApiError, isDemoMode } from "./lib/api";
import { getTheme, setTheme, type Theme } from "./lib/theme";
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
  { to: "/board", label: "tabs.board" },
  { to: "/candidates", label: "tabs.candidates" },
  { to: "/vacancies", label: "tabs.vacancies" },
  { to: "/companies", label: "tabs.companies", adminOnly: true },
  { to: "/dashboard", label: "tabs.dashboard" },
] satisfies Array<{ to: string; label: TranslationKey; adminOnly?: boolean }>;

function LoginPage() {
  const { accessToken, login } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(isDemoMode ? "admin@recruiting.local" : "recruiter@recruiting.local");
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
        nextError instanceof ApiError ? nextError.message : t("login.error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-lang">
        <LangToggle />
      </div>
      <section className="panel login-panel" aria-labelledby="login-title">
        <h1 className="wordmark" id="login-title">
          {t("app.name")}
        </h1>
        <p className="login-copy">{t("login.copy")}</p>
        <div className="demo-note">
          {isDemoMode
            ? t("login.demo.static")
            : t("login.demo.users")}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            {t("login.email")}
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
            {t("login.password")}
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
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <aside className="hint-box">
          <p>{t("login.seedPassword")}</p>
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const [theme, setCurrentTheme] = useState<Theme>(() => getTheme());

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleThemeToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setCurrentTheme(nextTheme);
  }

  return (
    <div className="app-layout">
      <header className="top-tabs">
        <NavLink className="shell-brand" to="/board">
          {t("app.name")}
        </NavLink>

        <nav className="tab-list" aria-label={t("app.primaryNav")}>
          {tabs.map((tab) =>
            tab.adminOnly ? (
              <RoleGate allow={["ADMIN"]} key={tab.to}>
                <NavLink className="tab-link" to={tab.to}>
                  {t(tab.label)}
                </NavLink>
              </RoleGate>
            ) : (
              <NavLink className="tab-link" key={tab.to} to={tab.to}>
                {t(tab.label)}
              </NavLink>
            ),
          )}
        </nav>

        <div className="session-area">
          <LangToggle />
          <button
            aria-label={t("theme.toggle")}
            aria-pressed={theme === "light"}
            className="ghost lang-toggle"
            onClick={handleThemeToggle}
            type="button"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <span className="user-chip">{user?.name ?? t("session.fallbackName")}</span>
          <span className="role-badge">{user?.role ?? t("session.fallbackRole")}</span>
          <button className="ghost" onClick={handleLogout} type="button">
            {t("session.logout")}
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
