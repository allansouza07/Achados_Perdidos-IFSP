import base64
import binascii
import re
import uuid
from pathlib import Path

from flask import Blueprint, current_app, request, send_from_directory, url_for
from mysql.connector import Error, IntegrityError

from config.database import get_connection
from utils.responses import error_response, not_found_response

usuarios_bp = Blueprint("usuarios", __name__)
BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads" / "usuarios"

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _serializar_usuario(usuario):
    if not usuario:
        return usuario
    foto = usuario.get("FOTO")
    usuario["foto_url"] = (
        url_for("usuarios.foto_usuario", nome_arquivo=foto, _external=True)
        if foto else None
    )
    return usuario


@usuarios_bp.get("")
def listar_usuarios():
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT IDUSUARIO, MATRICULA, NOME_USUARIO, FOTO, TELEFONE "
            "FROM USUARIO ORDER BY NOME_USUARIO"
        )
        return {"dados": [_serializar_usuario(item) for item in cursor.fetchall()]}, 200
    except Error:
        current_app.logger.exception("Falha ao listar usuários")
        return error_response("Não foi possível consultar os usuários.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@usuarios_bp.get("/<int:id_usuario>")
def buscar_usuario(id_usuario):
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT IDUSUARIO, MATRICULA, NOME_USUARIO, FOTO, TELEFONE "
            "FROM USUARIO WHERE IDUSUARIO = %s",
            (id_usuario,),
        )
        usuario = cursor.fetchone()
        if not usuario:
            return not_found_response("Usuário")
        return _serializar_usuario(usuario), 200
    except Error:
        current_app.logger.exception("Falha ao consultar usuário")
        return error_response("Não foi possível consultar o usuário.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@usuarios_bp.get("/foto/<path:nome_arquivo>")
def foto_usuario(nome_arquivo):
    # Evita que o nome recebido permita acessar arquivos fora da pasta de fotos.
    if Path(nome_arquivo).name != nome_arquivo:
        return not_found_response("Foto")
    return send_from_directory(UPLOAD_DIR, nome_arquivo)


@usuarios_bp.post("")
@usuarios_bp.post("/identificar")
def criar_usuario():
    data = request.get_json(silent=True) or {}
    matricula = str(data.get("matricula", "")).strip().upper()
    nome = str(data.get("nome_usuario", data.get("nome", ""))).strip()
    telefone = re.sub(r"\D", "", str(data.get("telefone", "")))
    foto_data = data.get("foto")

    if not matricula or not nome or not telefone:
        return error_response("Nome, matrícula e telefone são obrigatórios.")
    if len(nome) < 2 or len(nome) > 100:
        return error_response("O nome deve ter entre 2 e 100 caracteres.")
    if not re.fullmatch(r"[A-Z0-9]{9}", matricula):
        return error_response("A matrícula deve conter 9 letras ou números.")
    if len(telefone) not in (10, 11):
        return error_response("Informe um telefone válido com DDD.")
    if not isinstance(foto_data, str) or not foto_data:
        return error_response("Envie uma foto do usuário.")

    match = re.fullmatch(
        r"data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)",
        foto_data,
    )
    if not match:
        return error_response("A foto deve estar em JPG, PNG ou WEBP.")

    mime_type, encoded_image = match.groups()
    try:
        image_bytes = base64.b64decode(encoded_image, validate=True)
    except (binascii.Error, ValueError):
        return error_response("O arquivo de foto está inválido.")

    if not image_bytes or len(image_bytes) > 2 * 1024 * 1024:
        return error_response("A foto deve ter no máximo 2 MB.")

    signatures = {
        "image/jpeg": image_bytes.startswith(b"\xff\xd8\xff"),
        "image/png": image_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": (
            len(image_bytes) >= 12
            and image_bytes[:4] == b"RIFF"
            and image_bytes[8:12] == b"WEBP"
        ),
    }
    if not signatures.get(mime_type, False):
        return error_response("O conteúdo da foto não corresponde ao formato informado.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ALLOWED_IMAGE_TYPES[mime_type]}"
    photo_path = UPLOAD_DIR / filename
    conn = cursor = None

    try:
        photo_path.write_bytes(image_bytes)
        conn = get_connection()
        cursor = conn.cursor()

        # Verificação explícita, mesmo se a tabela ainda não tiver índice UNIQUE.
        cursor.execute(
            """
            SELECT IDUSUARIO, FOTO
            FROM USUARIO
            WHERE MATRICULA = %s
            """,
            (matricula,)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:
            id_usuario, foto_antiga = usuario_existente

            cursor.execute(
                """
                UPDATE USUARIO
                SET NOME_USUARIO = %s,
                    FOTO = %s,
                    TELEFONE = %s
                WHERE IDUSUARIO = %s
                """,
                (nome, filename, telefone, id_usuario),
            )

            conn.commit()

            # Apaga a foto antiga somente após atualizar o banco.
            if foto_antiga and foto_antiga != filename:
                caminho_antigo = UPLOAD_DIR / foto_antiga
                caminho_antigo.unlink(missing_ok=True)

            mensagem = "Usuário identificado e atualizado com sucesso."
            status_http = 200

        else:
            cursor.execute(
                """
                INSERT INTO USUARIO
                    (MATRICULA, NOME_USUARIO, FOTO, TELEFONE)
                VALUES (%s, %s, %s, %s)
                """,
                (matricula, nome, filename, telefone),
            )

            conn.commit()
            id_usuario = cursor.lastrowid

            mensagem = "Cadastro realizado com sucesso."
            status_http = 201

        return {
            "mensagem": mensagem,
            "usuario": {
                "IDUSUARIO": id_usuario,
                "MATRICULA": matricula,
                "NOME_USUARIO": nome,
                "TELEFONE": telefone,
                "FOTO": filename,
                "foto_url": url_for(
                    "usuarios.foto_usuario",
                    nome_arquivo=filename,
                    _external=True,
                ),
            },
        }, status_http

        cursor.execute(
            "INSERT INTO USUARIO (MATRICULA, NOME_USUARIO, FOTO, TELEFONE) "
            "VALUES (%s, %s, %s, %s)",
            (matricula, nome, filename, telefone),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {
            "mensagem": "Cadastro realizado com sucesso.",
            "usuario": {
                "IDUSUARIO": user_id,
                "MATRICULA": matricula,
                "NOME_USUARIO": nome,
                "TELEFONE": telefone,
                "FOTO": filename,
                "foto_url": url_for(
                    "usuarios.foto_usuario",
                    nome_arquivo=filename,
                    _external=True,
                ),
            },
        }, 201

    except IntegrityError:
        if conn:
            conn.rollback()
        photo_path.unlink(missing_ok=True)
        return error_response("Essa matrícula já está cadastrada.", 409)
    except Error:
        if conn:
            conn.rollback()
        photo_path.unlink(missing_ok=True)
        current_app.logger.exception("Falha ao salvar cadastro no MySQL")
        return error_response(
            "Não foi possível salvar o cadastro. Confira a conexão e a estrutura da tabela USUARIO.",
            500,
        )
    except OSError:
        photo_path.unlink(missing_ok=True)
        current_app.logger.exception("Falha ao armazenar a foto")
        return error_response("Não foi possível armazenar a foto.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
