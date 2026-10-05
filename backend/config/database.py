import mysql.connector
from mysql.connector import Error


import os
from dotenv import load_dotenv

load_dotenv()

connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
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
        print("Erro na conexão:", error)
        return False

    finally:

        if connection and connection.is_connected():
            connection.close()