import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";

const tabs = [
  { to: "/backoffdan", label: "Prospects", end: true },
  { to: "/backoffdan/distributeurs", label: "Distributeurs" },
  { to: "/backoffdan/parametres", label: "Paramètres" },
];

export default function BackofficeLayout() {
  const location = useLocation();
  // Hide tabs on detail page
  const isDetail = /^\/backoffdan\/prospect\//.test(location.pathname);

  return (
    <div className="simulator-light min-h-screen bg-[#F5F3FF] text-foreground">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg leading-none">BackOffice Dynawatt</h1>
              <p className="text-xs text-muted-foreground">Gestion commerciale interne</p>
            </div>
          </div>
          {!isDetail && (
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end as any}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
          )}
          {isDetail && (
            <Link
              to="/backoffdan"
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Retour à la liste
            </Link>
          )}
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
