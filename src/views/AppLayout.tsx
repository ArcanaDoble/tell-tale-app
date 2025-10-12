import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { label: 'Biblioteca', path: '/' },
  { label: 'Destacados', path: '/details/demo' }
];

function AppLayout(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (): void => {
    setIsMenuOpen((previous) => !previous);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,63,211,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,122,89,0.12),_transparent_45%)]" />
      </div>
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-lg text-primary">📚</span>
            Tell Tale Reader
          </NavLink>
          <nav className="hidden items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors hover:bg-primary/10 ${
                    isActive ? 'bg-primary/20 text-primary shadow-inner' : 'text-slate-300'
                  }`
                }
                onClick={closeMenu}
                end={item.path === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary hover:text-primary lg:hidden"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? 'Cerrar' : 'Menú'}
          </button>
        </div>
        {isMenuOpen && (
          <div className="border-t border-slate-800/70 bg-slate-950/95 px-4 py-4 sm:px-6 lg:hidden">
            <nav className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 transition-colors hover:bg-primary/10 ${
                      isActive ? 'bg-primary/20 text-primary shadow-inner' : 'text-slate-300'
                    }`
                  }
                  onClick={closeMenu}
                  end={item.path === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>&copy; {new Date().getFullYear()} Tell Tale Reader. Tu biblioteca digital siempre contigo.</p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-slate-700 px-3 py-1">Modo offline disponible</span>
            <span className="rounded-full border border-slate-700 px-3 py-1">Optimizado para móvil y tablet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
