document.addEventListener("DOMContentLoaded", async () => {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const locationFilter = document.getElementById("locationFilter");
    const grid = document.getElementById("objectsGrid");
    const resultCount = document.getElementById("resultCount");
    const noResults = document.getElementById("noResults");
    const API = (window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app").replace(/\/$/, "");
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

    // Guarda os cards originais para que não desapareçam se a API falhar.
    const legacyCards = [...grid.querySelectorAll(".object-card")].map(card => card.cloneNode(true));

    function addImageFallback(img, name) {
        const normalizedName = normalize(name);
        const fallbacks = [
            [["estojo"], "img/estojo_azul.png"],
            [["garrafa"], "img/garrafa_preta.png"],
            [["fone", "jbl"], "img/fone_jbl.png"],
            [["mochila", "bolsa"], "img/bolsa_preta.png"],
            [["blusa", "casaco"], "img/blusa_azul.png"],
            [["iphone", "celular", "samsung"], "img/iphone.png"]
        ];
        img.addEventListener("error", () => {
            const match = fallbacks.find(([terms]) => terms.some(term => normalizedName.includes(term)));
            if (match && !img.dataset.fallbackTried) {
                img.dataset.fallbackTried = "1";
                img.src = match[1];
                return;
            }
            const placeholder = document.createElement("div");
            placeholder.className = "imagem sem-imagem";
            placeholder.setAttribute("role", "img");
            placeholder.setAttribute("aria-label", "Foto não disponível");
            placeholder.textContent = "📦";
            img.replaceWith(placeholder);
        });
    }

    function render(items) {
        grid.replaceChildren();
        items.forEach(obj => {
            const id = obj.IDOBJETO ?? obj.id_objeto ?? obj.id;
            const name = obj.NOME_OBJETO ?? obj.nome ?? "Objeto sem nome";
            const category = obj.NOME_CATEGORIA ?? obj.categoria ?? "";
            const local = obj.NOME_LOCAL ?? obj.local ?? "Local não informado";
            const imgUrl = obj.foto_url || obj.FOTO_URL || "";
            const rawDate = obj.DATA_OCORRENCIA || obj.DATA_CADASTRO || obj.data;
            const date = rawDate ? new Date(rawDate).toLocaleDateString("pt-BR", {timeZone:"UTC"}) : "Data não informada";
            const statusRaw = String(obj.STATUS || obj.status || "ATIVO").toUpperCase();
            const status = ["RESOLVIDO", "RESOLVIDA"].includes(statusRaw) ? "Resolvido" : "Encontrado";
            const card = document.createElement("article");
            card.className = "object-card";
            card.dataset.name = normalize(name);
            card.dataset.category = categoryKey(category);
            card.dataset.location = locationKey(local);

            const image = imgUrl
                ? `<img class="imagem" src="${esc(imgUrl)}" alt="Foto de ${esc(name)}" loading="lazy">`
                : `<div class="imagem sem-imagem" role="img" aria-label="Foto não disponível">📦</div>`;
            card.innerHTML = `<div class="image-container">${image}<span class="status">${status}</span></div>
                <div class="object-content"><h2>${esc(name)}</h2>
                <p><strong>📅</strong> ${esc(date)}</p>
                <p><strong>📍</strong> ${esc(local)}</p>
                <p><strong>👤</strong> Publicado por: ${esc(obj.NOME_USUARIO || obj.usuario || "Usuário do IFSP")}</p>
                <a href="./detalhes_objetos.html?id=${encodeURIComponent(id)}" class="cartao">Ver detalhes →</a></div>`;

            const img = card.querySelector("img.imagem");
            if (img) addImageFallback(img, name);
            grid.appendChild(card);
        });

        // Acrescenta cards antigos que não existam na API, sem duplicar pelo nome.
        const apiNames = new Set(items.map(obj => normalize(obj.NOME_OBJETO ?? obj.nome)));
        legacyCards.forEach(card => {
            const name = normalize(card.dataset.name || card.querySelector("h2")?.textContent);
            if (name && !apiNames.has(name)) grid.appendChild(card);
        });
    }

    function filter() {
        const term = normalize(searchInput?.value.trim());
        const category = categoryFilter?.value || "todos";
        const local = locationFilter?.value || "todos";
        let count = 0;
        grid.querySelectorAll(".object-card").forEach(card => {
            const matches = normalize(card.textContent).includes(term)
                && (category === "todos" || card.dataset.category === category)
                && (local === "todos" || card.dataset.location === local);
            card.hidden = !matches;
            if (matches) count++;
        });
        if (resultCount) resultCount.textContent = `${count} objeto${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"}`;
        if (noResults) noResults.style.display = count ? "none" : "block";
    }

    searchInput?.addEventListener("input", filter);
    categoryFilter?.addEventListener("change", filter);
    locationFilter?.addEventListener("change", filter);
    const initial = new URLSearchParams(window.location.search).get("busca");
    if (initial && searchInput) searchInput.value = initial;

    try {
        const response = await fetch(`${API}/api/objetos`, {cache: "no-store"});
        if (!response.ok) throw new Error(`API respondeu HTTP ${response.status}`);
        const result = await response.json();
        if (!Array.isArray(result.dados)) throw new Error("A resposta da API não contém a lista de objetos.");
        render(result.dados);
    } catch (error) {
        console.error("Erro ao carregar objetos:", error);
        grid.replaceChildren(...legacyCards);
        if (resultCount) resultCount.textContent = "Exibindo objetos locais; não foi possível atualizar pela API";
        if (noResults) {
            noResults.style.display = legacyCards.length ? "none" : "block";
        }
    }
    filter();
});
