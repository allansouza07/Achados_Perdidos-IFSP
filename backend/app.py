from flask import Flask
from flask_cors import CORS
from config.database import test_connection
from routes.usuarios import usuarios_bp
from routes.categorias import categorias_bp
from routes.locais import locais_bp
from routes.objetos import objetos_bp
from routes.ocorrencias import ocorrencias_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(usuarios_bp, url_prefix="/api/usuarios")
    app.register_blueprint(categorias_bp, url_prefix="/api/categorias")
    app.register_blueprint(locais_bp, url_prefix="/api/locais")
    app.register_blueprint(objetos_bp, url_prefix="/api/objetos")
    app.register_blueprint(ocorrencias_bp, url_prefix="/api/ocorrencias")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "Achados e Perdidos API"}, 200

    @app.get("/api/health/database")
    def database_health():
        if test_connection():
            return {"status": "ok", "database": "connected"}, 200
        return {"status": "error", "database": "unavailable"}, 503

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
