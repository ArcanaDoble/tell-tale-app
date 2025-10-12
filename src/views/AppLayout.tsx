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
    <div className="relative min-h-screen bg-[#030712] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,63,211,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,122,89,0.18),_transparent_40%),radial-gradient(circle_at_center,_rgba(15,118,110,0.18),_transparent_45%)]" />
        <div className="absolute inset-0 bg-grid-light bg-[size:64px_64px] opacity-20" />
      </div>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <NavLink
            to="/"
            className="relative flex items-center gap-3 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary/60 hover:bg-primary/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-lg text-primary shadow-glow">
              📚
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.25em] text-primary/80">Tell Tale</span>
              <span className="text-base font-semibold">Reader</span>
            </span>
          </NavLink>
          <nav className="hidden items-center gap-2 text-sm font-medium text-slate-300 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-all duration-200 hover:bg-primary/10 ${
                    isActive ? 'bg-primary/20 text-primary shadow-glow' : 'text-slate-300'
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
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary/60 hover:bg-primary/10 lg:hidden"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? 'Cerrar' : 'Menú'}
          </button>
        </div>
        <div className="mx-auto hidden w-full max-w-6xl px-4 pb-4 text-xs text-slate-400 sm:px-6 lg:px-10 lg:block">
          <p className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.04] px-4 py-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Sincroniza tus lecturas desde cualquier dispositivo. Modo oscuro permanente y optimización móvil.
          </p>
        </div>
        {isMenuOpen && (
          <div id="mobile-menu" className="border-t border-white/10 bg-surface/95 px-4 pb-6 pt-4 shadow-2xl shadow-primary/10 sm:px-6 lg:hidden">
            <nav className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-2xl border px-4 py-3 transition-colors duration-200 ${
                      isActive ? 'border-primary/70 bg-primary/10 text-primary' : 'border-white/5 bg-white/[0.03] hover:border-primary/50'
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-10 lg:pb-16">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 bg-surface/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p className="flex items-center gap-2 text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
            &copy; {new Date().getFullYear()} Tell Tale Reader. Tu biblioteca digital siempre contigo.
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wide">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Modo offline disponible</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Optimizado para móvil y tablet</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Sincronización en la nube</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
