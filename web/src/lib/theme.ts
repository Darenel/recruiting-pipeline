export type Theme = "dark" | "light";

const storageKey = "recruiting-theme";

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function initializeTheme(): Theme {
  const theme = window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
}
