import { Section, Panel, Stat, Pill } from "@/lib/ui";
import { useCollection, uid, todayISO } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

const CATS = ["Jedzenie", "Transport", "Rachunki", "Rozrywka", "Zdrowie", "Trading", "Inne"];
const COLORS = ["#22c55e", "#06b6d4", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6", "#64748b"];

export default function Finance() {
  const [rows, save] = useCollection("finance");
  const [f, setF] = useState({ type: "wydatek", amount: "", category: "Jedzenie", note: "" });

  const add = () => {
    if (!f.amount) return;
    save([{ id: uid(), date: todayISO(), ...f, amount: Number(f.amount) }, ...rows]);
    setF({ type: "wydatek", amount: "", category: "Jedzenie", note: "" });
  };
  const del = (id) => save(rows.filter((r) => r.id !== id));

  const income = rows.filter((r) => r.type === "przychód").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "wydatek").reduce((s, r) => s + Number(r.amount), 0);
  const byCat = CATS.map((c) => ({ name: c, value: rows.filter((r) => r.type === "wydatek" && r.category === c).reduce((s, r) => s + Number(r.amount), 0) })).filter((x) => x.value > 0);

  return (
    <Section title="Finanse" desc="Przychody, wydatki, bilans i kategorie" testid="module-finance">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Przychód" value={`${income} zł`} />
        <Stat label="Wydatki" value={`${expense} zł`} accent="cyan" />
        <Stat label="Bilans" value={`${income - expense} zł`} accent={income - expense >= 0 ? "primary" : "cyan"} />
      </div>

      <Panel className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-[auto_auto_1fr_1fr_auto] gap-2">
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}><SelectTrigger className="w-32" data-testid="fin-type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="wydatek">Wydatek</SelectItem><SelectItem value="przychód">Przychód</SelectItem></SelectContent></Select>
          <Input data-testid="fin-amount" type="number" placeholder="Kwota" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger data-testid="fin-cat"><SelectValue /></SelectTrigger>
            <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Input placeholder="Opis" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button data-testid="fin-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-3">Data</th><th className="pr-3">Typ</th><th className="pr-3">Kwota</th><th className="pr-3">Kategoria</th><th className="pr-3">Opis</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 mono text-muted-foreground">{r.date}</td>
                  <td className="pr-3"><Pill tone={r.type === "przychód" ? "emerald" : "red"}>{r.type}</Pill></td>
                  <td className="pr-3 mono font-medium">{r.amount} zł</td>
                  <td className="pr-3">{r.category}</td>
                  <td className="pr-3 text-muted-foreground">{r.note}</td>
                  <td><button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">Brak wpisów</td></tr>}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <h3 className="font-display font-semibold mb-2">Wydatki wg kategorii</h3>
          {byCat.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart><Pie data={byCat} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                {byCat.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #222", borderRadius: 12 }} /></PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Brak wydatków</p>}
        </Panel>
      </div>
    </Section>
  );
}
