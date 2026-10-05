from flask import Blueprint, request
from config.database import get_connection
from utils.responses import error_response

categorias_bp = Blueprint("categorias", __name__)

@categorias_bp.get("")
def listar_categorias():
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM CATEGORIA ORDER BY NOME_CATEGORIA")
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200

@categorias_bp.post("")
def criar_categoria():
    data = request.get_json(silent=True) or {}
    if not data.get("nome_categoria"):
        return error_response("nome_categoria é obrigatório.")
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO CATEGORIA (NOME_CATEGORIA, DESCRICAO) VALUES (%s, %s)",
            (data["nome_categoria"], data.get("descricao"))
        )
        conn.commit()
        return {"mensagem": "Categoria criada.", "id": cursor.lastrowid}, 201
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()
