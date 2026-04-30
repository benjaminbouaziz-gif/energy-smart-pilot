import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, Sparkles, Sliders, Wrench, BookOpen, MessageSquare, Settings, LogOut, Menu, MoreHorizontal, Bell } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { demoClient } from "@/app/mock/client";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/app", label: "Tableau de bord", icon: Home, end: true },
  { to: "/app/economies", label: "Économies", icon: BarChart3 },
  { to: "/app/previsions", label: "Prévisions", icon: Sparkles },
  { to: "/app/pilotage", label: "Pilotage", icon: Sliders },
  { to: "/app/installation", label: "Mon installation", icon: Wrench },
  { to: "/app/faq", label: "FAQ", icon: BookOpen },
  { to: "/app/sav", label: "Support", icon: MessageSquare },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];

const MOBILE_PRIMARY = NAV.slice(0, 3);

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    // Garde de session démo : si pas d'entrée démo, on renvoie sur le login
    const ok = sessionStorage.getItem("dynawatt-demo") === "1";
    if (!ok && pathname !== "/app/login") navigate("/app/login", { replace: true });
  }, [pathname, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("dynawatt-demo");
    navigate("/app/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/50 glass sticky top-0 h-screen z-30">
        <div className="px-5 py-5 border-b border-border/40">
          <Logo />
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-gold">Espace client</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary-light border border-primary/30"
                    : "text-foreground/70 hover:text-foreground hover:bg-primary/5"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border/40 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-sm font-bold">
              {demoClient.firstName[0]}
              {demoClient.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{demoClient.firstName} {demoClient.lastName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{demoClient.companyName}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors" aria-label="Déconnexion">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/40 flex items-center justify-between px-4 h-14">
          <Logo />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-primary/10" aria-label="Notifications"><Bell className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xs font-bold">
              {demoClient.firstName[0]}{demoClient.lastName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/90 border-t border-border/40">
          <div className="grid grid-cols-4 h-16">
            {MOBILE_PRIMARY.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? "text-primary-light" : "text-muted-foreground"}`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label.split(" ")[0]}
              </NavLink>
            ))}
            <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
              <MoreHorizontal className="w-5 h-5" />
              Plus
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {moreOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-xl" onClick={() => setMoreOpen(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 inset-x-0 glass rounded-t-3xl p-4 pb-8 space-y-1">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
                {NAV.slice(3).map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isActive ? "bg-primary/15 text-primary-light" : "hover:bg-primary/5"}`}>
                    <item.icon className="w-4 h-4" />{item.label}
                  </NavLink>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />Déconnexion
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
