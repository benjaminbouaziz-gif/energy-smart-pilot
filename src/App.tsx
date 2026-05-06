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
import QuiNestPasConcerne from "./pages/QuiNestPasConcerne.tsx";
import VsSolaire from "./pages/VsSolaire.tsx";
import NotreModele from "./pages/NotreModele.tsx";
import Simulation from "./pages/Simulation.tsx";
import RapportPDF from "./pages/RapportPDF.tsx";
import SimulationDan from "./pages/SimulationDan.tsx";
import Simulateurbis from "./pages/Simulateurbis.tsx";
import BackofficeLayout from "./backoffice/BackofficeLayout.tsx";
import ProspectsList from "./backoffice/pages/ProspectsList.tsx";
import ProspectDetail from "./backoffice/pages/ProspectDetail.tsx";
import Distributeurs from "./backoffice/pages/Distributeurs.tsx";
import BackofficeParametres from "./backoffice/pages/Parametres.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./app/AppLayout.tsx";
import AppLogin from "./app/pages/AppLogin.tsx";
import Dashboard from "./app/pages/Dashboard.tsx";
import Previsions from "./app/pages/Previsions.tsx";
import Economies from "./app/pages/Economies.tsx";
import PilotageApp from "./app/pages/PilotageApp.tsx";
import Installation from "./app/pages/Installation.tsx";
import Faq from "./app/pages/Faq.tsx";
import Sav from "./app/pages/Sav.tsx";
import Parametres from "./app/pages/Parametres.tsx";

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
          <Route path="/comprendre/qui-n-est-pas-concerne" element={<QuiNestPasConcerne />} />
          <Route path="/comprendre/vs-solaire" element={<VsSolaire />} />
          <Route path="/notre-modele" element={<NotreModele />} />
          <Route path="/comment-ca-marche" element={<NotreModele />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/Simulation" element={<Simulation />} />
          <Route path="/rapport-pdf" element={<RapportPDF />} />

          {/* Simulateur interne */}
          <Route path="/simulationdan" element={<SimulationDan />} />
          <Route path="/simulationdan/:prospect_id" element={<SimulationDan />} />

          {/* BackOffice interne */}
          <Route path="/backoffdan" element={<BackofficeLayout />}>
            <Route index element={<ProspectsList />} />
            <Route path="prospect/:id" element={<ProspectDetail />} />
            <Route path="distributeurs" element={<Distributeurs />} />
            <Route path="parametres" element={<BackofficeParametres />} />
          </Route>

          {/* Espace client /app */}
          <Route path="/app/login" element={<AppLogin />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="previsions" element={<Previsions />} />
            <Route path="economies" element={<Economies />} />
            <Route path="pilotage" element={<PilotageApp />} />
            <Route path="installation" element={<Installation />} />
            <Route path="faq" element={<Faq />} />
            <Route path="sav" element={<Sav />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

