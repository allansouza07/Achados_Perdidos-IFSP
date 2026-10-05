import mysql.connector
from mysql.connector import Error


def get_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1234",
            database="ACHADOS_E_PERDIDOS"
        )

        return connection

    except Error as error:
        print("Erro ao conectar ao MySQL:", error)
        raise


def test_connection():

    connection = None

    try:
        connection = get_connection()

        if connection.is_connected():
            print("MySQL conectado com sucesso!")
            return True

        return False

    except Error as error:
        print("Erro na conexão:", error)
        return False

    finally:

        if connection and connection.is_connected():
            connection.close()