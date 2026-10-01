import { Card } from "@/components/ui/card";

export const Section = ({ title, desc, right, children, testid }) => (
  <section data-testid={testid} className="animate-fadeUp">
    <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const Panel = ({ className = "", children, accent, ...rest }) => (
  <Card
    className={`bg-card border-border/70 rounded-2xl p-4 ${accent === "emerald" ? "glow-emerald" : accent === "cyan" ? "glow-cyan" : ""} ${className}`}
    {...rest}
  >
    {children}
  </Card>
);

export const Stat = ({ label, value, sub, accent = "primary", icon: Icon, testid }) => (
  <Panel data-testid={testid} className="relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`font-display text-3xl font-bold mt-1 ${accent === "cyan" ? "text-[hsl(var(--cyan))]" : accent === "primary" ? "text-primary" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {Icon && <Icon className={`w-5 h-5 ${accent === "cyan" ? "text-[hsl(var(--cyan))]" : "text-primary"}`} />}
    </div>
  </Panel>
);

export const Pill = ({ children, tone = "muted" }) => {
  const tones = {
    muted: "bg-secondary text-secondary-foreground",
    emerald: "bg-primary/15 text-primary",
    cyan: "bg-[hsl(var(--cyan))]/15 text-[hsl(var(--cyan))]",
    red: "bg-destructive/15 text-destructive",
    amber: "bg-amber-500/15 text-amber-400",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
};

export const prioTone = (p) => (p === "P1" ? "red" : p === "P2" ? "amber" : "cyan");
