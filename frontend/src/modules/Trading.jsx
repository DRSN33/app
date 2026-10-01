import { Section, Panel, Stat, Pill } from "@/lib/ui";
import { useCollection, uid, todayISO, TRADE_CHECKLIST } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function Trading() {
  const [trades, save] = useCollection("trades");
  const [alerts] = useCollection("alerts");
  const [checks, setChecks] = useState({});
  const [t, setT] = useState({ pair: "", setup: "", rr: "", sl: "", tp: "", result: "", discipline: "" });
  // kalkulator
  const [calc, setCalc] = useState({ capital: 1000, risk: 1, entry: "", sl: "" });

  const add = () => {
    if (!t.pair) return;
    save([{ id: uid(), date: todayISO(), ...t }, ...trades]);
    setT({ pair: "", setup: "", rr: "", sl: "", tp: "", result: "", discipline: "" });
  };
  const del = (id) => save(trades.filter((x) => x.id !== id));

  const wins = trades.filter((x) => Number(x.result) > 0).length;
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  const pnl = trades.reduce((s, x) => s + Number(x.result || 0), 0);
  const avgRR = trades.length ? (trades.reduce((s, x) => s + Number(x.rr || 0), 0) / trades.length).toFixed(2) : "0";

  const riskAmt = (Number(calc.capital) * Number(calc.risk)) / 100;
  const diff = Math.abs(Number(calc.entry) - Number(calc.sl));
  const posSize = diff ? (riskAmt / diff).toFixed(4) : "0";
  const checkedCount = Object.values(checks).filter(Boolean).length;

  return (
    <Section title="Trading / Dziennik" desc="Checklista A+, kalkulator pozycji, statystyki" testid="module-trading">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Win rate" value={`${winRate}%`} />
        <Stat label="P&L" value={pnl} accent={pnl >= 0 ? "primary" : "cyan"} />
        <Stat label="Avg R:R" value={avgRR} accent="cyan" />
        <Stat label="Checklist A+" value={`${checkedCount}/12`} />
      </div>

      <Tabs defaultValue="journal">
        <TabsList className="mb-4"><TabsTrigger value="journal" data-testid="tab-journal">Dziennik</TabsTrigger><TabsTrigger value="checklist" data-testid="tab-checklist">Checklista A+</TabsTrigger><TabsTrigger value="calc" data-testid="tab-calc">Kalkulator</TabsTrigger><TabsTrigger value="alerts" data-testid="tab-alerts">Alerty TV</TabsTrigger></TabsList>

        <TabsContent value="journal">
          <Panel className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <Input data-testid="trade-pair" placeholder="Pair" value={t.pair} onChange={(e) => setT({ ...t, pair: e.target.value })} />
              <Input placeholder="Setup" value={t.setup} onChange={(e) => setT({ ...t, setup: e.target.value })} />
              <Input placeholder="R:R" value={t.rr} onChange={(e) => setT({ ...t, rr: e.target.value })} />
              <Input placeholder="SL" value={t.sl} onChange={(e) => setT({ ...t, sl: e.target.value })} />
              <Input placeholder="TP" value={t.tp} onChange={(e) => setT({ ...t, tp: e.target.value })} />
              <Input data-testid="trade-result" placeholder="Wynik" value={t.result} onChange={(e) => setT({ ...t, result: e.target.value })} />
              <Button data-testid="trade-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
            </div>
          </Panel>
          <Panel className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-3">Data</th><th className="pr-3">Pair</th><th className="pr-3">Setup</th><th className="pr-3">R:R</th><th className="pr-3">SL</th><th className="pr-3">TP</th><th className="pr-3">Wynik</th><th></th></tr></thead>
              <tbody>
                {trades.map((x) => (
                  <tr key={x.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 mono text-muted-foreground">{x.date}</td>
                    <td className="pr-3 mono font-medium">{x.pair}</td><td className="pr-3">{x.setup}</td><td className="pr-3 mono">{x.rr}</td>
                    <td className="pr-3 mono">{x.sl}</td><td className="pr-3 mono">{x.tp}</td>
                    <td className={`pr-3 mono font-medium ${Number(x.result) >= 0 ? "text-primary" : "text-destructive"}`}>{x.result}</td>
                    <td><button onClick={() => del(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {trades.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">Brak trade'ów</td></tr>}
              </tbody>
            </table>
          </Panel>
        </TabsContent>

        <TabsContent value="checklist">
          <Panel>
            <div className="grid sm:grid-cols-2 gap-2">
              {TRADE_CHECKLIST.map((c, i) => (
                <label key={i} data-testid={`check-${i}`} className="flex items-center gap-3 border border-border/60 rounded-lg px-3 py-2 cursor-pointer">
                  <Checkbox checked={!!checks[i]} onCheckedChange={(v) => setChecks({ ...checks, [i]: v })} />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm">Zgodność: <span className={`font-bold mono ${checkedCount === 12 ? "text-primary" : "text-amber-400"}`}>{checkedCount}/12</span> {checkedCount === 12 && "— Setup A+ ✓"}</p>
          </Panel>
        </TabsContent>

        <TabsContent value="calc">
          <Panel className="max-w-md">
            <div className="space-y-3">
              {[["capital", "Kapitał (zł)"], ["risk", "Ryzyko %"], ["entry", "Wejście"], ["sl", "Stop Loss"]].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{l}</span>
                  <Input data-testid={`calc-${k}`} type="number" className="w-40" value={calc[k]} onChange={(e) => setCalc({ ...calc, [k]: e.target.value })} /></div>
              ))}
              <div className="border-t border-border pt-3 space-y-1">
                <p className="flex justify-between"><span className="text-muted-foreground text-sm">Ryzyko kwotowe</span><span className="mono font-medium">{riskAmt.toFixed(2)} zł</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground text-sm">Wielkość pozycji</span><span className="mono font-bold text-primary" data-testid="calc-size">{posSize}</span></p>
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="alerts">
          <Panel>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm border border-border/60 rounded-lg px-3 py-2">
                  <span className="mono font-medium">{a.symbol} · {a.tf}</span><span className="text-muted-foreground">{a.type}</span>
                  <span className="mono text-xs text-muted-foreground">{a.time}</span><Pill tone={a.status === "active" ? "emerald" : "amber"}>{a.status}</Pill>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Alerty read-only (TradingView webhook) — do podpięcia po deployu backendu.</p>
          </Panel>
        </TabsContent>
      </Tabs>
    </Section>
  );
}
