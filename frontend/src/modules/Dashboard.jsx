import { useEffect, useState } from "react";
import { Section, Stat, Panel, Pill, prioTone } from "@/lib/ui";
import { useCollection } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Flame, Wallet, Dumbbell, Zap, ArrowRight } from "lucide-react";

const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export default function Dashboard({ go }) {
  const [tasks] = useCollection("tasks");
  const [habits] = useCollection("habits");
  const [finance] = useCollection("finance");
  const [alerts] = useCollection("alerts");
  const [projects] = useCollection("projects");
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = tasks.filter((t) => t.status !== "done" && t.due === today).length;
  const habitPct = habits.length ? Math.round((habits.filter((h) => h.log?.[today]).length / habits.length) * 100) : 0;
  const balance = finance.reduce((s, f) => s + (f.type === "przychód" ? 1 : -1) * Number(f.amount || 0), 0);
  const cet = now.toLocaleTimeString("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const shortcuts = [
    ["tasks", "Zadania"], ["habits", "Nawyki"], ["finance", "Finanse"], ["trading", "Trading"],
    ["training", "Trening"], ["nutrition", "Żywienie"], ["music", "ERROR444"], ["workshop", "Warsztat"],
    ["notes", "Baza wiedzy"], ["reports", "Raporty"], ["schedule", "Harmonogram"], ["settings", "Ustawienia"],
  ];

  return (
    <Section title="Panel Główny" desc="Centrum dowodzenia — wszystko w jednym miejscu" testid="module-dashboard">
      <Panel accent="emerald" className="mb-5 relative overflow-hidden grid-bg">
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mono">{DAYS[now.getDay()]}</p>
          <p className="font-display text-4xl sm:text-5xl font-extrabold mt-1 mono" data-testid="dashboard-clock">{cet} <span className="text-base text-muted-foreground">CET</span></p>
          <p className="text-sm text-muted-foreground mt-1">{now.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat testid="kpi-tasks" label="Zadania dziś" value={dueToday} icon={CheckSquare} />
        <Stat testid="kpi-habits" label="Nawyki" value={`${habitPct}%`} accent="cyan" icon={Flame} />
        <Stat testid="kpi-balance" label="Bilans" value={`${balance} zł`} accent={balance >= 0 ? "primary" : "cyan"} sub="wszystkie wpisy" icon={Wallet} />
        <Stat testid="kpi-training" label="Trening" value={DAYS[now.getDay()] === "Środa" || DAYS[now.getDay()] === "Niedziela" ? "Rest" : "ON"} icon={Dumbbell} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Panel accent="cyan">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-[hsl(var(--cyan))]" /> Alerty tradingowe</h3>
            <button onClick={() => go("trading")} className="text-xs text-[hsl(var(--cyan))] hover:underline">Zobacz wszystkie</button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border border-border/60 rounded-lg px-3 py-2">
                <span className="mono font-medium">{a.symbol} <span className="text-muted-foreground">· {a.tf}</span></span>
                <span className="text-muted-foreground">{a.type}</span>
                <Pill tone={a.status === "active" ? "emerald" : "amber"}>{a.status}</Pill>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">Brak alertów</p>}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display font-semibold mb-3">Aktywne projekty</h3>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1"><span>{p.name}</span><span className="text-muted-foreground mono">{p.progress}%</span></div>
                <Progress value={p.progress} className="h-2" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-display font-semibold mb-3">Skróty do modułów</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {shortcuts.map(([k, label]) => (
            <Button key={k} variant="outline" data-testid={`shortcut-${k}`} onClick={() => go(k)}
              className="justify-between rounded-xl border-border/70 hover:border-primary hover:text-primary">
              {label} <ArrowRight className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </Panel>
    </Section>
  );
}
