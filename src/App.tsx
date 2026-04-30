import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Pro from "./pages/Pro.tsx";
import Particulier from "./pages/Particulier.tsx";
import Pilotage from "./pages/Pilotage.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import SectorPage from "./pages/SectorPage.tsx";
import TarificationDynamique from "./pages/TarificationDynamique.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./app/AppLayout.tsx";
import AppLogin from "./app/pages/AppLogin.tsx";
import Dashboard from "./app/pages/Dashboard.tsx";
import Previsions from "./app/pages/Previsions.tsx";
import ComingSoon from "./app/pages/ComingSoon.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pro" element={<Pro />} />
          <Route path="/pro/:slug" element={<SectorPage />} />
          <Route path="/particulier" element={<Particulier />} />
          <Route path="/pilotage" element={<Pilotage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/comprendre/tarification-dynamique" element={<TarificationDynamique />} />

          {/* Espace client /app */}
          <Route path="/app/login" element={<AppLogin />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="previsions" element={<Previsions />} />
            <Route path="economies" element={<ComingSoon title="Économies — détails" desc="Suivi détaillé, exports CSV/PDF et bilans mensuels arrivent juste après la démo Tigo." />} />
            <Route path="pilotage" element={<ComingSoon title="Pilotage & modes" desc="Mode Vacances, mode Événement et préférences de confort — prochaine itération." />} />
            <Route path="installation" element={<ComingSoon title="Mon installation Tigo" desc="État de santé batterie, cycles, garantie, maintenance — Phase 2." />} />
            <Route path="faq" element={<ComingSoon title="FAQ Tigo + Dynawatt" desc="30+ articles produits classés par catégorie — Phase 2." />} />
            <Route path="sav" element={<ComingSoon title="Support" desc="Tickets, contact direct, commercial assigné — Phase 2." />} />
            <Route path="parametres" element={<ComingSoon title="Paramètres du compte" desc="Profil, sécurité, RGPD, notifications — Phase 2." />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

