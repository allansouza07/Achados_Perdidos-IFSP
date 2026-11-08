document.addEventListener("DOMContentLoaded", async function () {
    "use strict";
    const API = String(window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app").replace(/\/$/, "");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const staticKey = params.get("static");
    const byId = name => document.getElementById(name);
    const errorBox = byId("mensagemErro");
    const mainCard = document.querySelector(".card-principal");
    const descriptionCard = document.querySelector(".card-descricao");
    const contactSection = document.querySelector(".contato");
    const ownerControls = byId("ownerControls");
    const toggleStatusButton = byId("toggleStatusButton");
    const deleteObjectButton = byId("deleteObjectButton");
    const ownerMessage = byId("ownerMessage");
    let loadedObject = null;
    let currentStatus = "ATIVO";
    let currentUser = null;

    try { currentUser = JSON.parse(sessionStorage.getItem("usuarioAchadosPerdidos") || "null"); }
    catch (_) { currentUser = null; }
    const currentUserId = currentUser && Number(currentUser.IDUSUARIO ?? currentUser.id_usuario ?? currentUser.id);

    const staticObjects = {
        "estojo-azul": { name: "Estojo azul", image: "img/estojo_azul.png", local: "Biblioteca", date: "07/10/2026", user: "@GU3079689", description: "Estojo azul encontrado na biblioteca." },
        "garrafa-preta": { name: "Garrafa preta", image: "img/garrafa_preta.png", local: "Sala F1", date: "06/10/2026", user: "@GU3079689", description: "Garrafa preta encontrada na sala F1." },
        "fone-jbl": { name: "Fone de ouvido JBL", image: "img/fone_jbl.png", local: "Laboratório de Informática", date: "05/10/2026", user: "@3079689", description: "Fone de ouvido JBL encontrado no laboratório." },
        "mochila-preta": { name: "Mochila preta", image: "img/bolsa_preta.png", local: "Pátio", date: "04/10/2026", user: "@GU304521", description: "Mochila preta encontrada no pátio." },
        "blusa-azul": { name: "Blusa azul", image: "img/blusa_azul.png", local: "Cantina", date: "03/10/2026", user: "@GU302145", description: "Blusa azul encontrada na cantina." },
        "iphone-15": { name: "Iphone 15", image: "img/iphone.png", local: "Biblioteca", date: "02/10/2026", user: "@GU301782", description: "Iphone 15 encontrado na biblioteca." }
    };

    function showError(message) {
        if (mainCard) mainCard.hidden = true;
        if (descriptionCard) descriptionCard.hidden = true;
        if (contactSection) contactSection.hidden = true;
        if (ownerControls) ownerControls.hidden = true;
        if (errorBox) {
            errorBox.hidden = false;
            const text = Array.from(errorBox.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (text) text.textContent = message + " ";
            else errorBox.prepend(document.createTextNode(message + " "));
        }
        console.error("[Detalhes do objeto] " + message);
    }

    function formatDate(value) {
        if (!value) return "Não informada";
        const text = String(value);
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return match[3] + "/" + match[2] + "/" + match[1];
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleDateString("pt-BR");
    }

    function displayImage(url, name) {
        const image = byId("imagemObjeto");
        if (!image || !url) return;
        image.onerror = () => { image.hidden = true; image.alt = "Foto do objeto não disponível"; };
        image.alt = "Foto de " + name;
        image.src = url;
        image.hidden = false;
    }

    function disableWhatsApp() {
        const button = byId("botaoWhatsApp");
        if (!button) return;
        button.removeAttribute("href");
        button.classList.add("desabilitado");
        button.setAttribute("aria-disabled", "true");
    }

    function displayStaticObject(item) {
        displayImage(item.image, item.name);
        byId("nomeObjeto").textContent = item.name;
        byId("localObjeto").textContent = item.local;
        byId("dataObjeto").textContent = item.date;
        byId("usuarioObjeto").textContent = item.user;
        byId("descricaoObjeto").textContent = item.description;
        byId("textoStatus").textContent = "Encontrado";
        byId("statusObjeto").classList.remove("indisponivel");
        disableWhatsApp();
        document.title = item.name + " | Achados e Perdidos IFSP";
    }

    function displayDatabaseObject(obj) {
        loadedObject = obj;
        const name = obj.NOME_OBJETO || obj.nome_objeto || obj.nome || "Objeto sem nome";
        const local = obj.NOME_LOCAL || obj.nome_local || obj.local || "Local não informado";
        const date = formatDate(obj.DATA_OCORRENCIA || obj.DATA_CADASTRO || obj.data_ocorrencia);
        const user = obj.NOME_USUARIO || obj.nome_usuario || obj.usuario || "Usuário do IFSP";
        const description = obj.DESCRICAO || obj.descricao || "Sem descrição informada.";
        currentStatus = String(obj.STATUS || obj.status || "ATIVO").toUpperCase();
        const status = currentStatus === "RESOLVIDO" ? "Resolvido" : currentStatus === "CANCELADO" ? "Cancelado" : currentStatus === "ATIVO" ? "Encontrado" : currentStatus;
        byId("nomeObjeto").textContent = name;
        byId("localObjeto").textContent = local;
        byId("dataObjeto").textContent = date;
        byId("usuarioObjeto").textContent = user;
        byId("descricaoObjeto").textContent = description;
        byId("textoStatus").textContent = status;
        byId("statusObjeto").classList.toggle("indisponivel", currentStatus !== "ATIVO");

        const image = byId("imagemObjeto");
        const photoUrl = obj.foto_url || obj.FOTO_URL || obj.fotoUrl;
        if (photoUrl) displayImage(photoUrl, name);
        else { image.removeAttribute("src"); image.alt = "Foto do objeto não disponível"; image.hidden = true; }

        const button = byId("botaoWhatsApp");
        const phone = String(obj.TELEFONE || obj.telefone || "").replace(/\D/g, "");
        if (phone && currentStatus === "ATIVO") {
            button.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent('Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "' + name + '".');
            button.classList.remove("desabilitado");
            button.removeAttribute("aria-disabled");
        } else disableWhatsApp();

        // Exibição do botão é somente conveniência; cada endpoint verifica o autor no banco.
        const ownerId = Number(obj.ID_USUARIO ?? obj.id_usuario);
        if (ownerControls && currentUserId && ownerId === currentUserId) {
            ownerControls.hidden = false;
            toggleStatusButton.textContent = currentStatus === "ATIVO" ? "Marcar como resolvido" : "Reativar objeto";
        }
        document.title = name + " | Achados e Perdidos IFSP";
    }

    async function ownerRequest(url, method, payload) {
        [toggleStatusButton, deleteObjectButton].filter(Boolean).forEach(button => { button.disabled = true; });
        if (ownerMessage) { ownerMessage.textContent = "Processando..."; ownerMessage.classList.remove("error"); }
        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                cache: "no-store"
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.erro || result.mensagem || "Não foi possível concluir a ação.");
            return result;
        } finally {
            [toggleStatusButton, deleteObjectButton].filter(Boolean).forEach(button => { button.disabled = false; });
        }
    }

    toggleStatusButton?.addEventListener("click", async () => {
        if (!loadedObject || !currentUserId) {
            if (ownerMessage) { ownerMessage.textContent = "Identifique-se novamente para gerenciar seu objeto."; ownerMessage.classList.add("error"); }
            return;
        }
        const nextStatus = currentStatus === "ATIVO" ? "RESOLVIDO" : "ATIVO";
        try {
            await ownerRequest(API + "/api/objetos/" + encodeURIComponent(id) + "/status", "PATCH", { id_usuario: currentUserId, status: nextStatus });
            currentStatus = nextStatus;
            byId("textoStatus").textContent = nextStatus === "ATIVO" ? "Encontrado" : "Resolvido";
            byId("statusObjeto").classList.toggle("indisponivel", nextStatus !== "ATIVO");
            toggleStatusButton.textContent = nextStatus === "ATIVO" ? "Marcar como resolvido" : "Reativar objeto";
            const phone = String(loadedObject.TELEFONE || loadedObject.telefone || "").replace(/\D/g, "");
            const contact = byId("botaoWhatsApp");
            if (nextStatus === "ATIVO" && phone) {
                contact.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent('Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "' + (loadedObject.NOME_OBJETO || "objeto") + '".');
                contact.classList.remove("desabilitado"); contact.removeAttribute("aria-disabled");
            } else disableWhatsApp();
            if (ownerMessage) { ownerMessage.textContent = "Status atualizado com sucesso."; ownerMessage.classList.remove("error"); }
        } catch (error) {
            if (ownerMessage) { ownerMessage.textContent = error.message; ownerMessage.classList.add("error"); }
        }
    });

    deleteObjectButton?.addEventListener("click", async () => {
        if (!loadedObject || !currentUserId) return;
        const name = loadedObject.NOME_OBJETO || loadedObject.nome_objeto || "este objeto";
        if (!window.confirm('Tem certeza de que deseja excluir "' + name + '"? Essa ação não pode ser desfeita.')) return;
        try {
            await ownerRequest(API + "/api/objetos/" + encodeURIComponent(id), "DELETE", { id_usuario: currentUserId });
            window.location.replace("../todos_objetos/todos_objetos.html?excluido=1");
        } catch (error) {
            if (ownerMessage) { ownerMessage.textContent = error.message; ownerMessage.classList.add("error"); }
            else window.alert(error.message);
        }
    });

    if (staticKey) {
        const item = staticObjects[staticKey];
        if (!item) { showError("Objeto demonstrativo não encontrado."); return; }
        displayStaticObject(item);
        return;
    }
    if (!id || !/^\d+$/.test(id)) {
        showError("Identificador do objeto inválido ou ausente. Volte à lista e selecione o objeto novamente.");
        return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(API + "/api/objetos/" + encodeURIComponent(id), { cache: "no-store", signal: controller.signal });
        if (response.status === 404) { showError("O objeto solicitado não foi encontrado no banco de dados."); return; }
        if (!response.ok) throw new Error("A API respondeu HTTP " + response.status);
        const obj = await response.json();
        const returnedId = obj.IDOBJETO !== undefined ? obj.IDOBJETO : (obj.id_objeto !== undefined ? obj.id_objeto : obj.id);
        if (returnedId === undefined || String(returnedId) !== String(id)) throw new Error("O ID retornado pela API não corresponde ao objeto selecionado.");
        displayDatabaseObject(obj);
    } catch (error) {
        console.error("Erro ao carregar detalhes do objeto:", error);
        if (error.name === "AbortError") showError("O servidor demorou para responder. Verifique se o backend do Railway está ativo e tente novamente.");
        else showError("Não foi possível carregar os detalhes do objeto. Verifique a conexão com o servidor e tente novamente.");
    } finally { window.clearTimeout(timeout); }
});
