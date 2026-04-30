import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
    <div className="relative w-9 h-9 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-gold opacity-80 blur-md group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-light via-primary to-gold" />
      <Zap className="relative w-5 h-5 text-background" fill="currentColor" strokeWidth={2.5} />
    </div>
    <span className="font-display font-black text-xl tracking-tight text-foreground">
      DYNA<span className="text-gradient-gold">WATT</span>
    </span>
  </Link>
);
