import { NavLink, Outlet } from 'react-router-dom';

function AppLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <NavLink to="/" className="text-xl font-semibold tracking-tight text-primary">
            Tell Tale Reader
          </NavLink>
          <nav className="flex items-center gap-3 text-sm uppercase tracking-wide text-slate-300">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-md px-3 py-1 transition-colors hover:bg-primary/10 ${
                  isActive ? 'bg-primary/20 text-primary' : ''
                }`
              }
              end
            >
              Biblioteca
            </NavLink>
            <NavLink
              to="/details/demo"
              className={({ isActive }) =>
                `rounded-md px-3 py-1 transition-colors hover:bg-primary/10 ${
                  isActive ? 'bg-primary/20 text-primary' : ''
                }`
              }
            >
              Destacados
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `rounded-md px-3 py-1 transition-colors hover:bg-primary/10 ${
                  isActive ? 'bg-primary/20 text-primary' : ''
                }`
              }
            >
              Subir
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-4 pb-12 pt-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
