import { useEffect, useState } from 'react';
import { getPreferredTheme, setTheme } from '../utils/theme';

export default function ThemeToggle() {
  const [theme, setLocal] = useState('light');
  useEffect(() => setLocal(getPreferredTheme()), []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setLocal(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
      title={`Tema actual: ${theme}. Click para cambiar.`}
      aria-label="Alternar modo oscuro"
    >
      {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}
