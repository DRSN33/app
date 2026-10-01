import { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, seedIfEmpty } from "@/lib/store";
import {
  LayoutDashboard, CalendarClock, CheckSquare, Flame, Wallet, LineChart,
  Dumbbell, Utensils, Music2, Wrench, BookOpen, FileText, Settings as Cog, LogOut, Bell, FolderOpen,
} from "lucide-react";

import Dashboard from "@/modules/Dashboard";
import Schedule from "@/modules/Schedule";
import Tasks from "@/modules/Tasks";
import Habits from "@/modules/Habits";
import Finance from "@/modules/Finance";
import Trading from "@/modules/Trading";
import Training from "@/modules/Training";
import Nutrition from "@/modules/Nutrition";
import Music from "@/modules/Music";
import Workshop from "@/modules/Workshop";
import Notes from "@/modules/Notes";
import Reports from "@/modules/Reports";
import Files from "@/modules/Files";
import SettingsModule from "@/modules/Settings";

const MOTTO = "Nie jestem tym, który ucieka od rzeczywistości. Jestem tym, który TWORZY rzeczywistość.";

const NAV = [
  ["dashboard", "Panel", LayoutDashboard],
  ["schedule", "Harmonogram", CalendarClock],
  ["tasks", "Zadania", CheckSquare],
  ["habits", "Nawyki", Flame],
  ["finance", "Finanse", Wallet],
  ["trading", "Trading", LineChart],
  ["training", "Trening", Dumbbell],
  ["nutrition", "Żywienie", Utensils],
  ["music", "ERROR444", Music2],
  ["workshop", "Warsztat", Wrench],
  ["notes", "Baza wiedzy", BookOpen],
  ["files", "Pliki", FolderOpen],
  ["reports", "Raporty", FileText],
  ["settings", "Ustawienia", Cog],
];

function PinScreen({ onOk }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/verify", { pin });
      if (data.ok) { localStorage.setItem("drsn33:auth", "1"); onOk(); }
      else { setErr(true); setTimeout(() => setErr(false), 1500); }
    } catch { setErr(true); }
  };
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6 scanline relative">
      <form onSubmit={submit} className="w-full max-w-sm text-center animate-fadeUp relative z-10">
        <p className="mono text-xs tracking-[0.4em] text-primary mb-2">SYSTEM DRSN33</p>
        <h1 className="font-display text-4xl font-extrabold mb-1">NeuroHACKING <span className="text-[hsl(var(--cyan))]">444</span></h1>
        <p className="text-sm text-muted-foreground mb-8">CENTRUM DOWODZENIA</p>
        <input
          data-testid="pin-input" autoFocus type="password" inputMode="numeric" value={pin}
          onChange={(e) => setPin(e.target.value)} placeholder="• • • •"
          className={`w-full text-center text-2xl mono tracking-[0.5em] bg-card border rounded-2xl py-4 outline-none focus:border-primary ${err ? "border-destructive animate-pulse" : "border-border"}`}
        />
        {err && <p className="text-destructive text-sm mt-2">Niepoprawny PIN</p>}
        <Button data-testid="pin-submit" type="submit" className="w-full mt-4 rounded-2xl h-12 text-base glow-emerald">Odblokuj system</Button>
        <p className="text-xs text-muted-foreground mt-8 italic px-4">"{MOTTO}"</p>
      </form>
    </div>
  );
}

const MODULES = {
  dashboard: Dashboard, schedule: Schedule, tasks: Tasks, habits: Habits, finance: Finance,
  trading: Trading, training: Training, nutrition: Nutrition, music: Music, workshop: Workshop,
  notes: Notes, reports: Reports, files: Files, settings: SettingsModule,
};

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("drsn33:auth") === "1");
  const [view, setView] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("drsn33:theme") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("drsn33:theme", theme);
  }, [theme]);

  useEffect(() => { if (authed) seedIfEmpty(); }, [authed]);

  if (!authed) return (<><PinScreen onOk={() => setAuthed(true)} /><Toaster /></>);

  const Mod = MODULES[view];
  const logout = () => { localStorage.removeItem("drsn33:auth"); setAuthed(false); };
  const notify = async () => {
    if (!("Notification" in window)) return toast.error("Brak wsparcia powiadomień");
    const p = await Notification.requestPermission();
    if (p === "granted") { new Notification("DRSN33", { body: "Powiadomienia włączone ✓" }); toast.success("Powiadomienia włączone"); }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card/50 p-4 sticky top-0 h-screen">
        <div className="mb-6">
          <p className="mono text-[10px] tracking-[0.3em] text-primary">DRSN33</p>
          <h1 className="font-display text-xl font-extrabold leading-tight">NeuroHACKING <span className="text-[hsl(var(--cyan))]">444</span></h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} data-testid={`nav-${k}`} onClick={() => setView(k)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${view === k ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
        <Button variant="ghost" onClick={logout} className="justify-start gap-2 text-muted-foreground mt-2"><LogOut className="w-4 h-4" /> Wyloguj</Button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground italic truncate">"{MOTTO}"</p>
            <button data-testid="notify-btn" onClick={notify} className="shrink-0 text-muted-foreground hover:text-primary"><Bell className="w-5 h-5" /></button>
          </div>
        </header>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <Mod go={setView} theme={theme} setTheme={setTheme} />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border flex overflow-x-auto">
        {NAV.map(([k, label, Icon]) => (
          <button key={k} data-testid={`bottomnav-${k}`} onClick={() => setView(k)}
            className={`flex-1 min-w-[64px] flex flex-col items-center gap-0.5 py-2 text-[10px] ${view === k ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}
