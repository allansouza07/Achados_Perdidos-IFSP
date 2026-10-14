document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const locationFilter = document.getElementById("locationFilter");
    const grid = document.getElementById("objectsGrid");
    const resultCount = document.getElementById("resultCount");
    const noResults = document.getElementById("noResults");
    const STORAGE_KEY = "achadosPerdidos_objetosCadastrados";

    const normalize = value => (value || "").toLocaleLowerCase("pt-BR");
    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));

    function categoryKey(value) {
        const text = normalize(value).replaceAll("_", "-");
        if (text.includes("vestu")) return "vestuario";
        if (text.includes("eletr")) return "eletronico";
        if (text.includes("pessoal") || text.includes("estojo") || text.includes("garrafa") || text.includes("mochila")) return "item-pessoal";
        return text;
    }
    function locationKey(value) {
        const text = normalize(value);
        if (text.includes("biblioteca")) return "biblioteca";
        if (text.includes("sala")) return "sala";
        if (text.includes("laborat")) return "laboratorio";
        if (text.includes("pátio") || text.includes("patio")) return "patio";
        if (text.includes("cantina")) return "cantina";
        if (text.includes("quadra")) return "quadra";
        if (text.includes("corredor")) return "corredor";
        return text;
    }
    function readObjects() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.error("Não foi possível ler os objetos cadastrados.", error);
            return [];
        }
    }

    function renderLocalObjects() {
        grid.querySelectorAll("[data-user-created='true']").forEach(card => card.remove());
        readObjects().forEach(obj => {
            const card = document.createElement("article");
            card.className = "object-card";
            card.dataset.userCreated = "true";
            card.dataset.name = normalize(obj.nome);
            card.dataset.category = categoryKey(obj.categoriaLabel || obj.categoria);
            card.dataset.location = locationKey(obj.localLabel || obj.local);

            const safeImage = typeof obj.imagem === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(obj.imagem) ? obj.imagem : "";
            const photoMarkup = safeImage
                ? `<img class="imagem" src="${safeImage}" alt="Foto de ${escapeHTML(obj.nome)}" loading="lazy">`
                : `<div class="imagem sem-imagem" role="img" aria-label="Foto não enviada">📦</div>`;
            const date = obj.data ? obj.data.split("-").reverse().join("/") : "Não informada";

            card.innerHTML = `
                <div class="image-container">
                    ${photoMarkup}
                    <span class="status">${escapeHTML(obj.status || "Disponível")}</span>
                </div>
                <div class="object-content">
                    <h2>${escapeHTML(obj.nome)}</h2>
                    <p><strong>📅</strong> ${escapeHTML(date)}</p>
                    <p><strong>📍</strong> ${escapeHTML(obj.localLabel || obj.local)}</p>
                    <p><strong>👤</strong> Publicado por: ${escapeHTML(obj.usuario || "Usuário do IFSP")}</p>
                    <a href="./detalhes_objetos.html?id=${encodeURIComponent(obj.id)}" class="cartao">Ver detalhes →</a>
                </div>`;
            grid.prepend(card);
        });
    }

    function filterObjects() {
        const search = normalize(searchInput.value.trim());
        const category = categoryFilter.value;
        const location = locationFilter.value;
        const cards = [...grid.querySelectorAll(".object-card")];
        let count = 0;

        cards.forEach(card => {
            const name = normalize(card.dataset.name);
            const fullText = normalize(card.textContent);
            const matchesSearch = name.includes(search) || fullText.includes(search);
            const matchesCategory = category === "todos" || card.dataset.category === category;
            const matchesLocation = location === "todos" || card.dataset.location === location;
            card.hidden = !(matchesSearch && matchesCategory && matchesLocation);
            if (!card.hidden) count++;
        });

        resultCount.textContent = `${count} objeto${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"}`;
        noResults.style.display = count === 0 ? "block" : "none";
    }

    searchInput.addEventListener("input", filterObjects);
    categoryFilter.addEventListener("change", filterObjects);
    locationFilter.addEventListener("change", filterObjects);

    const initialSearch = new URLSearchParams(window.location.search).get("busca");
    if (initialSearch) searchInput.value = initialSearch;

    renderLocalObjects();
    filterObjects();
});
