import { Section, Panel } from "@/lib/ui";
import { useCollection, uid } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Flame } from "lucide-react";
import { useState } from "react";

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// ostatnie 7 dni (ISO), od najstarszego
function last7() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
function streak(log) {
  let s = 0; const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (log?.[iso]) { s++; d.setDate(d.getDate() - 1); } else break;
  }
  return s;
}

export default function Habits() {
  const [habits, save] = useCollection("habits");
  const [name, setName] = useState("");
  const days = last7();

  const toggle = (id, iso) => save(habits.map((h) => h.id === id ? { ...h, log: { ...h.log, [iso]: !h.log?.[iso] } } : h));
  const add = () => { if (!name.trim()) return; save([...habits, { id: uid(), name, log: {} }]); setName(""); };
  const del = (id) => save(habits.filter((h) => h.id !== id));

  return (
    <Section title="Nawyki" desc="Widok tygodniowy, streak i % wykonania" testid="module-habits">
      <Panel className="mb-4">
        <div className="flex gap-2">
          <Input data-testid="habit-input" placeholder="Nowy nawyk..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button data-testid="habit-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground">
            <th className="text-left py-2 pr-3 min-w-[140px]">Nawyk</th>
            {days.map((d, i) => <th key={d} className="px-1 text-center w-10">{DAY_LABELS[i]}</th>)}
            <th className="px-2 text-center">Streak</th>
          </tr></thead>
          <tbody>
            {habits.map((h) => {
              const done = days.filter((d) => h.log?.[d]).length;
              return (
                <tr key={h.id} className="border-t border-border/50">
                  <td className="py-2 pr-3 flex items-center gap-2">
                    <span>{h.name}</span>
                    <button onClick={() => del(h.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                  {days.map((d) => (
                    <td key={d} className="px-1 text-center">
                      <button data-testid={`habit-cell-${h.id}-${d}`} onClick={() => toggle(h.id, d)}
                        className={`w-7 h-7 rounded-md transition-colors ${h.log?.[d] ? "bg-primary" : "bg-secondary hover:bg-accent"}`} />
                    </td>
                  ))}
                  <td className="px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-primary font-medium mono"><Flame className="w-3.5 h-3.5" />{streak(h.log)}</span>
                    <div className="text-xs text-muted-foreground">{Math.round((done / 7) * 100)}%</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </Section>
  );
}
