import { BarChart3, Code2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-panel/90 px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-accent text-ink">
            <Code2 size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">AI Code</p>
            <h1 className="text-lg font-semibold">Reviewer</h1>
          </div>
        </div>
        <nav className="space-y-2">
          <NavItem to="/" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/reviewer" icon={<Code2 size={18} />} label="Reviewer" />
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-ink/85 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Automated Review</p>
            <p className="font-medium">Demo Workspace</p>
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded px-3 text-sm transition ${isActive ? 'bg-accent text-ink' : 'text-slate-300 hover:bg-white/5'}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
