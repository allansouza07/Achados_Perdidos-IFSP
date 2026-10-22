document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    const API = String(window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app").replace(/\/$/, "");
    const grid = document.getElementById("recentObjectsGrid");
    const moreCard = grid ? grid.querySelector(".more-card") : null;

    let user = null;
    try {
        const rawUser = sessionStorage.getItem("usuarioAchadosPerdidos");
        user = rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        console.error("Não foi possível recuperar os dados do usuário.", error);
    }

    const nome = user && (user.nome || user.NOME_USUARIO) ? (user.nome || user.NOME_USUARIO) : "Visitante";
    const profileName = document.getElementById("profileName");
    const profilePhoto = document.getElementById("profilePhoto");
    const profileMatricula = document.getElementById("profileMatricula");
    const welcomeTitle = document.getElementById("welcomeTitle");

    if (profileName) profileName.textContent = nome;
    if (welcomeTitle) welcomeTitle.textContent = "Olá, " + nome + "!";
    if (profileMatricula) {
        profileMatricula.textContent = user && user.matricula ? "Matrícula: " + user.matricula : "";
        profileMatricula.hidden = !(user && user.matricula);
    }
    if (profilePhoto && user && user.foto) {
        profilePhoto.src = user.foto;
        profilePhoto.alt = "Foto de " + nome;
        profilePhoto.classList.add("user-photo");
    }

    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    function pesquisar() {
        const termo = searchInput ? searchInput.value.trim() : "";
        const destino = "../todos_objetos/todos_objetos.html";
        window.location.href = termo ? destino + "?busca=" + encodeURIComponent(termo) : destino;
    }
    if (searchBtn) searchBtn.addEventListener("click", pesquisar);
    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") pesquisar();
        });
    }

    if (!grid) return;

    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    function formatDate(value) {
        if (!value) return "Data não informada";
        const text = String(value);
        const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return iso[3] + "/" + iso[2] + "/" + iso[1];
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleDateString("pt-BR");
    }

    function createObjectCard(obj) {
        const id = obj.IDOBJETO ?? obj.id_objeto ?? obj.id;
        const title = obj.NOME_OBJETO ?? obj.nome_objeto ?? obj.nome ?? "Objeto sem nome";
        const location = obj.NOME_LOCAL ?? obj.nome_local ?? obj.local ?? "Local não informado";
        const userName = obj.NOME_USUARIO ?? obj.nome_usuario ?? obj.usuario ?? "Usuário do IFSP";
        const rawDate = obj.DATA_OCORRENCIA ?? obj.DATA_CADASTRO ?? obj.data_ocorrencia ?? obj.data;
        const imageUrl = obj.foto_url ?? obj.FOTO_URL ?? obj.fotoUrl ?? "";
        const card = document.createElement("article");
        card.className = "object-card";

        const imageMarkup = imageUrl
            ? '<img class="imagem" src="' + escapeHtml(imageUrl) + '" alt="Foto de ' + escapeHtml(title) + '" loading="lazy">'
            : '<div class="imagem sem-imagem" role="img" aria-label="Foto não disponível">📦</div>';

        card.innerHTML = imageMarkup +
            '<h3>' + escapeHtml(title) + '</h3>' +
            '<p>▣ &nbsp;' + escapeHtml(formatDate(rawDate)) + '</p>' +
            '<p>⌖ &nbsp;' + escapeHtml(location) + '</p>' +
            '<p>👤 &nbsp;Publicado por: ' + escapeHtml(userName) + '</p>' +
            '<a href="../todos_objetos/detalhes_objetos.html?id=' + encodeURIComponent(id ?? "") + '" class="cartao">Ver detalhes →</a>';

        const image = card.querySelector("img.imagem");
        if (image) image.addEventListener("error", function () {
            const placeholder = document.createElement("div");
            placeholder.className = "imagem sem-imagem";
            placeholder.setAttribute("role", "img");
            placeholder.setAttribute("aria-label", "Foto não disponível");
            placeholder.textContent = "📦";
            image.replaceWith(placeholder);
        }, { once: true });
        return card;
    }

    try {
        const response = await fetch(API + "/api/objetos", { cache: "no-store" });
        if (!response.ok) throw new Error("A API respondeu HTTP " + response.status);
        const result = await response.json();
        if (!Array.isArray(result.dados)) throw new Error("A API não retornou uma lista válida de objetos.");

        // O endpoint já entrega os cadastros mais recentes primeiro.
        // A vitrine mostra somente objetos ativos e preserva exatamente 3 cards + botão.
        const recent = result.dados
            .filter(obj => String(obj.STATUS ?? obj.status ?? "ATIVO").toUpperCase() === "ATIVO")
            .slice(0, 3);
        grid.replaceChildren();
        recent.forEach(obj => grid.appendChild(createObjectCard(obj)));

        if (recent.length === 0) {
            const empty = document.createElement("p");
            empty.className = "objects-empty";
            empty.textContent = "Ainda não há objetos ativos cadastrados. Quando alguém cadastrar um objeto, ele aparecerá aqui.";
            grid.appendChild(empty);
        }
        if (moreCard) grid.appendChild(moreCard);
    } catch (error) {
        console.error("Não foi possível carregar os objetos recentes:", error);
        grid.replaceChildren();
        const message = document.createElement("p");
        message.className = "objects-empty";
        message.textContent = "Não foi possível carregar os objetos agora. Acesse “Ver todos” para consultar a lista completa.";
        grid.appendChild(message);
        if (moreCard) grid.appendChild(moreCard);
    } finally {
        grid.setAttribute("aria-busy", "false");
    }
});
