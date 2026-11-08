from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path.cwd()
BACKUP_DIR = ROOT / f"backup_modo_admin_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def replace_once(relative_path, old, new):
    path = ROOT / relative_path
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {relative_path}")
    content = path.read_text(encoding="utf-8")
    if new in content:
        return  # Esta etapa já foi aplicada anteriormente.
    count = content.count(old)
    if count != 1:
        raise RuntimeError(
            f"Não foi possível atualizar {relative_path}: "
            f"esperava encontrar o trecho uma vez, encontrei {count}. "
            "Nenhuma alteração adicional foi aplicada nesta etapa."
        )
    backup = BACKUP_DIR / relative_path
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(content.replace(old, new, 1), encoding="utf-8")

def replace_all_fields(relative_path, old, new):
    path = ROOT / relative_path
    content = path.read_text(encoding="utf-8")
    if old not in content:
        return
    backup = BACKUP_DIR / relative_path
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(content.replace(old, new), encoding="utf-8")

def append_once(relative_path, marker, addition):
    path = ROOT / relative_path
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {relative_path}")
    content = path.read_text(encoding="utf-8")
    if marker in content:
        return
    backup = BACKUP_DIR / relative_path
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(content.rstrip() + "\n" + addition + "\n", encoding="utf-8")

# 1) Login no backend: reconhece a matrícula administrativa configurada no Railway
replace_once(
    "backend/routes/usuarios.py",
    "import binascii\nimport re\n",
    "import binascii\nimport os\nimport re\n"
)
replace_once(
    "backend/routes/usuarios.py",
    "from mysql.connector import Error, IntegrityError\n",
    "from mysql.connector import Error, IntegrityError\nfrom itsdangerous import URLSafeTimedSerializer\n"
)
replace_once(
    "backend/routes/usuarios.py",
    '    foto_data = data.get("foto")\n\n    if not matricula or not nome or not telefone:\n',
    '    foto_data = data.get("foto")\n\n'
    '    admin_matricula = os.getenv("ADMIN_MATRICULA", "").strip().upper()\n'
    '    is_admin = bool(admin_matricula and matricula == admin_matricula)\n'
    '    admin_secret = os.getenv("ADMIN_SESSION_SECRET", "").strip()\n'
    '    if is_admin and not admin_secret:\n'
    '        return error_response("Acesso administrativo não configurado no servidor.", 503)\n\n'
    '    if not matricula or not nome or not telefone:\n'
)
replace_once(
    "backend/routes/usuarios.py",
    '    if not re.fullmatch(r"[A-Z0-9]{9}", matricula):\n'
    '        return error_response("A matrícula deve conter 9 letras ou números.")\n',
    '    if not is_admin and not re.fullmatch(r"[A-Z0-9]{9}", matricula):\n'
    '        return error_response("A matrícula deve conter 9 caracteres alfanuméricos, exceto a matrícula administrativa configurada.")\n'
)
replace_once(
    "backend/routes/usuarios.py",
    '        return {\n'
    '            "mensagem": mensagem,\n'
    '            "usuario": {\n',
    '        admin_token = None\n'
    '        if is_admin:\n'
    '            serializer = URLSafeTimedSerializer(\n'
    '                admin_secret, salt="achados-ifsp-admin"\n'
    '            )\n'
    '            admin_token = serializer.dumps({\n'
    '                "user_id": int(id_usuario),\n'
    '                "role": "admin",\n'
    '            })\n\n'
    '        return {\n'
    '            "mensagem": mensagem,\n'
    '            "usuario": {\n'
)
# Os dois caminhos (atualização e cadastro novo) retornam a foto.
# Inclui os campos administrativos em todas as respostas de usuário.
replace_all_fields(
    "backend/routes/usuarios.py",
    '                "FOTO": filename,\n',
    '                "FOTO": filename,\n'
    '                "is_admin": is_admin,\n'
    '                "admin_token": admin_token,\n'
)

# No caminho de cadastro novo, o token precisa ser criado com o ID recém-gerado.
replace_once(
    "backend/routes/usuarios.py",
    '        conn.commit()\n'
    '        user_id = cursor.lastrowid\n'
    '        return {\n'
    '            "mensagem": "Cadastro realizado com sucesso.",\n',
    '        conn.commit()\n'
    '        user_id = cursor.lastrowid\n'
    '        admin_token = None\n'
    '        if is_admin:\n'
    '            serializer = URLSafeTimedSerializer(\n'
    '                admin_secret, salt="achados-ifsp-admin"\n'
    '            )\n'
    '            admin_token = serializer.dumps({\n'
    '                "user_id": int(user_id),\n'
    '                "role": "admin",\n'
    '            })\n'
    '        return {\n'
    '            "mensagem": "Cadastro realizado com sucesso.",\n'
)

# 2) Autorização real no backend dos objetos
replace_once(
    "backend/routes/objetos.py",
    "import binascii\nimport re\n",
    "import binascii\nimport os\nimport re\n"
)
replace_once(
    "backend/routes/objetos.py",
    "from mysql.connector import Error\n",
    "from mysql.connector import Error\nfrom itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer\n"
)
replace_once(
    "backend/routes/objetos.py",
    '\n\ndef delete_uploaded_file(filename):\n',
    '\n\ndef is_admin_request(data, id_usuario):\n'
    '    """Valida o token administrativo assinado pelo backend (12 horas)."""\n'
    '    token = str(data.get("admin_token", "")).strip()\n'
    '    secret = os.getenv("ADMIN_SESSION_SECRET", "").strip()\n'
    '    if not token or not secret:\n'
    '        return False\n'
    '    serializer = URLSafeTimedSerializer(secret, salt="achados-ifsp-admin")\n'
    '    try:\n'
    '        payload = serializer.loads(token, max_age=43200)\n'
    '    except (BadSignature, SignatureExpired, TypeError, ValueError):\n'
    '        return False\n'
    '    return (\n'
    '        payload.get("role") == "admin"\n'
    '        and str(payload.get("user_id")) == str(id_usuario)\n'
    '    )\n'
    '\n'
    'def delete_uploaded_file(filename):\n'
)
replace_once(
    "backend/routes/objetos.py",
    '        if int(row["ID_USUARIO"]) != id_usuario:\n'
    '            return error_response("Somente quem cadastrou este objeto pode alterar seu status.", 403)\n'
    '        cursor.execute(\n'
    '            "UPDATE OCORRENCIA SET STATUS = %s WHERE IDOCORRENCIA = %s AND ID_USUARIO = %s",\n'
    '            (status, row["IDOCORRENCIA"], id_usuario),\n'
    '        )\n',
    '        is_admin = is_admin_request(data, id_usuario)\n'
    '        if int(row["ID_USUARIO"]) != id_usuario and not is_admin:\n'
    '            return error_response("Somente quem cadastrou este objeto ou um administrador pode alterar seu status.", 403)\n'
    '        if is_admin:\n'
    '            cursor.execute(\n'
    '                "UPDATE OCORRENCIA SET STATUS = %s WHERE IDOCORRENCIA = %s",\n'
    '                (status, row["IDOCORRENCIA"]),\n'
    '            )\n'
    '        else:\n'
    '            cursor.execute(\n'
    '                "UPDATE OCORRENCIA SET STATUS = %s WHERE IDOCORRENCIA = %s AND ID_USUARIO = %s",\n'
    '                (status, row["IDOCORRENCIA"], id_usuario),\n'
    '            )\n'
)
replace_once(
    "backend/routes/objetos.py",
    '        if int(row["ID_USUARIO"]) != id_usuario:\n'
    '            return error_response("Somente quem cadastrou este objeto pode excluí-lo.", 403)\n\n'
    '        image_filename = row.get("FOTO_OBJETO")\n'
    '        cursor.execute(\n'
    '            "DELETE FROM OCORRENCIA WHERE IDOCORRENCIA = %s AND ID_USUARIO = %s",\n'
    '            (row["IDOCORRENCIA"], id_usuario),\n'
    '        )\n',
    '        is_admin = is_admin_request(data, id_usuario)\n'
    '        if int(row["ID_USUARIO"]) != id_usuario and not is_admin:\n'
    '            return error_response("Somente quem cadastrou este objeto ou um administrador pode excluí-lo.", 403)\n\n'
    '        image_filename = row.get("FOTO_OBJETO")\n'
    '        if is_admin:\n'
    '            cursor.execute(\n'
    '                "DELETE FROM OCORRENCIA WHERE IDOCORRENCIA = %s",\n'
    '                (row["IDOCORRENCIA"],),\n'
    '            )\n'
    '        else:\n'
    '            cursor.execute(\n'
    '                "DELETE FROM OCORRENCIA WHERE IDOCORRENCIA = %s AND ID_USUARIO = %s",\n'
    '                (row["IDOCORRENCIA"], id_usuario),\n'
    '            )\n'
)

# 3) Formulário de login: permite digitar matrícula administrativa de 7 dígitos
replace_once(
    "frontend/js/script.js",
    '        if (!/^[A-Z0-9]{9}$/.test(matriculaValue)) {\n'
    '            matriculaError.textContent = "A matrícula deve conter 9 letras ou números.";\n',
    '        if (!/^(?:[A-Z0-9]{9}|\\d{7})$/.test(matriculaValue)) {\n'
    '            matriculaError.textContent = "Informe uma matrícula válida.";\n'
)
replace_once(
    "frontend/js/script.js",
    '                foto: savedUser.foto_url,\n'
    '                fotoNome: savedUser.FOTO\n',
    '                foto: savedUser.foto_url,\n'
    '                fotoNome: savedUser.FOTO,\n'
    '                is_admin: Boolean(savedUser.is_admin),\n'
    '                admin_token: savedUser.admin_token || null\n'
)

# 4) Página de listagem: banner e ações administrativas em cada card
replace_once(
    "frontend/todos_objetos/js/todos_objetos.js",
    '    const legacyCards = [...grid.querySelectorAll(".object-card")].map(card => card.cloneNode(true));\n\n',
    '    const legacyCards = [...grid.querySelectorAll(".object-card")].map(card => card.cloneNode(true));\n'
    '    let currentUser = null;\n'
    '    try { currentUser = JSON.parse(sessionStorage.getItem("usuarioAchadosPerdidos") || "null"); }\n'
    '    catch (_) { currentUser = null; }\n'
    '    const currentUserId = Number(currentUser?.IDUSUARIO ?? currentUser?.id_usuario ?? currentUser?.id);\n'
    '    const adminToken = currentUser?.admin_token || "";\n'
    '    const isAdmin = Boolean(currentUser?.is_admin && adminToken && currentUserId);\n'
    '    if (isAdmin) {\n'
    '        const header = document.querySelector(".page-header");\n'
    '        if (header) {\n'
    '            const banner = document.createElement("div");\n'
    '            banner.className = "admin-banner";\n'
    '            banner.textContent = "Modo administrador ativo — você pode gerenciar todos os objetos.";\n'
    '            header.appendChild(banner);\n'
    '        }\n'
    '    }\n\n'
    '    async function adminRequest(url, method, payload) {\n'
    '        const response = await fetch(url, {\n'
    '            method,\n'
    '            headers: { "Content-Type": "application/json" },\n'
    '            body: JSON.stringify({ ...payload, id_usuario: currentUserId, admin_token: adminToken }),\n'
    '            cache: "no-store"\n'
    '        });\n'
    '        const result = await response.json().catch(() => ({}));\n'
    '        if (!response.ok) throw new Error(result.erro || result.mensagem || "Não foi possível concluir a ação.");\n'
    '        return result;\n'
    '    }\n\n'
)
replace_once(
    "frontend/todos_objetos/js/todos_objetos.js",
    '            const img = card.querySelector("img.imagem"); if (img) addImageFallback(img, name); grid.appendChild(card);\n',
    '            const img = card.querySelector("img.imagem"); if (img) addImageFallback(img, name);\n'
    '            grid.appendChild(card);\n'
    '            if (isAdmin) {\n'
    '                const actions = document.createElement("div");\n'
    '                actions.className = "admin-actions";\n'
    '                const statusButton = document.createElement("button");\n'
    '                statusButton.type = "button";\n'
    '                statusButton.textContent = statusRaw === "ATIVO" ? "Marcar resolvido" : "Reativar";\n'
    '                const deleteButton = document.createElement("button");\n'
    '                deleteButton.type = "button";\n'
    '                deleteButton.className = "admin-delete";\n'
    '                deleteButton.textContent = "Excluir objeto";\n'
    '                statusButton.addEventListener("click", async () => {\n'
    '                    statusButton.disabled = deleteButton.disabled = true;\n'
    '                    try {\n'
    '                        await adminRequest(`${API}/api/objetos/${encodeURIComponent(id)}/status`, "PATCH", {\n'
    '                            status: statusRaw === "ATIVO" ? "RESOLVIDO" : "ATIVO"\n'
    '                        });\n'
    '                        window.location.reload();\n'
    '                    } catch (error) {\n'
    '                        window.alert(error.message);\n'
    '                        statusButton.disabled = deleteButton.disabled = false;\n'
    '                    }\n'
    '                });\n'
    '                deleteButton.addEventListener("click", async () => {\n'
    '                    if (!window.confirm(`Tem certeza de que deseja excluir "${name}"? Essa ação não pode ser desfeita.`)) return;\n'
    '                    statusButton.disabled = deleteButton.disabled = true;\n'
    '                    try {\n'
    '                        await adminRequest(`${API}/api/objetos/${encodeURIComponent(id)}`, "DELETE", {});\n'
    '                        card.remove();\n'
    '                        filter();\n'
    '                    } catch (error) {\n'
    '                        window.alert(error.message);\n'
    '                        statusButton.disabled = deleteButton.disabled = false;\n'
    '                    }\n'
    '                });\n'
    '                actions.append(statusButton, deleteButton);\n'
    '                card.querySelector(".object-content").appendChild(actions);\n'
    '            }\n'
)

# 5) Página de detalhes: o administrador também vê e usa os controles
replace_once(
    "frontend/todos_objetos/js/detalhes_objetos.js",
    '    const currentUserId = currentUser && Number(currentUser.IDUSUARIO ?? currentUser.id_usuario ?? currentUser.id);\n',
    '    const currentUserId = currentUser && Number(currentUser.IDUSUARIO ?? currentUser.id_usuario ?? currentUser.id);\n'
    '    const adminToken = currentUser?.admin_token || "";\n'
    '    const isAdmin = Boolean(currentUser?.is_admin && adminToken);\n'
)
replace_once(
    "frontend/todos_objetos/js/detalhes_objetos.js",
    '        if (ownerControls && currentUserId && ownerId === currentUserId) {\n',
    '        if (ownerControls && currentUserId && (ownerId === currentUserId || isAdmin)) {\n'
)
replace_once(
    "frontend/todos_objetos/js/detalhes_objetos.js",
    '                body: JSON.stringify(payload),\n',
    '                body: JSON.stringify({ ...payload, ...(isAdmin ? { admin_token: adminToken } : {}) }),\n'
)

# 6) Dependência explícita do token assinado
append_once(
    "backend/requirements.txt",
    "itsdangerous",
    "itsdangerous"
)

# 7) Estilos dos controles administrativos
append_once(
    "frontend/todos_objetos/css/todos_objetos.css",
    ".admin-banner",
    """
/* MODO ADMINISTRADOR */
.admin-banner {
    margin-top: 16px;
    padding: 12px 16px;
    border: 1px solid #b7e4c7;
    border-radius: 12px;
    background: #e8f8ec;
    color: #075f2b;
    font-size: 14px;
    font-weight: 700;
}
.admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 15px 15px;
}
.admin-actions button {
    flex: 1 1 120px;
    min-height: 38px;
    padding: 9px 12px;
    border-radius: 9px;
    background: #087b38;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
}
.admin-actions button.admin-delete {
    background: #b42318;
}
.admin-actions button:disabled {
    cursor: wait;
    opacity: .65;
}
"""
)

print("Modo administrador aplicado com sucesso.")
print(f"Backups originais salvos em: {BACKUP_DIR}")
print("Próximo passo: configurar ADMIN_MATRICULA e ADMIN_SESSION_SECRET no Railway.")
