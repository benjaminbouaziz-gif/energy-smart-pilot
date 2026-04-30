import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <nav className="container mx-auto flex items-center justify-between h-16 px-4">
        <Logo />
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/pro" className="hover:text-primary-light transition-colors">Pro</Link>
          <Link to="/particulier" className="hover:text-primary-light transition-colors">Particuliers</Link>
          <Link to="/pilotage" className="hover:text-primary-light transition-colors">Pilotage</Link>
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary-light transition-colors">
              Comprendre <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="glass rounded-2xl py-2 min-w-[260px] shadow-xl">
                <Link to="/comprendre/tarification-dynamique" className="block px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary-light transition-colors">
                  Tarification dynamique
                </Link>
                <Link to="/contact#faq" className="block px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary-light transition-colors">
                  FAQ générale
                </Link>
              </div>
            </div>
          </div>
          <Link to="/about" className="hover:text-primary-light transition-colors">À propos</Link>
          <Link to="/contact" className="hover:text-primary-light transition-colors">Contact</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="border border-border/60 hover:border-primary/50 hover:text-primary-light">
            <Link to="/app/login">Espace client</Link>
          </Button>
          <Button asChild variant="default" className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground hover:opacity-90 font-semibold shadow-[0_8px_30px_-8px_hsl(43_96%_56%_/_0.5)]">
            <Link to="/particulier">Calculer mes économies</Link>
          </Button>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-3">
          <Link to="/pro" onClick={() => setOpen(false)}>Pro</Link>
          <Link to="/particulier" onClick={() => setOpen(false)}>Particuliers</Link>
          <Link to="/pilotage" onClick={() => setOpen(false)}>Pilotage</Link>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">Comprendre</div>
          <Link to="/comprendre/tarification-dynamique" className="pl-3 text-sm" onClick={() => setOpen(false)}>Tarification dynamique</Link>
          <Link to="/about" onClick={() => setOpen(false)}>À propos</Link>
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/app/login" onClick={() => setOpen(false)}>Espace client</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground">
            <Link to="/particulier" onClick={() => setOpen(false)}>Calculer mes économies</Link>
          </Button>
        </div>
      )}
    </header>
  );
};
