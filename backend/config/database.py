import os

import mysql.connector

from mysql.connector import Error

from dotenv import load_dotenv


load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ACHADOS_E_PERDIDOS"),
    )


def test_connection():
    connection = None

    try:
        connection = get_connection()

        print("MySQL conectado com sucesso!")

        return connection.is_connected()

    except Error as e:
        print(f"ERRO AO CONECTAR AO MYSQL: {e}")

        return False

    finally:
        if connection and connection.is_connected():
            connection.close()