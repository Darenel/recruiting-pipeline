import { useI18n } from "../i18n";

export function LangToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <button
      aria-pressed={lang === "es"}
      className="ghost lang-toggle"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      type="button"
    >
      {t("lang.toggle")}
    </button>
  );
}
