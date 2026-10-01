import { Section, Panel, Pill } from "@/lib/ui";
import { useCollection, uid, todayISO, api } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, Wrench, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Workshop() {
  const [repairs, save] = useCollection("repairs");
  const [r, setR] = useState({ vehicle: "", symptom: "", solution: "" });
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const add = () => { if (!r.vehicle) return; save([{ id: uid(), date: todayISO(), ...r }, ...repairs]); setR({ vehicle: "", symptom: "", solution: "" }); };
  const del = (id) => save(repairs.filter((x) => x.id !== id));

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setAnswer("");
    try {
      const { data } = await api.post("/ai/diagnosta", { prompt });
      setAnswer(data.text);
    } catch (e) { toast.error("Błąd AI diagnosty"); } finally { setLoading(false); }
  };

  return (
    <Section title="Warsztat / Technika" desc="AI diagnosta, baza OBD, historia napraw" testid="module-workshop">
      <Tabs defaultValue="diag">
        <TabsList className="mb-4"><TabsTrigger value="diag" data-testid="tab-diag">AI Diagnosta</TabsTrigger><TabsTrigger value="history">Historia napraw</TabsTrigger></TabsList>

        <TabsContent value="diag">
          <Panel accent="cyan">
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[hsl(var(--cyan))]" /> Opisz objaw / kod OBD</h3>
            <Textarea data-testid="diag-input" rows={3} placeholder="np. VW Passat B7 2.0 TDI, kod P0401, spadek mocy, dym..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <Button data-testid="diag-ask" onClick={askAI} disabled={loading} className="mt-3 gap-1"><Wrench className="w-4 h-4" /> {loading ? "Analizuję..." : "Diagnozuj"}</Button>
            {answer && <div data-testid="diag-answer" className="mt-4 text-sm whitespace-pre-wrap border-t border-border pt-3 leading-relaxed">{answer}</div>}
          </Panel>
        </TabsContent>

        <TabsContent value="history">
          <Panel className="mb-4">
            <div className="grid sm:grid-cols-4 gap-2">
              <Input placeholder="Pojazd" value={r.vehicle} onChange={(e) => setR({ ...r, vehicle: e.target.value })} />
              <Input placeholder="Objaw" value={r.symptom} onChange={(e) => setR({ ...r, symptom: e.target.value })} />
              <Input placeholder="Rozwiązanie" value={r.solution} onChange={(e) => setR({ ...r, solution: e.target.value })} />
              <Button data-testid="repair-add" onClick={add} className="gap-1"><Plus className="w-4 h-4" /> Dodaj</Button>
            </div>
          </Panel>
          <div className="space-y-2">
            {repairs.map((x) => (
              <Panel key={x.id} className="flex items-start justify-between py-3">
                <div><span className="mono text-xs text-muted-foreground">{x.date}</span> <Pill tone="emerald">{x.vehicle}</Pill>
                  <p className="text-sm mt-1"><span className="text-muted-foreground">Objaw:</span> {x.symptom}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Naprawa:</span> {x.solution}</p></div>
                <button onClick={() => del(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </Panel>
            ))}
            {repairs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Brak historii napraw</p>}
          </div>
        </TabsContent>
      </Tabs>
    </Section>
  );
}
