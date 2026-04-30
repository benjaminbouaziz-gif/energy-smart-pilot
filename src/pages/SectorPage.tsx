import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectorLoadCurve } from "@/components/SectorLoadCurve";
import { getSector, SECTORS } from "@/lib/sectors";
import { ArrowRight, MessageCircle, Zap, CheckCircle2, Package, Quote } from "lucide-react";

const SectorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const sector = slug ? getSector(slug) : undefined;

  useEffect(() => {
    if (!sector) return;
    document.title = sector.seo.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", sector.seo.description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/pro/${sector.slug}`);
  }, [sector]);

  if (!sector) return <Navigate to="/pro" replace />;

  const Icon = sector.icon;

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 relative">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
              <Icon className="w-3 h-3 text-accent" />Solution {sector.name}
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              {sector.hero.title}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8">
              {sector.hero.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground font-bold h-14 px-8 glow-gold">
                <a href="#cta">Calculer mes économies<ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-6">
                <Link to="/contact">Parler à un expert {sector.name.toLowerCase()}</Link>
              </Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <SectorLoadCurve curve={sector.loadCurve} annotations={sector.annotations} />
          </motion.div>
        </div>
      </section>

      {/* Profil énergétique */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">Votre profil énergétique</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Conso annuelle", value: sector.profile.annualKwh },
              { label: "Puissance souscrite", value: sector.profile.power },
              { label: "Horaires", value: sector.profile.schedule },
              { label: "Charges principales", value: sector.profile.mainLoads },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-5">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{p.label}</div>
                <div className="font-medium">{p.value}</div>
              </motion.div>
            ))}
          </div>
          {sector.profile.extra && (
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30 text-center text-sm">
              <Zap className="inline w-4 h-4 text-primary-light mr-2" />{sector.profile.extra}
            </div>
          )}
        </div>
      </section>

      {/* Leviers */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs font-mono text-accent uppercase tracking-widest text-center mb-3">3 leviers</div>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">Comment Dynawatt agit chez vous</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {sector.levers.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-accent/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-warm flex items-center justify-center font-mono font-black text-accent-foreground mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold mb-2">{l.title}</h3>
                <p className="text-sm text-muted-foreground">{l.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas client */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">
                  {sector.caseStudy.realClient ? "Cas client réel" : "Cas type"}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">{sector.caseStudy.name}</h2>
              <p className="text-muted-foreground mb-8">{sector.caseStudy.description}</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sector.caseStudy.metrics.map((m, i) => (
                  <div key={i} className={`rounded-2xl p-4 ${m.highlight ? "bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30" : "bg-card/50 border border-border"}`}>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className={`font-mono text-2xl font-black mt-1 ${m.highlight ? "text-gradient-gold" : ""}`}>{m.value}</div>
                    {m.unit && <div className="text-xs text-muted-foreground font-mono">{m.unit}</div>}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-3">
                <Quote className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm">{sector.caseStudy.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-xs font-mono text-primary-light uppercase tracking-widest text-center mb-3">Configuration recommandée</div>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-8">Le pack Tigo adapté</h2>
          <div className="glass rounded-3xl p-8 text-center">
            <Package className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2">{sector.config.name}</h3>
            <p className="text-muted-foreground mb-4">{sector.config.details}</p>
            <div className="font-mono text-xl text-gradient-gold font-bold">{sector.config.price}</div>
          </div>
        </div>
      </section>

      {/* Extra (copro) */}
      {sector.extraSection && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="glass rounded-3xl p-8 md:p-10 border-primary/30">
              <h2 className="text-2xl md:text-3xl font-black mb-6">{sector.extraSection.title}</h2>
              <ul className="space-y-3">
                {sector.extraSection.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="cta" className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Calculer mes économies pour <span className="text-gradient-gold">{sector.name.toLowerCase()}</span></h2>
          <p className="text-muted-foreground mb-8">3 minutes. Gratuit. Sans engagement.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground font-bold h-14 px-8 glow-gold">
              <Link to="/pro#simulation">Lancer la simulation<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-6">
              <Link to="/contact"><MessageCircle className="mr-2 h-4 w-4" />Parler à un expert</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="glass rounded-2xl px-6">
            {sector.faq.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Autres secteurs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-center text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">Autres activités</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SECTORS.filter((s) => s.slug !== sector.slug).map((s) => {
              const I = s.icon;
              return (
                <Link key={s.slug} to={`/pro/${s.slug}`}
                  className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:border-accent/40 transition-all">
                  <I className="w-4 h-4 text-primary-light" />{s.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default SectorPage;
