"""SYSTEM DRSN33 / NeuroHACKING 444 — backend.
Generyczne API kolekcji (bulk replace) + PIN + AI + Notion + Telegram.
Single-user, dane trwałe w MongoDB."""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query, Header
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, requests
from pathlib import Path
from pydantic import BaseModel
from typing import List, Any, Dict, Optional
from datetime import datetime, timezone
import httpx

# ========== ENV VALIDATION ==========
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_env(key: str, required: bool = False, default: str = None) -> str:
    """Bezpieczne pobieranie zmiennych środowiskowych z walidacją."""
    value = os.getenv(key, default)
    if required and not value:
        raise RuntimeError(
            f"❌ BRAKUJE ZMIENNEJ ŚRODOWISKOWEJ: {key}\n"
            f"   Dodaj ją do backend/.env lub ustaw w systemie.\n"
            f"   Przykład: {key}=value"
        )
    return value

# ========== OBOWIĄZKOWE ZMIENNE ==========
try:
    MONGO_URL = get_env("MONGO_URL", required=True)
    DB_NAME = get_env("DB_NAME", required=True)
except RuntimeError as e:
    print(str(e))
    raise

# ========== OPCJONALNE ZMIENNE ==========
DEFAULT_PIN = get_env("DEFAULT_PIN", default="4444")
EMERGENT_LLM_KEY = get_env("EMERGENT_LLM_KEY")
TELEGRAM_TOKEN = get_env("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = get_env("TELEGRAM_CHAT_ID")
NOTION_TOKEN = get_env("NOTION_TOKEN")
NOTION_DATA_SOURCE_ID = get_env("NOTION_DATA_SOURCE_ID")
INTEGRATION_PROXY_URL = get_env("INTEGRATION_PROXY_URL")
CORS_ORIGINS = get_env("CORS_ORIGINS", default="*")
NOTION_VERSION = get_env("NOTION_VERSION", default="2025-09-03")

# ========== INIT LOGGING ==========
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== MONGODB CONNECTION ==========
try:
    logger.info(f"🔗 Łączenie z MongoDB: {MONGO_URL[:50]}...")
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    logger.info(f"✅ MongoDB podłączono: {DB_NAME}")
except Exception as e:
    logger.error(f"❌ Nie udało się połączyć z MongoDB: {e}")
    raise RuntimeError(f"MongoDB connection failed: {e}")

# ---------- Object Storage (Emergent) ----------
STORAGE_BASE = (INTEGRATION_PROXY_URL or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "drsn33"
_storage_key = None
_storage_initialized = False

def init_storage(force: bool = False):
    """Inicjalizacja object storage. Nie wymagane dla podstawowego działania."""
    global _storage_key, _storage_initialized
    if _storage_key and not force:
        return _storage_key
    
    if not EMERGENT_LLM_KEY:
        logger.warning("⚠️  EMERGENT_LLM_KEY nie ustawiony — object storage niedostępny")
        _storage_initialized = False
        return None
    
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
        _storage_initialized = True
        logger.info("✅ Object storage initialized")
        return _storage_key
    except Exception as e:
        logger.error(f"❌ Storage init failed: {e}")
        _storage_initialized = False
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload obiektu do storage."""
    if not _storage_initialized:
        raise HTTPException(503, "Object storage nie jest dostępny")
    
    key = init_storage()
    if not key:
        raise HTTPException(503, "Brak storage key")
    
    try:
        r = requests.put(f"{STORAGE_URL}/objects/{path}",
                         headers={"X-Storage-Key": key, "Content-Type": content_type}, 
                         data=data, timeout=120)
        if r.status_code == 404:
            key = init_storage(force=True)
            if not key:
                raise HTTPException(503, "Storage reinitialization failed")
            r = requests.put(f"{STORAGE_URL}/objects/{path}",
                             headers={"X-Storage-Key": key, "Content-Type": content_type}, 
                             data=data, timeout=120)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        raise HTTPException(502, f"Storage upload failed: {str(e)[:100]}")

def get_object(path: str):
    """Download obiektu z storage."""
    if not _storage_initialized:
        raise HTTPException(503, "Object storage nie jest dostępny")
    
    key = init_storage()
    if not key:
        raise HTTPException(503, "Brak storage key")
    
    try:
        r = requests.get(f"{STORAGE_URL}/objects/{path}", 
                        headers={"X-Storage-Key": key}, timeout=60)
        if r.status_code == 404:
            key = init_storage(force=True)
            if not key:
                raise HTTPException(503, "Storage reinitialization failed")
            r = requests.get(f"{STORAGE_URL}/objects/{path}", 
                            headers={"X-Storage-Key": key}, timeout=60)
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "application/octet-stream")
    except requests.RequestException as e:
        raise HTTPException(502, f"Storage download failed: {str(e)[:100]}")

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
    """Pobierz settings z bazy, lub utwórz domyślne."""
    s = await db.settings.find_one({"_id": "app"})
    if not s:
        s = {
            "_id": "app", 
            "pin": DEFAULT_PIN,
            "theme": "dark", 
            "accent": "dual", 
            "telegram_enabled": False,
            "ai_provider": "anthropic", 
            "ai_model": "claude-sonnet-4-6"
        }
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
    s["features"] = {
        "storage": _storage_initialized,
        "telegram": bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID),
        "notion": bool(NOTION_TOKEN and NOTION_DATA_SOURCE_ID),
        "ai": bool(EMERGENT_LLM_KEY),
    }
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
    """Wywołaj AI — fallback jeśli brak klucza."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(
            503, 
            "AI niedostępny — EMERGENT_LLM_KEY nie ustawiony. Dodaj go do backend/.env"
        )
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except ImportError:
        raise HTTPException(
            502, 
            "Brakuje biblioteki emergentintegrations. Uruchom: pip install emergent-integrations"
        )
    
    try:
        s = await get_settings()
        provider = s.get("ai_provider", "anthropic")
        model = s.get("ai_model", "claude-sonnet-4-6")
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id="drsn33", system_message=system).with_model(provider, model)
        resp = await chat.send_message(UserMessage(text=user))
        return resp
    except Exception as e:
        logger.error(f"AI call failed: {e}")
        raise HTTPException(502, f"AI error: {str(e)[:100]}")

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
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        raise HTTPException(400, "Telegram nie skonfigurowany (brak TELEGRAM_TOKEN / TELEGRAM_CHAT_ID w .env)")
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                             json={"chat_id": TELEGRAM_CHAT_ID, "text": body.text})
            if r.is_error:
                raise HTTPException(502, f"Telegram: {r.text[:200]}")
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        raise HTTPException(502, f"Telegram error: {str(e)[:100]}")
    return {"ok": True}

@api.get("/telegram/status")
async def telegram_status():
    return {
        "configured": bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID),
        "token_set": bool(TELEGRAM_TOKEN),
        "chat_id_set": bool(TELEGRAM_CHAT_ID),
    }

# ---------- Notion ----------
@api.get("/notion/status")
async def notion_status():
    return {
        "configured": bool(NOTION_TOKEN and NOTION_DATA_SOURCE_ID),
        "token_set": bool(NOTION_TOKEN),
        "data_source_id_set": bool(NOTION_DATA_SOURCE_ID),
    }

@api.post("/notion/push/tasks")
async def notion_push_tasks():
    if not NOTION_TOKEN or not NOTION_DATA_SOURCE_ID:
        raise HTTPException(400, "Notion nie skonfigurowany (brak NOTION_TOKEN / NOTION_DATA_SOURCE_ID w .env)")
    
    try:
        headers = {
            "Authorization": f"Bearer {NOTION_TOKEN}", 
            "Notion-Version": NOTION_VERSION, 
            "Content-Type": "application/json"
        }
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
                                 json={"parent": {"data_source_id": NOTION_DATA_SOURCE_ID}, "properties": props})
                if not r.is_error:
                    pushed += 1
        return {"ok": True, "pushed": pushed, "total": len(tasks)}
    except Exception as e:
        logger.error(f"Notion push failed: {e}")
        raise HTTPException(502, f"Notion error: {str(e)[:100]}")

# ---------- Pliki / Media (Object Storage) ----------
@api.post("/upload")
async def upload_file(file: UploadFile = File(...), tag: str = Query("")):
    if not _storage_initialized:
        raise HTTPException(503, "Object storage nie jest dostępny — nie można uploadować plików")
    
    try:
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
        fid = str(uuid.uuid4())
        path = f"{APP_NAME}/uploads/{fid}.{ext}"
        data = await file.read()
        ct = file.content_type or "application/octet-stream"
        result = put_object(path, data, ct)
        
        doc = {
            "id": fid, 
            "storage_path": result["path"], 
            "original_filename": file.filename,
            "content_type": ct, 
            "size": result.get("size", len(data)), 
            "tag": tag,
            "is_deleted": False, 
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.files.insert_one(doc)
        doc.pop("_id", None)
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(502, f"Upload error: {str(e)[:100]}")

@api.get("/files")
async def list_files():
    try:
        return await db.files.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    except Exception as e:
        logger.error(f"List files failed: {e}")
        raise HTTPException(502, f"Error listing files: {str(e)[:100]}")

@api.get("/files/{fid}/download")
async def download_file(fid: str):
    try:
        rec = await db.files.find_one({"id": fid, "is_deleted": False})
        if not rec:
            raise HTTPException(404, "Plik nie znaleziony")
        data, ct = get_object(rec["storage_path"])
        return Response(content=data, media_type=rec.get("content_type", ct))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(502, f"Download error: {str(e)[:100]}")

@api.delete("/files/{fid}")
async def delete_file(fid: str):
    try:
        await db.files.update_one({"id": fid}, {"$set": {"is_deleted": True}})
        return {"ok": True}
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(502, f"Delete error: {str(e)[:100]}")

app.include_router(api)
app.add_middleware(
    CORSMiddleware, 
    allow_credentials=True,
    allow_origins=CORS_ORIGINS.split(','),
    allow_methods=["*"], 
    allow_headers=["*"],
)

# ---------- LIFESPAN EVENTS ----------
@app.on_event("startup")
async def _startup():
    """Bezpieczny startup — inicjalizacja opcjonalnych serwisów."""
    logger.info("=" * 60)
    logger.info("🚀 DRSN33 Command Center — STARTUP")
    logger.info("=" * 60)
    
    # Mandatory: MongoDB already validated
    logger.info("✅ MongoDB: OK")
    
    # Optional: Object Storage
    if EMERGENT_LLM_KEY:
        result = init_storage()
        if result:
            logger.info("✅ Object Storage: OK")
        else:
            logger.warning("⚠️  Object Storage: DISABLED (init failed)")
    else:
        logger.warning("⚠️  Object Storage: DISABLED (no EMERGENT_LLM_KEY)")
    
    # Optional: Telegram
    if TELEGRAM_TOKEN and TELEGRAM_CHAT_ID:
        logger.info("✅ Telegram: CONFIGURED")
    else:
        logger.warning("⚠️  Telegram: NOT CONFIGURED")
    
    # Optional: Notion
    if NOTION_TOKEN and NOTION_DATA_SOURCE_ID:
        logger.info("✅ Notion: CONFIGURED")
    else:
        logger.warning("⚠️  Notion: NOT CONFIGURED")
    
    # Optional: AI
    if EMERGENT_LLM_KEY:
        logger.info("✅ AI (Emergent LLM): ENABLED")
    else:
        logger.warning("⚠️  AI (Emergent LLM): DISABLED (no EMERGENT_LLM_KEY)")
    
    logger.info("=" * 60)
    logger.info("✅ Startup complete — API ready")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_db_client():
    """Zamknij połączenie z MongoDB."""
    try:
        client.close()
        logger.info("✅ MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB: {e}")
