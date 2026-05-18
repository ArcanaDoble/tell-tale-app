import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';

const navItems = [
  { to: '/', label: 'Biblioteca', icon: 'library' as const, end: true },
  { to: '/details/demo', label: 'Destacados', icon: 'book' as const },
  { to: '/upload', label: 'Subir', icon: 'upload' as const }
];

function AppLayout(): JSX.Element {
  const location = useLocation();
  const isReaderRoute = location.pathname.startsWith('/read/');

  return (
    <div className={isReaderRoute ? 'min-h-screen bg-reader-night text-paper' : 'min-h-screen text-ink'}>
      {!isReaderRoute ? (
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper-soft/92 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
            <NavLink to="/" className="flex min-w-0 items-center gap-3 text-ink">
              <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-primary text-paper shadow-[4px_4px_0_var(--ink)]">
                <Icon name="book" className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-lg font-black leading-tight">Tell Tale Reader</span>
                <span className="hidden text-xs font-semibold uppercase text-ink-soft/70 sm:block">
                  Manga, libros y archivos
                </span>
              </span>
            </NavLink>
            <nav className="hidden items-center gap-2 text-sm font-bold md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex h-10 items-center gap-2 border px-4 transition ${
                      isActive
                        ? 'border-ink bg-ink text-paper shadow-[3px_3px_0_var(--primary)]'
                        : 'border-ink/15 bg-paper-soft text-ink hover:border-ink/40'
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
      ) : null}
      <main
        className={
          isReaderRoute
            ? 'flex min-h-screen flex-col'
            : 'mx-auto flex max-w-7xl flex-1 flex-col px-4 pb-24 pt-6 sm:pt-8 md:px-8 md:pb-12'
        }
      >
        <Outlet />
      </main>
      {!isReaderRoute ? (
        <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 border-2 border-ink bg-paper-soft p-1 shadow-[5px_5px_0_rgba(22,19,18,0.35)] md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
            className={({ isActive }) =>
                `flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-[0.68rem] font-black uppercase ${
                  isActive ? 'bg-primary text-paper' : 'text-ink'
                }`
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export default AppLayout;
