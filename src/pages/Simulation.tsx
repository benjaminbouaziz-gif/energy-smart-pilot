import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Simulation() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-3">
            Espace de travail
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Simulation</h1>
          <p className="text-muted-foreground">
            Page en construction — non accessible depuis la navigation.
          </p>
        </header>

        <section className="max-w-4xl mx-auto glass rounded-3xl p-10">
          <p className="text-sm text-muted-foreground text-center">
            Le contenu de la simulation sera ajouté ici prochainement.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
