import { Section, Panel, Pill } from "@/lib/ui";
import { useCollection, uid } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Music2 } from "lucide-react";
import { useState } from "react";

const STATUSES = ["Pomysł", "Tekst", "Beat", "Mix", "Master", "Gotowe"];
const tone = (s) => ({ "Pomysł": "muted", Tekst: "cyan", Beat: "amber", Mix: "cyan", Master: "emerald", Gotowe: "emerald" }[s] || "muted");

export default function Music() {
  const [songs, save] = useCollection("songs");
  const [s, setS] = useState({ title: "", status: "Pomysł", bpm: "", version: "v0.1", notes: "" });

  const add = () => {
    if (!s.title.trim()) return;
    const nr = (songs.reduce((m, x) => Math.max(m, x.nr || 0), 0)) + 1;
    save([...songs, { id: uid(), nr, ...s }]);
    setS({ title: "", status: "Pomysł", bpm: "", version: "v0.1", notes: "" });
  };
  const upd = (id, k, v) => save(songs.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const del = (id) => save(songs.filter((x) => x.id !== id));

  return (
    <Section title="ERROR444 / Muzyka" desc="Pipeline utworów: Pomysł → Tekst → Beat → Mix → Master → Gotowe" testid="module-music">
      <Panel className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Input data-testid="song-title" placeholder="Tytuł utworu" value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} />
          <Select value={s.status} onValueChange={(v) => setS({ ...s, status: v })}><SelectTrigger data-testid="song-status"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          <Input placeholder="BPM" value={s.bpm} onChange={(e) => setS({ ...s, bpm: e.target.value })} />
          <Input placeholder="Wersja" value={s.version} onChange={(e) => setS({ ...s, version: e.target.value })} />
          <Button data-testid="song-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
        </div>
      </Panel>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {songs.sort((a, b) => a.nr - b.nr).map((x) => (
          <Panel key={x.id} accent={x.status === "Gotowe" ? "emerald" : undefined}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><Music2 className="w-4 h-4 text-[hsl(var(--cyan))]" /><span className="font-display font-semibold">#{x.nr} {x.title}</span></div>
              <button onClick={() => del(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <Select value={x.status} onValueChange={(v) => upd(x.id, "status", v)}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent></Select>
              <Pill tone={tone(x.status)}>{x.status}</Pill>
              <Pill tone="cyan">{x.bpm || "—"} BPM</Pill><Pill>{x.version}</Pill>
            </div>
            <Input className="mt-2 h-8 text-sm" placeholder="Notatki, teksty, refren..." value={x.notes} onChange={(e) => upd(x.id, "notes", e.target.value)} />
          </Panel>
        ))}
      </div>
    </Section>
  );
}
