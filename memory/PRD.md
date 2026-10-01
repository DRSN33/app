# PRD — SYSTEM DRSN33 / NeuroHACKING 444 — CENTRUM DOWODZENIA

## Problem statement
Osobiste centrum dowodzenia (single-user) na wszystko: biuro, pliki, notatki, przypomnienia,
to-do, trading, trening, finanse, projekty, muzyka, baza wiedzy, warsztat. Inspiracja: drabson.netlify.app.
Motto: "Nie jestem tym, który ucieka od rzeczywistości. Jestem tym, który TWORZY rzeczywistość."

## Architecture
- Backend: FastAPI + MongoDB. Generyczne API kolekcji (bulk replace) `GET/PUT /api/data/{col}`.
  Auth PIN (`/api/auth/verify`, `/api/auth/pin`). Export/import/reset. AI (Claude Sonnet 4.6 via
  Emergent LLM key): `/api/ai/summary`, `/api/ai/diagnosta`. Integracje: Telegram (`/api/telegram/*`),
  Notion (`/api/notion/*`) — czytają tokeny z env, zwracają graceful 400 gdy niekonfigurowane.
- Frontend: React (Vite) + Tailwind v4 + shadcn/ui. Dark mode domyślnie, akcenty: zieleń #22c55e + cyan #06b6d4.
  Fonty: Sora (display), Inter (body), JetBrains Mono (dane). Sidebar (desktop) + bottom-nav (mobile).
  Store: `lib/store.js` — useCollection hook, localStorage cache + sync do backendu, seed danych.

## User persona
Jedna osoba (operator) — trader, twórca muzyki (ERROR444), mechanik/warsztat, dbający o trening,
nawyki i finanse. Używa też z telefonu (Telegram → mobile).

## Core requirements (static)
PIN login; 13 modułów; persystencja MongoDB + localStorage; eksport/import JSON; dark mode;
mobile-first; AI summary + diagnosta; Notion + Telegram (stałe podpięcie wg woli użytkownika).

## Implemented (2026-10-01)
- [x] PIN login (4444), ekran startowy z motto, grid/scanline aesthetic
- [x] Panel główny: zegar CET, KPI, alerty trading, projekty, skróty
- [x] Harmonogram dnia (killzony London/NY, 22:00 OFF) — CRUD
- [x] Zadania/To-do (P1-P3, projekty, terminy, widoki, filtr)
- [x] Nawyki (grid 7 dni, streak, %)
- [x] Finanse (tabela, bilans, pie chart kategorii)
- [x] Trading (dziennik, checklista A+ 12pkt, kalkulator pozycji, statystyki, alerty TV read-only)
- [x] Trening PPL + HIT 15-min timer + log
- [x] Plan żywieniowy (makro + lista zakupów)
- [x] ERROR444 muzyka (pipeline statusów)
- [x] Warsztat (AI diagnosta real Claude, historia napraw)
- [x] Baza wiedzy/notatki (tagi, wyszukiwarka)
- [x] Raporty (raport wieczorny + AI podsumowanie + wysyłka Telegram)
- [x] Ustawienia (motyw, zmiana PIN, eksport/import, reset, status integracji)
- Testing: backend 100%, frontend ~100% (AI render potwierdzony ręcznie).

## Backlog / remaining
- P1: Aktywacja Notion (NOTION_TOKEN + NOTION_DATA_SOURCE_ID) i Telegram (TELEGRAM_TOKEN + TELEGRAM_CHAT_ID) — wymaga tokenów od użytkownika.
- P2: Webhook TradingView → realne alerty (teraz seed/read-only). Powiadomienia zaplanowane (reminders).
- P2: Dwukierunkowy sync Notion (import + upsert), edycja projektów/alertów w UI.
- P3: Automatyczny tygodniowy przegląd, wykresy trendów (nawyki/finanse w czasie).

## Next tasks
1. Zebrać tokeny Notion/Telegram i aktywować integracje.
2. Webhook alertów TradingView.
3. Scheduler powiadomień.
