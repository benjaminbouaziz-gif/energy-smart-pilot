import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, MessageCircle, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  firstName: z.string().trim().min(1, "Requis").max(80),
  lastName: z.string().trim().min(1, "Requis").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8, "Numéro invalide").max(25),
  profile: z.string().min(1),
  message: z.string().trim().min(10, "Min. 10 caractères").max(2000),
});

type FormData = z.infer<typeof schema>;

const ContactPage = () => {
  useEffect(() => {
    document.title = "Contact — Dynawatt | Parlons de votre projet";
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { profile: "pro" } as Partial<FormData> as FormData,
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        type: data.profile,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        notes: data.message,
        source: "contact_form",
      });
      if (error) throw error;
      setDone(true);
      toast.success("Message envoyé — réponse sous 24h");
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <Navbar />

      <section className="pt-32 pb-12 md:pt-40">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <MessageCircle className="w-3 h-3 text-gold" />Parlons-en
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            Une question ?<br /><span className="text-gradient-gold">Une réponse</span> sous 24h.
          </h1>
          <p className="text-lg text-muted-foreground">Particulier, pro, partenaire installateur — on répond à tout le monde.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coordinates */}
            <div className="space-y-4 lg:col-span-1">
              {[
                { icon: Mail, label: "Email", value: "contact@dynawatt.fr" },
                { icon: Phone, label: "Téléphone", value: "+33 1 23 45 67 89" },
                { icon: MapPin, label: "Adresse", value: "Paris, France" },
              ].map((c) => (
                <div key={c.label} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <c.icon className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  </div>
                  <div className="font-mono text-sm pl-12">{c.value}</div>
                </div>
              ))}
              <div className="glass rounded-2xl p-5 border-gold/30">
                <div className="text-xs font-mono uppercase tracking-wider text-gold mb-2">Horaires</div>
                <div className="text-sm text-muted-foreground">Lun-Ven : 9h-19h<br />Sam : 10h-17h</div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="glass rounded-3xl p-6 md:p-10">
                {done ? (
                  <div className="text-center py-10">
                    <div className="inline-flex w-16 h-16 rounded-full bg-gold/20 border border-gold/40 items-center justify-center mb-6">
                      <CheckCircle2 className="w-8 h-8 text-gold" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message reçu</h3>
                    <p className="text-muted-foreground">Notre équipe vous recontacte sous 24h.</p>
                  </div>
                ) : (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Prénom</Label><Input {...form.register("firstName")} className="mt-1.5 h-11 bg-input/50 border-primary/20" />{form.formState.errors.firstName && <p className="text-destructive text-xs mt-1">{form.formState.errors.firstName.message}</p>}</div>
                      <div><Label>Nom</Label><Input {...form.register("lastName")} className="mt-1.5 h-11 bg-input/50 border-primary/20" />{form.formState.errors.lastName && <p className="text-destructive text-xs mt-1">{form.formState.errors.lastName.message}</p>}</div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Email</Label><Input type="email" {...form.register("email")} className="mt-1.5 h-11 bg-input/50 border-primary/20" />{form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}</div>
                      <div><Label>Téléphone</Label><Input {...form.register("phone")} className="mt-1.5 h-11 bg-input/50 border-primary/20" />{form.formState.errors.phone && <p className="text-destructive text-xs mt-1">{form.formState.errors.phone.message}</p>}</div>
                    </div>
                    <div>
                      <Label>Vous êtes</Label>
                      <Select value={form.watch("profile")} onValueChange={(v) => form.setValue("profile", v, { shouldValidate: true })}>
                        <SelectTrigger className="mt-1.5 h-11 bg-input/50 border-primary/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pro">Professionnel</SelectItem>
                          <SelectItem value="particulier">Particulier</SelectItem>
                          <SelectItem value="partenaire">Partenaire installateur</SelectItem>
                          <SelectItem value="presse">Presse / autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Votre message</Label>
                      <Textarea rows={5} {...form.register("message")} className="mt-1.5 bg-input/50 border-primary/20" placeholder="Décrivez votre projet, vos questions…" />
                      {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-bold h-12">
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : <>Envoyer le message<ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ContactPage;
