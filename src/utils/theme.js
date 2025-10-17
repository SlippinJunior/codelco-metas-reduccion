const THEME_KEY = 'theme';

export function getPreferredTheme() {
  // For now default to light on every load to avoid apps stuck in dark mode.
  // Theme will change only when the user explicitly presses the toggle.
  return 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function initTheme() {
  // Always start in light mode to avoid previously stored dark-states causing a stuck UI.
  applyTheme('light');
}
