from flask import Blueprint, request
from config.database import get_connection
from utils.responses import error_response, not_found_response

usuarios_bp = Blueprint("usuarios", __name__)

@usuarios_bp.get("")
def listar_usuarios():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT IDUSUARIO, MATRICULA, NOME_USUARIO, FOTO, TELEFONE FROM USUARIO ORDER BY NOME_USUARIO")
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200

@usuarios_bp.get("/<int:id_usuario>")
def buscar_usuario(id_usuario):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT IDUSUARIO, MATRICULA, NOME_USUARIO, FOTO, TELEFONE FROM USUARIO WHERE IDUSUARIO = %s", (id_usuario,))
    usuario = cursor.fetchone()
    cursor.close(); conn.close()
    if not usuario:
        return not_found_response("Usuário")
    return usuario, 200

@usuarios_bp.post("")
def criar_usuario():
    data = request.get_json(silent=True) or {}
    if not data.get("matricula") or not data.get("nome_usuario"):
        return error_response("matricula e nome_usuario são obrigatórios.")
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO USUARIO (MATRICULA, NOME_USUARIO, FOTO, TELEFONE) VALUES (%s, %s, %s, %s)",
            (data["matricula"], data["nome_usuario"], data.get("foto"), data.get("telefone"))
        )
        conn.commit()
        return {"mensagem": "Usuário criado.", "id": cursor.lastrowid}, 201
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()
