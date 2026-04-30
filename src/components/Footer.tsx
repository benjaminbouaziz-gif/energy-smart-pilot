import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-border/50 mt-24 relative z-10">
    <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
      <div className="md:col-span-2">
        <Logo />
        <p className="mt-4 text-muted-foreground text-sm max-w-sm">
          Le pilotage qui dynamite votre facture. Batteries Tigo, contrat dynamique et algorithme propriétaire J-1.
        </p>
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono px-2 py-1 rounded border border-border/60">Tigo Energy (TYGO)</span>
          <span className="font-mono px-2 py-1 rounded border border-border/60">Sobry</span>
        </div>
      </div>
      <div>
        <h4 className="font-bold text-sm mb-3">Solutions</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="/pro" className="hover:text-foreground">Professionnels</a></li>
          <li><a href="/particulier" className="hover:text-foreground">Particuliers</a></li>
          <li><a href="#" className="hover:text-foreground">Pilotage Premium</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-sm mb-3">Société</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="hover:text-foreground">À propos</a></li>
          <li><a href="#" className="hover:text-foreground">Contact</a></li>
          <li><a href="#" className="hover:text-foreground">Mentions légales</a></li>
          <li><a href="#" className="hover:text-foreground">RGPD</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Dynawatt. Tous droits réservés.
    </div>
  </footer>
);
