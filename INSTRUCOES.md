# Integração do cadastro com Flask + MySQL

Este pacote contém os arquivos de integração. Copie-os para os mesmos caminhos no projeto.

## 1. Arquivos
- `backend/config/database.py`: conexão MySQL corrigida.
- `backend/routes/usuarios.py`: endpoint para cadastrar dados e foto.
- `backend/.env.example`: modelo de configuração.
- `frontend/js/script.js`: envia os dados do formulário para a API.
- `frontend/pagina_inicial/js/pagina_inicial.js`: mostra os dados recebidos.

## 2. Configure o ambiente
No terminal, entre na pasta `backend` e instale as dependências:

```bash
pip install -r requirements.txt
```

Copie `.env.example` para `.env` dentro de `backend/` e edite `DB_PASSWORD` com a senha local do MySQL. Não publique o `.env` no GitHub.

Confirme que o banco `ACHADOS_E_PERDIDOS` e a tabela `USUARIO` existem com as colunas:
- `IDUSUARIO` (chave primária auto incremento)
- `MATRICULA`
- `NOME_USUARIO`
- `FOTO` (VARCHAR, para guardar o nome do arquivo)
- `TELEFONE`

A tabela precisa permitir que `FOTO` armazene um nome de arquivo, por exemplo `ab12cd34.jpg`. A foto binária fica na pasta `backend/uploads/usuarios/`, e o banco guarda apenas o nome do arquivo.

Se a coluna `FOTO` ainda não for VARCHAR(255), ajuste-a conforme seu esquema. Não execute `CREATE TABLE` sem antes conferir sua tabela atual.

## 3. Inicie a API
Com o MySQL ativo:

```bash
cd backend
python app.py
```

Teste no navegador:
- `http://127.0.0.1:5000/api/health`
- `http://127.0.0.1:5000/api/health/database`

O segundo deve retornar `{"status":"ok","database":"connected"}`.

## 4. Teste o fluxo
Abra a página de identificação usando o servidor Live Server (ou outro servidor local) e preencha todos os campos. O navegador enviará os dados a `POST http://127.0.0.1:5000/api/usuarios/identificar`. Se salvar com sucesso, abrirá a página inicial. Matrícula duplicada retorna mensagem de erro.

## Importante
- O endereço `127.0.0.1` funciona quando front e backend estão no seu próprio computador. Se hospedar o site, será necessário trocar esse endereço pela URL pública da API.
- Não abra a página pelo endereço `file://`; use Live Server ou um servidor HTTP.
- O armazenamento das fotos é local em `backend/uploads/usuarios/`; para produção/hospedagem, use armazenamento persistente.
- Esta integração não foi executada contra o seu banco real. Caso o schema tenha nomes/tipos diferentes, a API informará erro no terminal.
