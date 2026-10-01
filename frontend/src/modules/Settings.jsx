import { Section, Panel } from "@/lib/ui";
import { api, getSettings, putSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Upload, Trash2, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Settings({ theme, setTheme }) {
  const [pin, setPin] = useState({ current: "", new: "" });
  const [integ, setInteg] = useState({ notion: false, telegram: false });
  const fileRef = useRef(null);

  useEffect(() => {
    api.get("/notion/status").then((r) => setInteg((s) => ({ ...s, notion: r.data.configured }))).catch(() => {});
    api.get("/telegram/status").then((r) => setInteg((s) => ({ ...s, telegram: r.data.configured }))).catch(() => {});
  }, []);

  const exportData = async () => {
    const { data } = await api.get("/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `drsn33-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Eksport gotowy");
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await api.post("/import", JSON.parse(text));
      toast.success("Import zakończony — odśwież stronę");
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error("Błędny plik JSON"); }
  };

  const changePin = async () => {
    try { await api.post("/auth/pin", pin); toast.success("PIN zmieniony"); setPin({ current: "", new: "" }); }
    catch (e) { toast.error(e?.response?.data?.detail || "Błąd zmiany PIN"); }
  };

  const reset = async () => { await api.post("/reset"); toast.success("Dane zresetowane"); setTimeout(() => window.location.reload(), 800); };

  const pushNotion = async () => {
    try { const { data } = await api.post("/notion/push/tasks"); toast.success(`Notion: wypchnięto ${data.pushed}/${data.total} zadań`); }
    catch (e) { toast.error(e?.response?.data?.detail || "Notion nieskonfigurowany"); }
  };

  return (
    <Section title="Ustawienia" desc="Motyw, bezpieczeństwo, backup i integracje" testid="module-settings">
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <h3 className="font-display font-semibold mb-3">Wygląd</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tryb ciemny</span>
            <Switch data-testid="theme-toggle" checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Zmiana PIN</h3>
          <div className="flex gap-2">
            <Input type="password" placeholder="Obecny PIN" value={pin.current} onChange={(e) => setPin({ ...pin, current: e.target.value })} />
            <Input type="password" placeholder="Nowy PIN" value={pin.new} onChange={(e) => setPin({ ...pin, new: e.target.value })} />
            <Button data-testid="pin-change" onClick={changePin}>Zmień</Button>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display font-semibold mb-3">Backup / Dane</h3>
          <div className="flex gap-2 flex-wrap">
            <Button data-testid="export-btn" onClick={exportData} className="gap-1"><Download className="w-4 h-4" /> Eksport JSON</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1"><Upload className="w-4 h-4" /> Import</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importData} />
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" className="gap-1"><Trash2 className="w-4 h-4" /> Reset</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Zresetować wszystkie dane?</AlertDialogTitle>
                  <AlertDialogDescription>Ta operacja usunie wszystkie dane z bazy. Nieodwracalne.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={reset} data-testid="reset-confirm">Usuń wszystko</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display font-semibold mb-3">Integracje</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Notion {integ.notion ? "✓ podłączony" : "— nieskonfigurowany"}</span>
              <Button size="sm" variant="outline" onClick={pushNotion} disabled={!integ.notion}>Wypchnij zadania</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Telegram {integ.telegram ? "✓ podłączony" : "— nieskonfigurowany"}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">Aby włączyć Notion/Telegram, podaj tokeny — dodam je do backendu.</p>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
