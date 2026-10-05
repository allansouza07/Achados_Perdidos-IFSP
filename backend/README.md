# Backend — Achados e Perdidos IFSP

API REST em Flask + MySQL.

## Instalação

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copie `.env.example` para `.env` e configure o MySQL.

## Execução

```bash
python app.py
```

API: `http://127.0.0.1:5000`

## Endpoints

- GET `/api/health`
- GET `/api/health/database`
- GET/POST `/api/usuarios`
- GET `/api/usuarios/<id>`
- GET/POST `/api/categorias`
- GET/POST `/api/locais`
- GET/POST `/api/objetos`
- GET `/api/objetos/<id>`
- GET/POST `/api/ocorrencias`
- GET `/api/ocorrencias/<id>`
- PATCH `/api/ocorrencias/<id>/status`
- GET `/api/ocorrencias/relatorio/ativos`
