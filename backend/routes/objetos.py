from flask import Blueprint, request
from config.database import get_connection
from utils.responses import error_response, not_found_response

objetos_bp = Blueprint("objetos", __name__)

@objetos_bp.get("")
def listar_objetos():
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT O.IDOBJETO, O.NOME_OBJETO, O.DESCRICAO, O.DATA_CADASTRO,
               C.IDCATEGORIA, C.NOME_CATEGORIA
        FROM OBJETO O
        INNER JOIN CATEGORIA C ON C.IDCATEGORIA = O.ID_CATEGORIA
        ORDER BY O.DATA_CADASTRO DESC, O.NOME_OBJETO
    """)
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200

@objetos_bp.get("/<int:id_objeto>")
def buscar_objeto(id_objeto):
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT O.IDOBJETO, O.NOME_OBJETO, O.DESCRICAO, O.DATA_CADASTRO,
               C.IDCATEGORIA, C.NOME_CATEGORIA
        FROM OBJETO O
        INNER JOIN CATEGORIA C ON C.IDCATEGORIA = O.ID_CATEGORIA
        WHERE O.IDOBJETO = %s
    """, (id_objeto,))
    objeto = cursor.fetchone()
    cursor.close(); conn.close()
    if not objeto:
        return not_found_response("Objeto")
    return objeto, 200

@objetos_bp.post("")
def criar_objeto():
    data = request.get_json(silent=True) or {}
    if not data.get("nome_objeto") or not data.get("id_categoria"):
        return error_response("nome_objeto e id_categoria são obrigatórios.")
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO OBJETO (NOME_OBJETO, DESCRICAO, DATA_CADASTRO, ID_CATEGORIA)
            VALUES (%s, %s, COALESCE(%s, NOW()), %s)
        """, (data["nome_objeto"], data.get("descricao"), data.get("data_cadastro"), data["id_categoria"]))
        conn.commit()
        return {"mensagem": "Objeto criado.", "id": cursor.lastrowid}, 201
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()
