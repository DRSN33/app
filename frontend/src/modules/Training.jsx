import { Section, Panel, Pill } from "@/lib/ui";
import { useCollection, uid, todayISO, PPL, HIT } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Play, Pause, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Training() {
  const [logs, save] = useCollection("workouts");
  const [l, setL] = useState({ type: "Push", rpe: "7", note: "" });
  // timer HIT 15 min
  const [sec, setSec] = useState(900);
  const [run, setRun] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (run) ref.current = setInterval(() => setSec((s) => (s <= 1 ? (setRun(false), 0) : s - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [run]);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const add = () => { save([{ id: uid(), date: todayISO(), ...l }, ...logs]); setL({ type: "Push", rpe: "7", note: "" }); };
  const del = (id) => save(logs.filter((x) => x.id !== id));

  return (
    <Section title="Trening / Plan PPL" desc="Push · Pull · Legs + HIT 15 min + log" testid="module-training">
      <Tabs defaultValue="plan">
        <TabsList className="mb-4"><TabsTrigger value="plan">Plan tygodnia</TabsTrigger><TabsTrigger value="hit" data-testid="tab-hit">15-min HIT</TabsTrigger><TabsTrigger value="log">Log treningu</TabsTrigger></TabsList>

        <TabsContent value="plan">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(PPL).map(([day, v]) => (
              <Panel key={day} accent={v.type === "Rest" ? undefined : "emerald"}>
                <div className="flex justify-between items-center mb-2"><span className="font-display font-semibold">{day}</span><Pill tone={v.type === "Rest" ? "muted" : "emerald"}>{v.type}</Pill></div>
                <ul className="text-sm space-y-1 text-muted-foreground">{v.ex.map((e, i) => <li key={i}>• {e}</li>)}</ul>
              </Panel>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hit">
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel accent="cyan" className="flex flex-col items-center justify-center py-8">
              <p className="font-display text-7xl font-extrabold mono" data-testid="hit-timer">{mm}:{ss}</p>
              <div className="flex gap-2 mt-5">
                <Button data-testid="hit-toggle" onClick={() => setRun((r) => !r)} className="gap-1">{run ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{run ? "Pauza" : "Start"}</Button>
                <Button variant="outline" onClick={() => { setRun(false); setSec(900); }} className="gap-1"><RotateCcw className="w-4 h-4" /> Reset</Button>
              </div>
            </Panel>
            <Panel><h3 className="font-display font-semibold mb-2">Ćwiczenia HIT</h3>
              <ul className="grid grid-cols-2 gap-2 text-sm">{HIT.map((e, i) => <li key={i} className="border border-border/60 rounded-lg px-3 py-2">{i + 1}. {e}</li>)}</ul>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <Panel className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="Typ (Push/Pull/Legs)" value={l.type} onChange={(e) => setL({ ...l, type: e.target.value })} />
              <Input placeholder="RPE" value={l.rpe} onChange={(e) => setL({ ...l, rpe: e.target.value })} />
              <Input placeholder="Notatka" value={l.note} onChange={(e) => setL({ ...l, note: e.target.value })} />
              <Button data-testid="workout-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Zapisz</Button>
            </div>
          </Panel>
          <div className="space-y-2">
            {logs.map((x) => (
              <Panel key={x.id} className="flex items-center justify-between py-3">
                <div><span className="mono text-muted-foreground text-sm mr-3">{x.date}</span><Pill tone="emerald">{x.type}</Pill> <span className="text-sm ml-2">RPE {x.rpe} · {x.note}</span></div>
                <button onClick={() => del(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </Panel>
            ))}
            {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Brak wpisów</p>}
          </div>
        </TabsContent>
      </Tabs>
    </Section>
  );
}
