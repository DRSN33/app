import axios from "axios";
import { useState, useEffect, useCallback } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API });

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const todayISO = () => new Date().toISOString().slice(0, 10);

// ---- globalny cache + subskrypcje ----
const cache = {};
const subs = {};
const LS = (col) => `drsn33:${col}`;

function notify(col) { (subs[col] || []).forEach((fn) => fn(cache[col])); }

export async function loadCollection(col) {
  // localStorage natychmiast, backend w tle
  try {
    const ls = JSON.parse(localStorage.getItem(LS(col)) || "null");
    if (ls) cache[col] = ls;
  } catch { /* ignore */ }
  try {
    const { data } = await api.get(`/data/${col}`);
    cache[col] = data;
    localStorage.setItem(LS(col), JSON.stringify(data));
    notify(col);
  } catch { notify(col); }
  return cache[col] || [];
}

export async function saveCollection(col, items) {
  cache[col] = items;
  localStorage.setItem(LS(col), JSON.stringify(items));
  notify(col);
  try { await api.put(`/data/${col}`, { items }); } catch { /* offline ok */ }
}

export function useCollection(col) {
  const [items, setItems] = useState(cache[col] || []);
  useEffect(() => {
    subs[col] = subs[col] || [];
    const fn = (v) => setItems(v || []);
    subs[col].push(fn);
    if (!cache[col]) loadCollection(col); else setItems(cache[col]);
    return () => { subs[col] = subs[col].filter((f) => f !== fn); };
  }, [col]);
  const save = useCallback((next) => saveCollection(col, next), [col]);
  return [items, save];
}

// ---- settings ----
export async function getSettings() {
  try { return (await api.get("/settings")).data; } catch { return { theme: "dark" }; }
}
export async function putSettings(patch) {
  try { return (await api.put("/settings", patch)).data; } catch { return patch; }
}

// ---- seed ----
export const SEED = {
  schedule: [
    { id: uid(), time: "06:30", who: "Ja", action: "Pobudka + woda + światło", format: "Rutyna" },
    { id: uid(), time: "07:00", who: "Leo", action: "Spacer z Leo", format: "Ruch" },
    { id: uid(), time: "08:00", who: "Ja", action: "London Killzone — trading", format: "Killzone", kill: true },
    { id: uid(), time: "11:00", who: "Ja", action: "Praca głęboka / projekty", format: "Deep work" },
    { id: uid(), time: "13:30", who: "Ja", action: "NY Killzone — trading", format: "Killzone", kill: true },
    { id: uid(), time: "17:00", who: "Ja", action: "Trening (PPL)", format: "Trening" },
    { id: uid(), time: "19:00", who: "Ja", action: "Nauka 30 min", format: "Rozwój" },
    { id: uid(), time: "22:00", who: "Ja", action: "EKRAN OFF — raport wieczorny", format: "Reset", kill: true },
  ],
  habits: [
    { id: uid(), name: "Trening", log: {} },
    { id: uid(), name: "Spacer", log: {} },
    { id: uid(), name: "Sen 7h+", log: {} },
    { id: uid(), name: "Higiena cyfrowa", log: {} },
    { id: uid(), name: "Nauka 30 min", log: {} },
    { id: uid(), name: "Praca głęboka", log: {} },
    { id: uid(), name: "Raport wieczorny", log: {} },
  ],
  tasks: [
    { id: uid(), text: "Zamknij setup A+ na BTC", priority: "P1", project: "Trading", due: todayISO(), status: "open", created: todayISO() },
    { id: uid(), text: "Miks utworu ERROR444 #3", priority: "P2", project: "ERROR444", due: "", status: "open", created: todayISO() },
  ],
  trades: [],
  finance: [],
  workouts: [],
  songs: [
    { id: uid(), nr: 1, title: "NeuroHACKING", status: "Beat", bpm: 140, version: "v0.3", notes: "Dodać drugi refren" },
    { id: uid(), nr: 2, title: "444", status: "Pomysł", bpm: 128, version: "v0.1", notes: "" },
  ],
  notes: [
    { id: uid(), title: "Prompt diagnosta", tags: ["warsztat", "prompt"], content: "Opisz objaw, kod OBD, przebieg i rok.", source: "", created: todayISO() },
  ],
  reports: [],
  alerts: [
    { id: uid(), time: "08:12", symbol: "BTCUSDT", tf: "15m", type: "FVG long", status: "active" },
    { id: uid(), time: "09:40", symbol: "EURUSD", tf: "1h", type: "Sweep + CHoCH", status: "watch" },
  ],
  nutrition: [
    { id: uid(), meal: "Śniadanie", items: "Jajka, owsianka, owoce", p: 35, f: 18, c: 60 },
    { id: uid(), meal: "Przekąska", items: "Shake białkowy", p: 30, f: 3, c: 10 },
    { id: uid(), meal: "Obiad", items: "Kurczak, ryż, warzywa", p: 45, f: 15, c: 80 },
    { id: uid(), meal: "Przekąska 2", items: "Twaróg, orzechy", p: 25, f: 15, c: 12 },
    { id: uid(), meal: "Kolacja", items: "Łosoś, kasza, sałatka", p: 40, f: 20, c: 45 },
  ],
  shopping: [],
  repairs: [],
  projects: [
    { id: uid(), name: "ERROR444 — album", progress: 40 },
    { id: uid(), name: "System tradingowy A+", progress: 65 },
    { id: uid(), name: "Warsztat — baza wiedzy", progress: 25 },
  ],
};

export async function seedIfEmpty() {
  const exportData = await api.get("/export").then((r) => r.data).catch(() => null);
  if (!exportData) return;
  for (const [col, items] of Object.entries(SEED)) {
    if (!exportData[col] || exportData[col].length === 0) {
      await saveCollection(col, items);
    }
  }
}

export const TRADE_CHECKLIST = [
  "HTF bias zgodny", "Struktura rynku (BOS/CHoCH)", "Płynność zebrana (sweep)",
  "FVG / OB w strefie", "Killzone aktywna", "R:R min 1:3", "SL za strukturą",
  "Brak newsów high impact", "Zgodność z planem", "Brak emocji / FOMO",
  "Wielkość pozycji policzona", "Zapisano w dzienniku",
];

export const PPL = {
  Pon: { type: "Push", ex: ["Wyciskanie sztangi 4x6", "OHP 4x8", "Rozpiętki 3x12", "Triceps 3x12"] },
  Wt: { type: "Pull", ex: ["Martwy ciąg 4x5", "Podciąganie 4x8", "Wiosłowanie 4x10", "Biceps 3x12"] },
  Śr: { type: "Rest", ex: ["Spacer 8k kroków", "Mobilność 15 min"] },
  Czw: { type: "Legs", ex: ["Przysiad 4x6", "RDL 4x8", "Wykroki 3x12", "Łydki 4x15"] },
  Pt: { type: "Push", ex: ["Wyciskanie hantle 4x8", "Pompki 3xMAX", "Boki 3x15", "Triceps 3x12"] },
  Sob: { type: "Pull", ex: ["Podciąganie 4xMAX", "Face pull 3x15", "Wiosłowanie 4x10", "Biceps 3x12"] },
  Nd: { type: "Rest", ex: ["Regeneracja", "Przegląd tygodnia"] },
};

export const HIT = ["Burpees", "Pajacyki", "Mountain climbers", "Przysiady", "Pompki", "Deska", "Skip A", "Brzuszki"];
