import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Bell, Plus, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Feed" },
  { to: "/categories", label: "Categories" },
  { to: "/analytics", label: "Analytics" },
  { to: "/admin", label: "Admin" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-brand-line bg-brand-paper/85 backdrop-blur" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 group" data-testid="brand-logo-link">
            <div className="w-7 h-7 bg-brand-ink flex items-center justify-center">
              <span className="font-serif text-brand-paper text-lg leading-none italic">C</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl text-brand-ink tracking-tight">CrowdSource</span>
              <span className="label-eyebrow text-[9px]" style={{ letterSpacing: '0.3em' }}>FAQ / EST. 2026</span>
            </div>
          </Link>

          <form onSubmit={onSubmit} className="hidden md:flex flex-1 max-w-xl" data-testid="navbar-search-form">
            <div className="flex w-full border border-brand-line bg-white hover-shift">
              <div className="pl-4 pr-2 flex items-center text-brand-mute">
                <Search size={16} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                placeholder="Search the knowledge base..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 bg-transparent text-sm py-3 outline-none placeholder:text-brand-mute"
                data-testid="navbar-search-input"
              />
              <kbd className="hidden lg:flex items-center px-3 text-[10px] uppercase tracking-widest text-brand-mute border-l border-brand-line">⌘K</kbd>
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm tracking-wide transition-colors ${isActive ? 'text-brand-ink font-semibold' : 'text-brand-body hover:text-brand-ink'}`
                }
                data-testid={`nav-link-${l.label.toLowerCase()}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/notifications" className="hidden sm:flex relative items-center justify-center w-10 h-10 border border-brand-line hover:border-brand-ink transition-colors" data-testid="nav-notifications-btn">
              <Bell size={16} strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-vermilion text-white text-[9px] font-bold flex items-center justify-center">3</span>
            </Link>
            <Link to="/ask" className="hidden sm:inline-flex items-center gap-2 bg-brand-ink text-brand-paper px-4 py-2.5 text-sm tracking-wide hover:bg-brand-blue transition-colors" data-testid="nav-ask-btn">
              <Plus size={14} strokeWidth={2} />
              Ask
            </Link>
            <Link to="/login" className="hidden sm:inline-flex items-center text-sm text-brand-body hover:text-brand-ink px-3 py-2" data-testid="nav-login-link">
              Sign in
            </Link>
            <button onClick={() => setOpen(!open)} className="lg:hidden w-10 h-10 border border-brand-line flex items-center justify-center" data-testid="mobile-menu-toggle">
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-brand-line py-4 space-y-2" data-testid="mobile-menu">
            <form onSubmit={onSubmit} className="md:hidden flex border border-brand-line mb-3">
              <div className="pl-4 pr-2 flex items-center text-brand-mute"><Search size={16} /></div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent py-3 text-sm outline-none" data-testid="mobile-search-input" />
            </form>
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className="block py-2 text-base">
                {l.label}
              </NavLink>
            ))}
            <Link to="/ask" onClick={() => setOpen(false)} className="block bg-brand-ink text-brand-paper text-center py-3 mt-3">Ask a question</Link>
            <Link to="/login" onClick={() => setOpen(false)} className="block text-center py-2">Sign in</Link>
          </div>
        )}
      </div>
    </header>
  );
};
