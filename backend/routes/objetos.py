import base64
import binascii
import re
import uuid
from pathlib import Path

from flask import Blueprint, current_app, request, url_for, send_from_directory
from mysql.connector import Error

from config.database import get_connection
from utils.responses import error_response, not_found_response

objetos_bp = Blueprint("objetos", __name__)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads" / "objetos"
IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def base_query():
    return """
        SELECT O.IDOBJETO, O.NOME_OBJETO, O.DESCRICAO,
               O.DATA_CADASTRO, O.ID_CATEGORIA, C.NOME_CATEGORIA,
               O.FOTO_OBJETO, OC.IDOCORRENCIA, OC.TIPO,
               OC.DATA_OCORRENCIA, OC.STATUS, OC.ID_USUARIO,
               U.NOME_USUARIO, U.MATRICULA, U.TELEFONE, U.FOTO AS FOTO_USUARIO,
               L.IDLOCAL, L.NOME_LOCAL
        FROM OBJETO O
        JOIN CATEGORIA C ON C.IDCATEGORIA = O.ID_CATEGORIA
        LEFT JOIN OCORRENCIA OC ON OC.ID_OBJETO = O.IDOBJETO
        LEFT JOIN USUARIO U ON U.IDUSUARIO = OC.ID_USUARIO
        LEFT JOIN LOCAL L ON L.IDLOCAL = OC.ID_LOCAL
    """


def serialize(row):
    if not row:
        return row
    image = row.pop("FOTO_OBJETO", None)
    profile_image = row.pop("FOTO_USUARIO", None)
    row["foto_url"] = url_for("objetos.foto_objeto", nome_arquivo=image, _external=True) if image else None
    row["foto_usuario_url"] = url_for("usuarios.foto_usuario", nome_arquivo=profile_image, _external=True) if profile_image else None
    return row


@objetos_bp.get("")
def listar_objetos():
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(base_query() + " ORDER BY O.DATA_CADASTRO DESC, O.IDOBJETO DESC")
        return {"dados": [serialize(row) for row in cursor.fetchall()]}, 200
    except Error:
        current_app.logger.exception("Erro ao listar objetos")
        return error_response("Não foi possível carregar os objetos do banco.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@objetos_bp.get("/<int:id_objeto>")
def buscar_objeto(id_objeto):
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(base_query() + " WHERE O.IDOBJETO = %s", (id_objeto,))
        row = cursor.fetchone()
        if not row:
            return not_found_response("Objeto")
        return serialize(row), 200
    except Error:
        current_app.logger.exception("Erro ao consultar objeto")
        return error_response("Não foi possível consultar o objeto.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@objetos_bp.get("/foto/<path:nome_arquivo>")
def foto_objeto(nome_arquivo):
    if Path(nome_arquivo).name != nome_arquivo:
        return not_found_response("Foto")
    return send_from_directory(UPLOAD_DIR, nome_arquivo)


@objetos_bp.post("")
def criar_objeto():
    data = request.get_json(silent=True) or {}
    nome = str(data.get("nome_objeto", "")).strip()
    descricao = str(data.get("descricao", "")).strip()
    categoria = str(data.get("categoria", "")).strip()
    local = str(data.get("local", "")).strip()
    data_ocorrencia = str(data.get("data_ocorrencia", "")).strip()
    id_usuario = data.get("id_usuario")
    tipo = str(data.get("tipo", "ENCONTRADO")).upper()
    image_data = data.get("foto", "")

    if not all([nome, categoria, local, data_ocorrencia, id_usuario]):
        return error_response("Nome, categoria, local, data e usuário são obrigatórios.")
    if len(nome) > 30 or len(descricao) > 300:
        return error_response("O nome aceita até 30 caracteres e a descrição até 300.")
    if tipo not in ("PERDIDO", "ENCONTRADO"):
        return error_response("Tipo inválido.")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", data_ocorrencia):
        return error_response("Data inválida.")

    filename = None
    image_path = None
    if image_data:
        match = re.fullmatch(r"data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)", image_data)
        if not match:
            return error_response("A foto deve estar em JPG, PNG ou WEBP.")
        mime, encoded = match.groups()
        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError):
            return error_response("Arquivo de imagem inválido.")
        if not image_bytes or len(image_bytes) > 2 * 1024 * 1024:
            return error_response("A foto deve ter no máximo 2 MB.")
        valid_signature = {
            "image/jpeg": image_bytes.startswith(b"\xff\xd8\xff"),
            "image/png": image_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
            "image/webp": len(image_bytes) >= 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP",
        }[mime]
        if not valid_signature:
            return error_response("O conteúdo da imagem não corresponde ao formato.")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        filename = uuid.uuid4().hex + IMAGE_TYPES[mime]
        image_path = UPLOAD_DIR / filename
        try:
            image_path.write_bytes(image_bytes)
        except OSError:
            current_app.logger.exception("Falha ao gravar foto")
            return error_response("Não foi possível salvar a foto.", 500)

    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT IDUSUARIO FROM USUARIO WHERE IDUSUARIO = %s", (id_usuario,))
        if not cursor.fetchone():
            if image_path:
                image_path.unlink(missing_ok=True)
            return error_response("Usuário não cadastrado. Identifique-se novamente.", 401)

        category_aliases = {
            "VESTUARIO": "VESTUÁRIO",
            "ELETRONICO": "ELETRÔNICO",
            "ITEM_PESSOAL": "ITEM PESSOAL",
        }
        cursor.execute("SELECT IDCATEGORIA FROM CATEGORIA WHERE UPPER(NOME_CATEGORIA) = UPPER(%s)",
                       (category_aliases.get(categoria.upper(), categoria),))
        category_row = cursor.fetchone()
        if not category_row:
            if image_path:
                image_path.unlink(missing_ok=True)
            return error_response("Categoria não encontrada no banco.", 400)

        local_aliases = {
            "SALA_AULA": "SALA DE AULA PRÉDIO F",
            "LABORATORIO": "BIBLIOTECA",
            "PATIO": "PLAYGROUND",
            "OUTRO": "BIBLIOTECA",
        }
        cursor.execute("SELECT IDLOCAL FROM LOCAL WHERE UPPER(NOME_LOCAL) = UPPER(%s)",
                       (local_aliases.get(local.upper(), local),))
        local_row = cursor.fetchone()
        if not local_row:
            cursor.execute("INSERT INTO LOCAL (NOME_LOCAL, DESCRICAO) VALUES (%s, %s)",
                           (local[:30], "Local cadastrado no formulário de objeto"))
            id_local = cursor.lastrowid
        else:
            id_local = local_row[0]

        cursor.execute(
            """INSERT INTO OBJETO
               (NOME_OBJETO, DESCRICAO, DATA_CADASTRO, ID_CATEGORIA, FOTO_OBJETO)
               VALUES (%s, %s, %s, %s, %s)""",
            (nome, descricao, data_ocorrencia, category_row[0], filename),
        )
        id_objeto = cursor.lastrowid
        cursor.execute(
            """INSERT INTO OCORRENCIA
               (TIPO, DATA_OCORRENCIA, DESCRICAO, STATUS, ID_USUARIO, ID_OBJETO, ID_LOCAL)
               VALUES (%s, %s, %s, 'ATIVO', %s, %s, %s)""",
            (tipo, data_ocorrencia, descricao, id_usuario, id_objeto, id_local),
        )
        id_ocorrencia = cursor.lastrowid
        conn.commit()
        return {"mensagem": "Objeto salvo no banco de dados.", "id": id_objeto,
                "id_ocorrencia": id_ocorrencia}, 201
    except Error:
        if conn:
            conn.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        current_app.logger.exception("Falha ao salvar objeto")
        return error_response("Não foi possível salvar o objeto no banco.", 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
