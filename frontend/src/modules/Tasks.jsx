import { Section, Panel, Pill, prioTone } from "@/lib/ui";
import { useCollection, uid, todayISO } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

const VIEWS = { today: "Dziś", overdue: "Zaległe", noterm: "Bez terminu", all: "Wszystkie" };

export default function Tasks() {
  const [tasks, save] = useCollection("tasks");
  const [view, setView] = useState("today");
  const [prio, setPrio] = useState("all");
  const [f, setF] = useState({ text: "", priority: "P2", project: "", due: "" });

  const add = () => {
    if (!f.text.trim()) return;
    save([{ id: uid(), ...f, status: "open", created: todayISO() }, ...tasks]);
    setF({ text: "", priority: "P2", project: "", due: "" });
  };
  const toggle = (id) => save(tasks.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "open" : "done" } : t)));
  const del = (id) => save(tasks.filter((t) => t.id !== id));

  const today = todayISO();
  const filtered = tasks.filter((t) => {
    if (prio !== "all" && t.priority !== prio) return false;
    if (view === "today") return t.status !== "done" && t.due === today;
    if (view === "overdue") return t.status !== "done" && t.due && t.due < today;
    if (view === "noterm") return t.status !== "done" && !t.due;
    return true;
  });

  return (
    <Section title="Zadania / To-Do" desc="Priorytety P1–P3, projekty, terminy" testid="module-tasks"
      right={<div className="flex gap-2">
        <Select value={prio} onValueChange={setPrio}><SelectTrigger className="w-28" data-testid="tasks-prio-filter"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Priorytet</SelectItem><SelectItem value="P1">P1</SelectItem><SelectItem value="P2">P2</SelectItem><SelectItem value="P3">P3</SelectItem></SelectContent></Select>
      </div>}>
      <Panel className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2">
          <Input data-testid="task-input" placeholder="Nowe zadanie..." value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}><SelectTrigger className="w-24" data-testid="task-prio"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="P1">P1</SelectItem><SelectItem value="P2">P2</SelectItem><SelectItem value="P3">P3</SelectItem></SelectContent></Select>
          <Input className="w-32" placeholder="Projekt" value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} />
          <Input className="w-40" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
          <Button data-testid="task-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
        </div>
      </Panel>

      <div className="flex gap-2 mb-3 flex-wrap">
        {Object.entries(VIEWS).map(([k, l]) => (
          <button key={k} data-testid={`tasks-view-${k}`} onClick={() => setView(k)}
            className={`px-3 py-1.5 rounded-full text-sm ${view === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <Panel key={t.id} data-testid="task-item" className="flex items-center gap-3 py-3">
            <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t.id)} data-testid={`task-toggle-${t.id}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.text}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Pill tone={prioTone(t.priority)}>{t.priority}</Pill>
                {t.project && <Pill>{t.project}</Pill>}
                {t.due && <Pill tone="cyan">{t.due}</Pill>}
              </div>
            </div>
            <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </Panel>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Brak zadań w tym widoku</p>}
      </div>
    </Section>
  );
}
