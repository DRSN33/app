import { Section, Panel, Pill } from "@/lib/ui";
import { useCollection, uid } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function Schedule() {
  const [rows, save] = useCollection("schedule");
  const [f, setF] = useState({ time: "", who: "Ja", action: "", format: "" });

  const add = () => {
    if (!f.action) return;
    save([...rows, { id: uid(), ...f }].sort((a, b) => (a.time > b.time ? 1 : -1)));
    setF({ time: "", who: "Ja", action: "", format: "" });
  };
  const del = (id) => save(rows.filter((r) => r.id !== id));

  return (
    <Section title="Harmonogram Dnia" desc="Killzony, trening, praca głęboka — zasada 22:00 ekran OFF" testid="module-schedule">
      <Panel className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Input data-testid="schedule-time" placeholder="08:00" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
          <Input placeholder="Kto" value={f.who} onChange={(e) => setF({ ...f, who: e.target.value })} />
          <Input data-testid="schedule-action" className="sm:col-span-1" placeholder="Akcja" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} />
          <Input placeholder="Format" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })} />
          <Button data-testid="schedule-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
        </div>
      </Panel>
      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">Czas</th><th className="pr-3">Kto</th><th className="pr-3">Akcja</th><th className="pr-3">Format</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b border-border/50 ${r.kill ? "bg-primary/5" : ""}`}>
                <td className="py-2 pr-3 mono font-medium">{r.time}</td>
                <td className="pr-3 text-muted-foreground">{r.who}</td>
                <td className="pr-3">{r.action}</td>
                <td className="pr-3"><Pill tone={r.kill ? "emerald" : "muted"}>{r.format}</Pill></td>
                <td><button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Section>
  );
}
