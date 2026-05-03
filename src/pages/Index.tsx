import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PragmaticPositioning } from "@/components/PragmaticPositioning";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyDynawatt } from "@/components/WhyDynawatt";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { Comparison } from "@/components/Comparison";
import { BrokerExplainer } from "@/components/BrokerExplainer";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Dynawatt — Le pilotage qui dynamite votre facture";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Pros : batterie Tigo + contrat dynamique + pilotage J-1. Jusqu'à 33% d'économies sur votre facture, sans intermédiaire qui marge.");
    document.head.appendChild(meta);
  }, []);

  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <PragmaticPositioning />
      <HowItWorks />
      <WhyDynawatt />
      <Stats />
      <Testimonials />
      <BrokerExplainer />
      <Comparison />
      <FinalCta />
      <Footer />
    </main>
  );
};

export default Index;
