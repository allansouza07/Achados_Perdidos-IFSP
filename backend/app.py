from flask import Flask
from flask_cors import CORS

from config.database import test_connection
from routes.usuarios import usuarios_bp


def create_app():

    app = Flask(__name__)


    # =========================================
    # CONFIGURAÇÕES
    # =========================================

    app.config["MAX_CONTENT_LENGTH"] = (
        6 * 1024 * 1024
    )


    CORS(app)


    # =========================================
    # USUÁRIOS
    # =========================================

    app.register_blueprint(
        usuarios_bp,
        url_prefix="/api/usuarios"
    )


    # =========================================
    # HEALTH
    # =========================================

    @app.get("/api/health")
    def health():

        return {
            "status": "ok",
            "service": "Achados e Perdidos API"
        }, 200


    # =========================================
    # HEALTH DATABASE
    # =========================================

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


    return app


app = create_app()


if __name__ == "__main__":

    app.run(
        debug=True
    )