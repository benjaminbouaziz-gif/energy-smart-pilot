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
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/pro" className="hover:text-primary-light transition-colors">Professionnels</Link>
          <Link to="/particulier" className="hover:text-primary-light transition-colors">Particuliers</Link>
          <a href="#comment" className="hover:text-primary-light transition-colors">Comment ça marche</a>
          <a href="#temoignages" className="hover:text-primary-light transition-colors">Témoignages</a>
        </div>
        <div className="hidden md:block">
          <Button asChild variant="default" className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-semibold shadow-[0_8px_30px_-8px_hsl(43_96%_56%_/_0.5)]">
            <a href="#simulation">Calculer mes économies</a>
          </Button>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-3">
          <Link to="/pro" onClick={() => setOpen(false)}>Professionnels</Link>
          <Link to="/particulier" onClick={() => setOpen(false)}>Particuliers</Link>
          <a href="#comment" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a href="#temoignages" onClick={() => setOpen(false)}>Témoignages</a>
          <Button asChild className="bg-gradient-to-r from-gold to-gold-warm text-background mt-2">
            <a href="#simulation" onClick={() => setOpen(false)}>Calculer mes économies</a>
          </Button>
        </div>
      )}
    </header>
  );
};
