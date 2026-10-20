document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    const API = String(window.ACHADOS_API_URL ||
        "https://achadosperdidos-ifsp-production.up.railway.app").replace(/\/$/, "");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const staticKey = params.get("static");
    const byId = function (name) { return document.getElementById(name); };

    const errorBox = byId("mensagemErro");
    const mainCard = document.querySelector(".card-principal");
    const descriptionCard = document.querySelector(".card-descricao");
    const contactSection = document.querySelector(".contato");

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
        if (errorBox) {
            errorBox.hidden = false;
            const textNode = Array.from(errorBox.childNodes).find(function (node) { return node.nodeType === Node.TEXT_NODE; });
            if (textNode) textNode.textContent = message + " ";
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
        image.onerror = function () { image.hidden = true; image.alt = "Foto do objeto não disponível"; };
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
        const name = obj.NOME_OBJETO || obj.nome_objeto || obj.nome || "Objeto sem nome";
        const local = obj.NOME_LOCAL || obj.nome_local || obj.local || "Local não informado";
        const date = formatDate(obj.DATA_OCORRENCIA || obj.DATA_CADASTRO || obj.data_ocorrencia);
        const user = obj.NOME_USUARIO || obj.nome_usuario || obj.usuario || "Usuário do IFSP";
        const description = obj.DESCRICAO || obj.descricao || "Sem descrição informada.";
        const statusRaw = String(obj.STATUS || obj.status || "ATIVO").toUpperCase();
        const status = ["RESOLVIDO", "RESOLVIDA"].includes(statusRaw) ? "Resolvido" : (statusRaw === "PERDIDO" ? "Perdido" : "Encontrado");

        byId("nomeObjeto").textContent = name;
        byId("localObjeto").textContent = local;
        byId("dataObjeto").textContent = date;
        byId("usuarioObjeto").textContent = user;
        byId("descricaoObjeto").textContent = description;
        byId("textoStatus").textContent = status;
        byId("statusObjeto").classList.toggle("indisponivel", status === "Resolvido");

        const photoUrl = obj.foto_url || obj.FOTO_URL || obj.fotoUrl;
        const image = byId("imagemObjeto");
        if (photoUrl) displayImage(photoUrl, name);
        else {
            image.removeAttribute("src");
            image.alt = "Foto do objeto não disponível";
            image.hidden = true;
        }

        const button = byId("botaoWhatsApp");
        const phone = String(obj.TELEFONE || obj.telefone || "").replace(/\D/g, "");
        if (phone && status !== "Resolvido") {
            const message = encodeURIComponent('Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "' + name + '".');
            button.href = "https://wa.me/" + phone + "?text=" + message;
            button.classList.remove("desabilitado");
            button.removeAttribute("aria-disabled");
        } else disableWhatsApp();
        document.title = name + " | Achados e Perdidos IFSP";
    }

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
    const timeout = window.setTimeout(function () { controller.abort(); }, 15000);
    try {
        const response = await fetch(API + "/api/objetos/" + encodeURIComponent(id), {
            cache: "no-store", signal: controller.signal
        });
        if (response.status === 404) { showError("O objeto solicitado não foi encontrado no banco de dados."); return; }
        if (!response.ok) throw new Error("A API respondeu HTTP " + response.status);
        const obj = await response.json();
        const returnedId = obj.IDOBJETO !== undefined ? obj.IDOBJETO : (obj.id_objeto !== undefined ? obj.id_objeto : obj.id);
        if (returnedId === undefined || String(returnedId) !== String(id)) {
            throw new Error("O ID retornado pela API não corresponde ao objeto selecionado.");
        }
        displayDatabaseObject(obj);
    } catch (error) {
        console.error("Erro ao carregar detalhes do objeto:", error);
        if (error.name === "AbortError") showError("O servidor demorou para responder. Verifique se o backend do Railway está ativo e tente novamente.");
        else showError("Não foi possível carregar os detalhes do objeto. Verifique a conexão com o servidor e tente novamente.");
    } finally {
        window.clearTimeout(timeout);
    }
});
