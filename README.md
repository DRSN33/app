# DRSN33 / NeuroHACKING 444

## Uruchomienie lokalne

Wymagania: Python 3.10+, Node.js 18+, Yarn oraz działający MongoDB (lokalny albo MongoDB Atlas).

### 1. Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
# .venv\\Scripts\\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
# Windows: copy .env.example .env
# Uzupełnij MONGO_URL i DB_NAME w pliku .env.
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Backend będzie dostępny pod `http://127.0.0.1:8000`, a API pod `http://127.0.0.1:8000/api`.

### 2. Frontend

W drugim terminalu:

```bash
cd frontend
cp .env.example .env
# Windows: copy .env.example .env
yarn install
yarn start
```

Frontend będzie dostępny pod `http://localhost:3000`.

Po zmianie `frontend/.env` uruchom frontend ponownie, ponieważ Vite wstawia zmienne podczas startu/builda.

## Konfiguracja MongoDB

Dla lokalnego MongoDB pozostaw:

```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=drsn33
```

Dla MongoDB Atlas wpisz pełny connection string w `MONGO_URL` i dodaj adres klienta do Network Access w Atlasie.

`EMERGENT_LLM_KEY`, Telegram i Notion są opcjonalne. Bez `EMERGENT_LLM_KEY` aplikacja wystartuje, ale endpointy AI oraz upload/download plików będą zwracały czytelny status niedostępności.

## Szybki test

Po uruchomieniu backendu otwórz:

```text
http://127.0.0.1:8000/api/
```

Powinien pojawić się status `online`.
