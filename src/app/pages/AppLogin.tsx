import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Lock, Mail } from "lucide-react";

export default function AppLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Espace client — Dynawatt";
  }, []);

  const enterDemo = () => {
    setLoading(true);
    sessionStorage.setItem("dynawatt-demo", "1");
    setTimeout(() => navigate("/app"), 600);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-50"
        style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(262 83% 58% / 0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, hsl(43 96% 56% / 0.18), transparent 55%)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md glass rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-3xl font-black text-center mb-2">
          Espace <span className="text-gradient-violet">client</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground text-center mb-8">
          Suivi temps réel de votre installation et de vos économies.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="vous@entreprise.fr" className="pl-9 h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-9 h-11" />
            </div>
          </div>
          <button className="text-xs text-primary-light hover:underline">Mot de passe oublié ?</button>
        </motion.div>

        <Button disabled className="w-full h-11 mb-3 opacity-60 cursor-not-allowed">
          Se connecter
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
          <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="px-3 bg-background">Démo Tigo</span>
          </div>
        </div>

        <Button onClick={enterDemo} disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-gold to-gold-warm text-background font-bold glow-gold hover:opacity-90">
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? "Connexion…" : "Entrer en mode démo"}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Démo : Hotel America Opera — Config Tri 15 kW + 29 kWh
        </p>
      </motion.div>

      <div className="absolute bottom-4 inset-x-0 text-center text-[10px] text-muted-foreground">
        © Dynawatt — Mentions légales · RGPD
      </div>
    </main>
  );
}
