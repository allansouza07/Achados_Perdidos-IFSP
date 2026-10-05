import os
import uuid

from flask import Blueprint, request, current_app, send_from_directory
from werkzeug.utils import secure_filename

from config.database import get_connection


usuarios_bp = Blueprint("usuarios", __name__)


ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =========================================
# TESTE
# =========================================

@usuarios_bp.get("/teste")
def teste():

    return {
        "status": "ok",
        "mensagem": "Rota de usuários funcionando"
    }, 200


# =========================================
# CADASTRAR / ATUALIZAR USUÁRIO
# =========================================

@usuarios_bp.post("/identificar")
def identificar_usuario():

    # -------------------------------------
    # RECEBER DADOS
    # -------------------------------------

    nome = request.form.get("nome", "").strip()

    matricula = request.form.get(
        "matricula",
        ""
    ).strip().upper()

    telefone = request.form.get(
        "telefone",
        ""
    ).strip()

    foto = request.files.get("foto")


    # -------------------------------------
    # VALIDAÇÕES
    # -------------------------------------

    if not nome:

        return {
            "erro": "O nome é obrigatório."
        }, 400


    if len(nome) < 2:

        return {
            "erro": "Digite um nome válido."
        }, 400


    if not matricula:

        return {
            "erro": "A matrícula é obrigatória."
        }, 400


    if len(matricula) > 9:

        return {
            "erro": "A matrícula deve ter no máximo 9 caracteres."
        }, 400


    if not matricula.isalnum():

        return {
            "erro": "A matrícula deve conter apenas letras e números."
        }, 400


    if not telefone:

        return {
            "erro": "O telefone é obrigatório."
        }, 400


    if not foto:

        return {
            "erro": "A foto é obrigatória."
        }, 400


    if not allowed_file(foto.filename):

        return {
            "erro": "Formato de imagem inválido."
        }, 400


    # -------------------------------------
    # BANCO
    # -------------------------------------

    connection = get_connection()

    cursor = connection.cursor(
        dictionary=True
    )


    caminho_foto = None


    try:

        # ---------------------------------
        # PROCURAR MATRÍCULA
        # ---------------------------------

        cursor.execute(
            """
            SELECT
                IDUSUARIO,
                MATRICULA,
                NOME_USUARIO,
                FOTO,
                TELEFONE
            FROM USUARIO
            WHERE MATRICULA = %s
            """,
            (matricula,)
        )


        usuario = cursor.fetchone()


        # ---------------------------------
        # PASTA DE FOTOS
        # ---------------------------------

        pasta_upload = os.path.join(
            current_app.root_path,
            "uploads",
            "usuarios"
        )


        os.makedirs(
            pasta_upload,
            exist_ok=True
        )


        # ---------------------------------
        # NOME DO ARQUIVO
        # ---------------------------------

        extensao = foto.filename.rsplit(
            ".",
            1
        )[1].lower()


        if usuario:

            id_usuario = usuario["IDUSUARIO"]

        else:

            cursor.execute(
                """
                INSERT INTO USUARIO
                (
                    MATRICULA,
                    NOME_USUARIO,
                    FOTO,
                    TELEFONE
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    matricula,
                    nome,
                    None,
                    telefone
                )
            )


            id_usuario = cursor.lastrowid


        nome_arquivo = secure_filename(
            f"{id_usuario}_{uuid.uuid4().hex}.{extensao}"
        )


        caminho_completo = os.path.join(
            pasta_upload,
            nome_arquivo
        )


        # ---------------------------------
        # SALVAR FOTO
        # ---------------------------------

        foto.save(caminho_completo)


        caminho_foto = (
            f"uploads/usuarios/{nome_arquivo}"
        )


        # ---------------------------------
        # ATUALIZAR USUÁRIO
        # ---------------------------------

        if usuario:

            # Apagar foto antiga
            foto_antiga = usuario.get("FOTO")

            if foto_antiga:

                caminho_antigo = os.path.join(
                    current_app.root_path,
                    foto_antiga
                )

                if os.path.isfile(caminho_antigo):

                    os.remove(caminho_antigo)


            cursor.execute(
                """
                UPDATE USUARIO
                SET
                    NOME_USUARIO = %s,
                    TELEFONE = %s,
                    FOTO = %s
                WHERE IDUSUARIO = %s
                """,
                (
                    nome,
                    telefone,
                    caminho_foto,
                    id_usuario
                )
            )


            mensagem = "Usuário atualizado com sucesso."


        else:

            cursor.execute(
                """
                UPDATE USUARIO
                SET FOTO = %s
                WHERE IDUSUARIO = %s
                """,
                (
                    caminho_foto,
                    id_usuario
                )
            )


            mensagem = "Usuário cadastrado com sucesso."


        # ---------------------------------
        # COMMIT
        # ---------------------------------

        connection.commit()


        # ---------------------------------
        # RESPOSTA
        # ---------------------------------

        return {
            "mensagem": mensagem,

            "usuario": {
                "id": id_usuario,
                "nome": nome,
                "matricula": matricula,
                "telefone": telefone,
                "foto": caminho_foto
            }

        }, 200


    except Exception as error:

        connection.rollback()

        print(
            "Erro ao cadastrar usuário:",
            error
        )


        # Se salvou a foto mas deu erro
        # no banco, apagar a foto.

        if caminho_foto:

            caminho_erro = os.path.join(
                current_app.root_path,
                caminho_foto
            )

            if os.path.isfile(caminho_erro):

                os.remove(caminho_erro)


        return {
            "erro": str(error)
        }, 500


    finally:

        cursor.close()
        connection.close()


# =========================================
# VISUALIZAR FOTO
# =========================================

@usuarios_bp.get("/foto/<path:nome_arquivo>")
def visualizar_foto(nome_arquivo):

    pasta_upload = os.path.join(
        current_app.root_path,
        "uploads",
        "usuarios"
    )


    return send_from_directory(
        pasta_upload,
        nome_arquivo
    )