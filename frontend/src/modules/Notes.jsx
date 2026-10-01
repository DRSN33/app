import { Section, Panel, Pill } from "@/lib/ui";
import { useCollection, uid, todayISO } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Notes() {
  const [notes, save] = useCollection("notes");
  const [q, setQ] = useState("");
  const [n, setN] = useState({ title: "", tags: "", content: "", source: "" });

  const add = () => {
    if (!n.title.trim()) return;
    save([{ id: uid(), title: n.title, tags: n.tags.split(",").map((t) => t.trim()).filter(Boolean), content: n.content, source: n.source, created: todayISO() }, ...notes]);
    setN({ title: "", tags: "", content: "", source: "" });
  };
  const del = (id) => save(notes.filter((x) => x.id !== id));

  const ql = q.toLowerCase();
  const filtered = notes.filter((x) => !q || x.title.toLowerCase().includes(ql) || (x.content || "").toLowerCase().includes(ql) || (x.tags || []).some((t) => t.toLowerCase().includes(ql)));

  return (
    <Section title="Baza Wiedzy / Notatki" desc="Notatki, tagi, prompty i linki — z wyszukiwarką" testid="module-notes"
      right={<div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid="notes-search" className="pl-9 w-56" placeholder="Szukaj..." value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
      <Panel className="mb-4">
        <div className="grid sm:grid-cols-2 gap-2">
          <Input data-testid="note-title" placeholder="Tytuł" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
          <Input placeholder="Tagi (przecinki)" value={n.tags} onChange={(e) => setN({ ...n, tags: e.target.value })} />
          <Input placeholder="Link (źródło)" value={n.source} onChange={(e) => setN({ ...n, source: e.target.value })} />
          <Button data-testid="note-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj notatkę</Button>
          <Textarea className="sm:col-span-2" rows={2} placeholder="Treść..." value={n.content} onChange={(e) => setN({ ...n, content: e.target.value })} />
        </div>
      </Panel>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((x) => (
          <Panel key={x.id}>
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold">{x.title}</h3>
              <button onClick={() => del(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{x.content}</p>
            <div className="flex gap-1 mt-2 flex-wrap">{(x.tags || []).map((t) => <Pill key={t} tone="cyan">#{t}</Pill>)}</div>
            {x.source && <a href={x.source} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">{x.source}</a>}
          </Panel>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Brak notatek</p>}
      </div>
    </Section>
  );
}
