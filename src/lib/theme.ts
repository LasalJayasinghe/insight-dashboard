// Simple theme manager. Dark is default; toggle adds/removes `light` class on <html>.
export type Theme = "dark" | "light";
const KEY = "td-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem(KEY, theme);
}
