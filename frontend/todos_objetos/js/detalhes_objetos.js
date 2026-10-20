document.addEventListener("DOMContentLoaded", async () => {
    const API = (window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app").replace(/\/$/, "");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const byId = value => document.getElementById(value);
    const errorBox = byId("mensagemErro");
    const mainCard = document.querySelector(".card-principal");
    const descriptionCard = document.querySelector(".card-descricao");
    const contactSection = document.querySelector(".contato");

    function showError(message) {
        if (mainCard) mainCard.hidden = true;
        if (descriptionCard) descriptionCard.hidden = true;
        if (contactSection) contactSection.hidden = true;
        if (errorBox) {
            errorBox.hidden = false;
            errorBox.firstChild.textContent = message + " ";
        }
    }

    function formatDate(value) {
        if (!value) return "Não informada";
        const text = String(value);
        // Evita deslocamento de dia causado por conversão de fuso horário.
        const datePart = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (datePart) return `${datePart[3]}/${datePart[2]}/${datePart[1]}`;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleDateString("pt-BR");
    }

    if (!id || !/^\d+$/.test(id)) {
        showError("Identificador do objeto inválido ou ausente.");
        return;
    }

    try {
        // O ID da URL é usado diretamente no endpoint; não há lista fixa nem escolha aleatória.
        const response = await fetch(`${API}/api/objetos/${encodeURIComponent(id)}`, {cache: "no-store"});
        if (response.status === 404) {
            showError("O objeto solicitado não foi encontrado no banco de dados.");
            return;
        }
        if (!response.ok) throw new Error(`A API respondeu HTTP ${response.status}`);
        const obj = await response.json();

        // Valida que o backend devolveu exatamente o registro solicitado.
        const returnedId = obj.IDOBJETO ?? obj.id_objeto ?? obj.id;
        if (String(returnedId) !== String(id)) {
            throw new Error(`ID solicitado (${id}) diferente do ID retornado (${returnedId}).`);
        }

        const name = obj.NOME_OBJETO || "Objeto sem nome";
        const local = obj.NOME_LOCAL || "Local não informado";
        const date = formatDate(obj.DATA_OCORRENCIA || obj.DATA_CADASTRO);
        const user = obj.NOME_USUARIO || "Usuário do IFSP";
        const description = obj.DESCRICAO || "Sem descrição informada.";
        const statusRaw = String(obj.STATUS || "ATIVO").toUpperCase();
        const status = ["RESOLVIDO", "RESOLVIDA"].includes(statusRaw) ? "Resolvido" :
            statusRaw === "PERDIDO" ? "Perdido" : "Encontrado";

        const image = byId("imagemObjeto");
        if (obj.foto_url) {
            image.src = obj.foto_url;
            image.alt = `Foto de ${name}`;
            image.hidden = false;
            image.onerror = () => {
                image.hidden = true;
                image.alt = "Foto do objeto não disponível";
            };
        } else {
            image.removeAttribute("src");
            image.alt = "Foto do objeto não disponível";
            image.hidden = true;
        }

        byId("nomeObjeto").textContent = name;
        byId("localObjeto").textContent = local;
        byId("dataObjeto").textContent = date;
        byId("usuarioObjeto").textContent = user;
        byId("descricaoObjeto").textContent = description;
        byId("textoStatus").textContent = status;
        byId("statusObjeto").classList.toggle("indisponivel", status === "Resolvido");

        const button = byId("botaoWhatsApp");
        const phone = String(obj.TELEFONE || "").replace(/\D/g, "");
        if (phone && status !== "Resolvido") {
            const message = encodeURIComponent(`Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "${name}".`);
            button.href = `https://wa.me/${phone}?text=${message}`;
            button.classList.remove("desabilitado");
            button.removeAttribute("aria-disabled");
        } else {
            button.removeAttribute("href");
            button.classList.add("desabilitado");
            button.setAttribute("aria-disabled", "true");
        }

        document.title = `${name} | Achados e Perdidos IFSP`;
    } catch (error) {
        console.error("Erro ao carregar detalhes do objeto:", error);
        showError("Não foi possível carregar os detalhes do objeto. Tente novamente em instantes.");
    }
});
