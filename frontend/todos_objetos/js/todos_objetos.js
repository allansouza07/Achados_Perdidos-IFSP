document.addEventListener("DOMContentLoaded", async () => {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const locationFilter = document.getElementById("locationFilter");
    const grid = document.getElementById("objectsGrid");
    const resultCount = document.getElementById("resultCount");
    const noResults = document.getElementById("noResults");
    const API = window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app";
    const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const categoryKey = value => {
        const v = normalize(value);
        if (v.includes("vestu")) return "vestuario";
        if (v.includes("eletr")) return "eletronico";
        if (v.includes("pessoal")) return "item-pessoal";
        return v;
    };
    const locationKey = value => {
        const v = normalize(value);
        if (v.includes("biblioteca")) return "biblioteca";
        if (v.includes("sala")) return "sala";
        if (v.includes("laborat")) return "laboratorio";
        if (v.includes("patio") || v.includes("playground")) return "patio";
        if (v.includes("cantina") || v.includes("refeitorio")) return "cantina";
        if (v.includes("quadra")) return "quadra";
        if (v.includes("corredor")) return "corredor";
        return v;
    };
    function render(items) {
        grid.replaceChildren();
        items.forEach(obj => {
            const card = document.createElement("article");
            card.className = "object-card";
            card.dataset.name = normalize(obj.NOME_OBJETO);
            card.dataset.category = categoryKey(obj.NOME_CATEGORIA);
            card.dataset.location = locationKey(obj.NOME_LOCAL);
            const image = obj.foto_url
                ? `<img class="imagem" src="${esc(obj.foto_url)}" alt="Foto de ${esc(obj.NOME_OBJETO)}" loading="lazy">`
                : `<div class="imagem sem-imagem" role="img" aria-label="Foto não disponível">📦</div>`;
            const rawDate = obj.DATA_OCORRENCIA || obj.DATA_CADASTRO;
            const date = rawDate ? new Date(rawDate).toLocaleDateString("pt-BR", {timeZone:"UTC"}) : "Data não informada";
            const status = obj.STATUS === "RESOLVIDO" ? "Resolvido" : "Encontrado";
            card.innerHTML = `<div class="image-container">${image}<span class="status">${status}</span></div>
              <div class="object-content"><h2>${esc(obj.NOME_OBJETO)}</h2>
              <p><strong>📅</strong> ${esc(date)}</p><p><strong>📍</strong> ${esc(obj.NOME_LOCAL || "Local não informado")}</p>
              <p><strong>👤</strong> Publicado por: ${esc(obj.NOME_USUARIO || "Usuário do IFSP")}</p>
              <a href="./detalhes_objetos.html?id=${encodeURIComponent(obj.IDOBJETO)}" class="cartao">Ver detalhes →</a></div>`;
            grid.appendChild(card);
        });
    }
    function filter() {
        const term = normalize(searchInput.value.trim());
        const category = categoryFilter.value;
        const location = locationFilter.value;
        let count = 0;
        grid.querySelectorAll(".object-card").forEach(card => {
            const match = normalize(card.textContent).includes(term)
                && (category === "todos" || card.dataset.category === category)
                && (location === "todos" || card.dataset.location === location);
            card.hidden = !match;
            if (match) count++;
        });
        resultCount.textContent = `${count} objeto${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"}`;
        noResults.style.display = count ? "none" : "block";
    }
    searchInput?.addEventListener("input", filter);
    categoryFilter?.addEventListener("change", filter);
    locationFilter?.addEventListener("change", filter);
    const initial = new URLSearchParams(location.search).get("busca");
    if (initial && searchInput) searchInput.value = initial;

    try {
        const response = await fetch(`${API}/api/objetos`, {cache: "no-store"});
        const result = await response.json();
        if (!response.ok) throw new Error(result.erro || "Não foi possível consultar o banco.");
        render(Array.isArray(result.dados) ? result.dados : []);
        filter();
    } catch (err) {
        console.error(err);
        grid.replaceChildren();
        resultCount.textContent = "Não foi possível carregar os objetos";
        noResults.style.display = "block";
        noResults.querySelector("h2").textContent = "Não foi possível carregar os objetos";
        noResults.querySelector("p").textContent = "Verifique se a API está disponível e tente novamente.";
    }
});
