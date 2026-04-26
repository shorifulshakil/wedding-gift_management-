import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { Heart, Users, Wallet, Gift, Sparkles, ArrowRight, ShieldCheck, Download } from "lucide-react";
import heroImg from "@/assets/wedding-hero.jpg";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Colorful wedding gifts and floral bouquets"
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-accent/75 to-gold/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--gold)/0.4),transparent_50%),radial-gradient(circle_at_80%_80%,hsl(var(--teal)/0.4),transparent_50%)]" />
        </div>

        {/* Floating decorative blobs */}
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-gold/40 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-teal/40 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 right-1/4 h-24 w-24 rounded-full bg-accent/40 blur-2xl animate-float" style={{ animationDelay: "4s" }} />

        <div className="relative container mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs mb-8 animate-fade-in shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-gold" fill="currentColor" />
            <span className="font-medium tracking-wide uppercase">For Wedding Hosts</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-6 leading-[1.05] animate-fade-in font-bold [text-shadow:0_4px_24px_rgba(0,0,0,0.45)]">
            <span className="text-white">Track Every Gift,</span><br />
            <span className="bg-gradient-to-r from-gold via-gold-foreground to-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
              Cherish Every Guest
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed">
            A beautiful, private way to record cash and gift contributions from your wedding guests — and thank them with grace. ✨
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-scale-in">
            {user ? (
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow text-base px-8 py-6 rounded-full font-semibold">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow text-base px-8 py-6 rounded-full font-semibold">
                  <Link to="/auth?mode=signup">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20 hover:text-white text-base px-8 py-6 rounded-full font-semibold">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: "100%", label: "Private" },
              { value: "৳", label: "Taka Ready" },
              { value: "∞", label: "Guests" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-4">
                <div className="text-3xl font-bold text-white drop-shadow">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-white/80 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">What you can do</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Everything you need, <span className="bg-gradient-warm bg-clip-text text-transparent">nothing you don't</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Guest Entries",
              desc: "Add each guest with their name, address and contribution — all in one elegant place.",
              gradient: "from-primary to-accent",
            },
            {
              icon: Wallet,
              title: "Auto Totals",
              desc: "Watch your total cash received update in real-time, beautifully displayed in Taka (৳).",
              gradient: "from-accent to-gold",
            },
            {
              icon: Gift,
              title: "Gift List",
              desc: "Keep a clear, organized list of physical gifts with rich descriptions.",
              gradient: "from-gold to-teal",
            },
          ].map(({ icon: Icon, title, desc, gradient }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border bg-card p-7 hover:shadow-soft transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-soft`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-2xl mb-2 font-bold">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECONDARY FEATURES */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-3xl bg-gradient-soft p-8 md:p-14 border border-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Built with <span className="text-accent">love</span>, secured with care
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Your guest list is yours alone. Private by design, exportable anytime, and as joyful as the day itself.
              </p>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: "Row-level security — only you see your data" },
                  { icon: Download, text: "Export your full list to CSV in one click" },
                  { icon: Heart, text: "Made for the most special day of your life" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-warm flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Received</p>
                    <p className="font-display text-4xl font-bold text-primary">৳ 1,25,000</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "Aarav Khan", amount: "৳ 5,000", color: "bg-primary" },
                    { name: "Priya Sharma", amount: "Saree", color: "bg-accent" },
                    { name: "Rahim Ali", amount: "৳ 10,000", color: "bg-gold" },
                  ].map((g) => (
                    <div key={g.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full ${g.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {g.name[0]}
                        </div>
                        <span className="text-sm font-medium">{g.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{g.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
