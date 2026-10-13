from flask import Blueprint, request
from config.database import get_connection
from utils.responses import error_response

locais_bp = Blueprint("locais", __name__)

@locais_bp.get("")
def listar_locais():
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM LOCAL ORDER BY NOME_LOCAL")
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200

@locais_bp.post("")
def criar_local():
    data = request.get_json(silent=True) or {}
    if not data.get("nome_local"):
        return error_response("nome_local é obrigatório.")
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO LOCAL (NOME_LOCAL, DESCRICAO) VALUES (%s, %s)",
            (data["nome_local"], data.get("descricao"))
        )
        conn.commit()
        return {"mensagem": "Local criado.", "id": cursor.lastrowid}, 201
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()
