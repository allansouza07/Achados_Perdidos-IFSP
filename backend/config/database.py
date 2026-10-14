import os
from pathlib import Path

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Carrega o .env dentro de backend, mesmo se o servidor for iniciado de outra pasta.
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def get_connection():
    """Abre uma nova conexão com o MySQL."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ACHADOS_E_PERDIDOS"),
        connection_timeout=8,
    )


def test_connection():
    connection = None
    try:
        connection = get_connection()
        if connection.is_connected():
            print("MySQL conectado com sucesso!")
            return True
        return False
    except Error as error:
        print(f"Erro na conexão com MySQL: {error}")
        return False
    finally:
        if connection and connection.is_connected():
            connection.close()
