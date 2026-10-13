def error_response(message, status=400):
    return {"erro": message}, status

def not_found_response(resource="Registro"):
    return {"erro": f"{resource} não encontrado."}, 404
