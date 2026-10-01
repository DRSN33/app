import { Section, Panel, Stat } from "@/lib/ui";
import { useCollection, uid, todayISO, api } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Send, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Reports() {
  const [reports, save] = useCollection("reports");
  const [tasks] = useCollection("tasks");
  const [habits] = useCollection("habits");
  const [finance] = useCollection("finance");
  const [trades] = useCollection("trades");
  const [f, setF] = useState({ mood: 7, sleep: 7, energy: 7, triggers: "", expenses: "", training: "", note: "" });
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const saveReport = () => {
    save([{ id: uid(), date: todayISO(), ...f }, ...reports]);
    toast.success("Raport zapisany");
  };

  const genSummary = async () => {
    setLoading(true); setSummary("");
    const today = todayISO();
    const ctx = {
      data: today,
      zadania_otwarte: tasks.filter((t) => t.status !== "done").length,
      nawyki_dzis: habits.filter((h) => h.log?.[today]).length + "/" + habits.length,
      bilans: finance.reduce((s, x) => s + (x.type === "przychód" ? 1 : -1) * Number(x.amount || 0), 0),
      trade_dzis: trades.filter((t) => t.date === today).length,
      raport: f,
    };
    try {
      const { data } = await api.post("/ai/summary", { context: ctx });
      setSummary(data.text);
    } catch { toast.error("Błąd generowania podsumowania"); } finally { setLoading(false); }
  };

  const sendTelegram = async () => {
    try { await api.post("/telegram/send", { text: summary || "Raport DRSN33" }); toast.success("Wysłano na Telegram"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Telegram nieskonfigurowany"); }
  };

  return (
    <Section title="Raporty" desc="Raport wieczorny + AI podsumowanie dnia" testid="module-reports">
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <h3 className="font-display font-semibold mb-3">Raport wieczorny</h3>
          {[["mood", "Nastrój"], ["sleep", "Sen (h)"], ["energy", "Energia"]].map(([k, l]) => (
            <div key={k} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{l}</span><span className="mono text-primary">{f[k]}</span></div>
              <Slider data-testid={`report-${k}`} value={[f[k]]} min={0} max={10} step={1} onValueChange={(v) => setF({ ...f, [k]: v[0] })} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input placeholder="Triggery" value={f.triggers} onChange={(e) => setF({ ...f, triggers: e.target.value })} />
            <Input placeholder="Wydatki" value={f.expenses} onChange={(e) => setF({ ...f, expenses: e.target.value })} />
            <Input placeholder="Trening" value={f.training} onChange={(e) => setF({ ...f, training: e.target.value })} />
          </div>
          <Textarea className="mt-2" rows={2} placeholder="Notatka dnia..." value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <Button data-testid="report-save" onClick={saveReport} className="mt-3 gap-1"><Save className="w-4 h-4" /> Zapisz raport</Button>
        </Panel>

        <Panel accent="cyan">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[hsl(var(--cyan))]" /> AI Podsumowanie dnia</h3>
          <div className="flex gap-2">
            <Button data-testid="summary-gen" onClick={genSummary} disabled={loading} className="gap-1">{loading ? "Generuję..." : "Generuj podsumowanie"}</Button>
            <Button variant="outline" onClick={sendTelegram} disabled={!summary} className="gap-1"><Send className="w-4 h-4" /> Telegram</Button>
          </div>
          {summary && <div data-testid="summary-text" className="mt-4 text-sm whitespace-pre-wrap leading-relaxed border-t border-border pt-3">{summary}</div>}
        </Panel>
      </div>

      <div className="mt-4">
        <h3 className="font-display font-semibold mb-2">Historia raportów</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <Panel key={r.id}>
              <p className="mono text-xs text-muted-foreground">{r.date}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div><p className="text-xs text-muted-foreground">Nastrój</p><p className="mono text-primary font-bold">{r.mood}</p></div>
                <div><p className="text-xs text-muted-foreground">Sen</p><p className="mono text-primary font-bold">{r.sleep}</p></div>
                <div><p className="text-xs text-muted-foreground">Energia</p><p className="mono text-primary font-bold">{r.energy}</p></div>
              </div>
              {r.note && <p className="text-sm text-muted-foreground mt-2">{r.note}</p>}
            </Panel>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground">Brak raportów</p>}
        </div>
      </div>
    </Section>
  );
}
