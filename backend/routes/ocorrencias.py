from flask import Blueprint, request
from config.database import get_connection
from utils.responses import error_response, not_found_response

ocorrencias_bp = Blueprint("ocorrencias", __name__)

BASE_SELECT = """
SELECT OC.IDOCORRENCIA, OC.TIPO, OC.DATA_OCORRENCIA, OC.DESCRICAO, OC.STATUS,
       U.IDUSUARIO, U.MATRICULA, U.NOME_USUARIO, U.TELEFONE,
       O.IDOBJETO, O.NOME_OBJETO, O.DESCRICAO AS DESCRICAO_OBJETO,
       C.IDCATEGORIA, C.NOME_CATEGORIA,
       L.IDLOCAL, L.NOME_LOCAL
FROM OCORRENCIA OC
INNER JOIN USUARIO U ON U.IDUSUARIO = OC.ID_USUARIO
INNER JOIN OBJETO O ON O.IDOBJETO = OC.ID_OBJETO
INNER JOIN CATEGORIA C ON C.IDCATEGORIA = O.ID_CATEGORIA
INNER JOIN LOCAL L ON L.IDLOCAL = OC.ID_LOCAL
"""

@ocorrencias_bp.get("")
def listar_ocorrencias():
    status = request.args.get("status")
    query = BASE_SELECT
    params = []
    if status:
        query += " WHERE OC.STATUS = %s"
        params.append(status)
    query += " ORDER BY OC.DATA_OCORRENCIA DESC"
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute(query, tuple(params))
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200

@ocorrencias_bp.get("/<int:id_ocorrencia>")
def buscar_ocorrencia(id_ocorrencia):
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute(BASE_SELECT + " WHERE OC.IDOCORRENCIA = %s", (id_ocorrencia,))
    ocorrencia = cursor.fetchone()
    cursor.close(); conn.close()
    if not ocorrencia:
        return not_found_response("Ocorrência")
    return ocorrencia, 200

@ocorrencias_bp.post("")
def criar_ocorrencia():
    data = request.get_json(silent=True) or {}
    obrigatorios = ["tipo", "data_ocorrencia", "status", "id_usuario", "id_objeto", "id_local"]
    if any(data.get(campo) in (None, "") for campo in obrigatorios):
        return error_response("Todos os campos obrigatórios devem ser informados.")
    if data["tipo"] not in ("PERDIDO", "ENCONTRADO"):
        return error_response("tipo deve ser PERDIDO ou ENCONTRADO.")
    if data["status"] not in ("ATIVO", "RESOLVIDO", "CANCELADO"):
        return error_response("status inválido.")

    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO OCORRENCIA
            (TIPO, DATA_OCORRENCIA, DESCRICAO, STATUS, ID_USUARIO, ID_OBJETO, ID_LOCAL)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data["tipo"], data["data_ocorrencia"], data.get("descricao"),
               data["status"], data["id_usuario"], data["id_objeto"], data["id_local"]))
        conn.commit()
        return {"mensagem": "Ocorrência criada.", "id": cursor.lastrowid}, 201
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()

@ocorrencias_bp.patch("/<int:id_ocorrencia>/status")
def atualizar_status(id_ocorrencia):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("ATIVO", "RESOLVIDO", "CANCELADO"):
        return error_response("status inválido.")
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("UPDATE OCORRENCIA SET STATUS = %s WHERE IDOCORRENCIA = %s", (status, id_ocorrencia))
        if cursor.rowcount == 0:
            return not_found_response("Ocorrência")
        conn.commit()
        return {"mensagem": "Status atualizado."}, 200
    except Exception as exc:
        conn.rollback()
        return error_response(str(exc), 409)
    finally:
        cursor.close(); conn.close()

@ocorrencias_bp.get("/relatorio/ativos")
def ocorrencias_ativas():
    conn = get_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM VW_DADOS_ATIVOS ORDER BY DATA_OCORRENCIA DESC")
    dados = cursor.fetchall()
    cursor.close(); conn.close()
    return {"dados": dados}, 200
