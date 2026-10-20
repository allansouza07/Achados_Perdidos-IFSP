/* Remove apenas os cartões solicitados, sem apagar registros do banco. Inclua este script nas páginas inicial e todos_objetos. */
(function () {
    "use strict";
    const blocked = ["Chave", "GARRAFA", "FONE DE OUVIDO", "CAMISETA PRETA"];
    function normalize(text) {
        return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    }
    function removeBlockedCards() {
        const cards = document.querySelectorAll(".object-card, article");
        cards.forEach(function (card) {
            if (card.closest("header, footer, nav")) return;
            const title = card.querySelector("h1, h2, h3, h4, .object-title, [data-name]");
            const name = normalize((title && (title.textContent || title.getAttribute("data-name"))) || card.getAttribute("data-name") || "");
            const matches = blocked.some(function (term) {
                const target = normalize(term);
                return name === target || name.startsWith(target + " ") || name.includes(target);
            });
            if (matches) card.remove();
        });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
    function start() {
        removeBlockedCards();
        const observer = new MutationObserver(removeBlockedCards);
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
