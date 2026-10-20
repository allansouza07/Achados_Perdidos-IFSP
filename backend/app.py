
import os

from flask import Flask, send_from_directory, abort
from flask_cors import CORS

from config.database import test_connection
from routes.usuarios import usuarios_bp
from routes.objetos import objetos_bp


# Raiz do repositório, um nível acima da pasta backend
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)


def create_app():
    app = Flask(__name__)
    

    app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024

    CORS(app)

    # API de usuários
    app.register_blueprint(
        usuarios_bp,
        url_prefix="/api/usuarios"
    )
    app.register_blueprint(objetos_bp, url_prefix="/api/objetos")

    # Teste da API
    @app.get("/api/health")
    def health():
        return {
            "status": "ok",
            "service": "Achados e Perdidos API"
        }, 200

    # Teste da conexão com o banco
    @app.get("/api/health/database")
    def database_health():
        if test_connection():
            return {
                "status": "ok",
                "database": "connected"
            }, 200

        return {
            "status": "error",
            "database": "unavailable"
        }, 503

    # Página inicial
    @app.get("/")
    def index():
        return send_from_directory(
            PROJECT_ROOT,
            "index.html"
        )

    # Arquivos do frontend e imagens
    @app.get("/<path:filename>")
    def frontend_files(filename):
        if not (
            filename.startswith("frontend/")
            or filename.startswith("img/")
        ):
            abort(404)

        file_path = os.path.join(PROJECT_ROOT, filename)

        if not os.path.isfile(file_path):
            abort(404)

        return send_from_directory(
            PROJECT_ROOT,
            filename
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
