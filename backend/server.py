"""SYSTEM DRSN33 / NeuroHACKING 444 — backend.
Generyczne API kolekcji (bulk replace) + PIN + AI + Notion + Telegram.
Single-user, dane trwałe w MongoDB."""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Any, Dict, Optional
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="DRSN33 Command Center")
api = APIRouter(prefix="/api")

# Kolekcje dozwolone (bezpieczeństwo)
COLLECTIONS = {
    "tasks", "habits", "finance", "trades", "workouts", "songs", "notes",
    "reports", "alerts", "nutrition", "repairs", "schedule", "projects", "shopping",
}

# ---------- Modele ----------
class PinBody(BaseModel):
    pin: str

class PinSet(BaseModel):
    current: str
    new: str

class BulkBody(BaseModel):
    items: List[Dict[str, Any]]

class AIBody(BaseModel):
    context: Optional[Dict[str, Any]] = None
    prompt: Optional[str] = None

class TelegramBody(BaseModel):
    text: str

# ---------- Helpers ----------
async def get_settings() -> dict:
    s = await db.settings.find_one({"_id": "app"})
    if not s:
        s = {"_id": "app", "pin": os.environ.get("DEFAULT_PIN", "4444"),
             "theme": "dark", "accent": "dual", "telegram_enabled": False}
        await db.settings.insert_one(s)
    s.pop("_id", None)
    return s

# ---------- Auth (PIN) ----------
@api.get("/")
async def root():
    return {"system": "DRSN33 / NeuroHACKING 444", "status": "online"}

@api.post("/auth/verify")
async def verify_pin(body: PinBody):
    s = await get_settings()
    ok = body.pin == s.get("pin")
    return {"ok": ok}

@api.post("/auth/pin")
async def set_pin(body: PinSet):
    s = await get_settings()
    if body.current != s.get("pin"):
        raise HTTPException(400, "Niepoprawny obecny PIN")
    await db.settings.update_one({"_id": "app"}, {"$set": {"pin": body.new}}, upsert=True)
    return {"ok": True}

# ---------- Settings ----------
@api.get("/settings")
async def read_settings():
    s = await get_settings()
    s.pop("pin", None)  # nie zwracaj PIN
    s["pin_set"] = True
    return s

@api.put("/settings")
async def update_settings(body: Dict[str, Any]):
    body.pop("pin", None)
    body.pop("_id", None)
    await db.settings.update_one({"_id": "app"}, {"$set": body}, upsert=True)
    return await read_settings()

# ---------- Generyczne kolekcje ----------
def _check(col: str):
    if col not in COLLECTIONS:
        raise HTTPException(404, f"Nieznana kolekcja: {col}")

@api.get("/data/{col}")
async def get_data(col: str):
    _check(col)
    items = await db[col].find({}, {"_id": 0}).to_list(5000)
    return items

@api.put("/data/{col}")
async def put_data(col: str, body: BulkBody):
    _check(col)
    await db[col].delete_many({})
    if body.items:
        docs = [{**it} for it in body.items]
        await db[col].insert_many(docs)
    items = await db[col].find({}, {"_id": 0}).to_list(5000)
    return items

# ---------- Export / Import ----------
@api.get("/export")
async def export_all():
    out = {}
    for col in COLLECTIONS:
        out[col] = await db[col].find({}, {"_id": 0}).to_list(5000)
    s = await get_settings(); s.pop("pin", None)
    out["settings"] = s
    out["_exported"] = datetime.now(timezone.utc).isoformat()
    return out

@api.post("/import")
async def import_all(body: Dict[str, Any]):
    for col in COLLECTIONS:
        if col in body and isinstance(body[col], list):
            await db[col].delete_many({})
            if body[col]:
                await db[col].insert_many([{**x} for x in body[col]])
    return {"ok": True}

@api.post("/reset")
async def reset_all():
    for col in COLLECTIONS:
        await db[col].delete_many({})
    return {"ok": True}

# ---------- AI (Emergent LLM, Claude) ----------
async def _ai_call(system: str, user: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(500, "Brak EMERGENT_LLM_KEY")
    chat = LlmChat(api_key=key, session_id="drsn33", system_message=system).with_model("anthropic", "claude-sonnet-4-6")
    resp = await chat.send_message(UserMessage(text=user))
    return resp

@api.post("/ai/summary")
async def ai_summary(body: AIBody):
    ctx = body.context or {}
    import json
    user = ("Na podstawie tych danych z dashboardu wygeneruj zwięzłe, motywujące podsumowanie dnia "
            "po polsku (max 6 zdań). Wskaż priorytety, ostrzeżenia i pochwal postępy.\n\nDANE:\n"
            + json.dumps(ctx, ensure_ascii=False)[:6000])
    text = await _ai_call(
        "Jesteś asystentem produktywności w centrum dowodzenia DRSN33. Mówisz po polsku, konkretnie, z energią.",
        user)
    return {"text": text}

@api.post("/ai/diagnosta")
async def ai_diagnosta(body: AIBody):
    prompt = body.prompt or ""
    if not prompt.strip():
        raise HTTPException(400, "Brak opisu objawów")
    text = await _ai_call(
        ("Jesteś ekspertem mechanikiem i diagnostą samochodowym (OBD-II, elektryka, silniki). "
         "Odpowiadasz po polsku. Podaj: prawdopodobne przyczyny, kody błędów, kroki diagnostyczne i naprawę."),
        prompt)
    return {"text": text}

# ---------- Telegram ----------
@api.post("/telegram/send")
async def telegram_send(body: TelegramBody):
    token = os.environ.get("TELEGRAM_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise HTTPException(400, "Telegram nie skonfigurowany (brak TELEGRAM_TOKEN / TELEGRAM_CHAT_ID)")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(f"https://api.telegram.org/bot{token}/sendMessage",
                         json={"chat_id": chat_id, "text": body.text})
        if r.is_error:
            raise HTTPException(502, f"Telegram: {r.text[:200]}")
    return {"ok": True}

@api.get("/telegram/status")
async def telegram_status():
    return {"configured": bool(os.environ.get("TELEGRAM_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID"))}

# ---------- Notion ----------
@api.get("/notion/status")
async def notion_status():
    return {"configured": bool(os.environ.get("NOTION_TOKEN") and os.environ.get("NOTION_DATA_SOURCE_ID"))}

@api.post("/notion/push/tasks")
async def notion_push_tasks():
    token = os.environ.get("NOTION_TOKEN"); dsid = os.environ.get("NOTION_DATA_SOURCE_ID")
    if not token or not dsid:
        raise HTTPException(400, "Notion nie skonfigurowany (brak NOTION_TOKEN / NOTION_DATA_SOURCE_ID)")
    ver = os.environ.get("NOTION_VERSION", "2025-09-03")
    headers = {"Authorization": f"Bearer {token}", "Notion-Version": ver, "Content-Type": "application/json"}
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(500)
    pushed = 0
    async with httpx.AsyncClient(timeout=20) as c:
        for t in tasks:
            props = {
                "Name": {"title": [{"text": {"content": str(t.get("text", ""))[:200]}}]},
                "Status": {"select": {"name": "Done" if t.get("status") == "done" else "Todo"}},
                "Dashboard ID": {"rich_text": [{"text": {"content": str(t.get("id", ""))}}]},
            }
            if t.get("due"):
                props["Due"] = {"date": {"start": t["due"]}}
            r = await c.post("https://api.notion.com/v1/pages", headers=headers,
                             json={"parent": {"data_source_id": dsid}, "properties": props})
            if not r.is_error:
                pushed += 1
    return {"ok": True, "pushed": pushed, "total": len(tasks)}

app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
