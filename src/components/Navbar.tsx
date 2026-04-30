import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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
          <Link to="/about" className="hover:text-primary-light transition-colors">À propos</Link>
          <Link to="/contact" className="hover:text-primary-light transition-colors">Contact</Link>
        </div>
        <div className="hidden md:block">
          <Button asChild variant="default" className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-semibold shadow-[0_8px_30px_-8px_hsl(43_96%_56%_/_0.5)]">
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
          <Link to="/about" onClick={() => setOpen(false)}>À propos</Link>
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Button asChild className="bg-gradient-to-r from-gold to-gold-warm text-background mt-2">
            <Link to="/particulier" onClick={() => setOpen(false)}>Calculer mes économies</Link>
          </Button>
        </div>
      )}
    </header>
  );
};
