const objetosFixos = [
    { id: "1", nome: "Estojo azul", status: "Disponível", local: "Biblioteca", data: "2026-10-07", usuario: "@GU3079689", descricao: "Estojo azul encontrado na biblioteca do IFSP. O proprietário pode entrar em contato para combinar a devolução.", imagem: "img/estojo_azul.png", telefone: "5511999999999" },
    { id: "2", nome: "Garrafa preta", status: "Disponível", local: "Sala F1", data: "2026-10-06", usuario: "@GU3079689", descricao: "Garrafa preta encontrada na sala F1 do IFSP.", imagem: "img/garrafa_preta.png", telefone: "5511999999999" },
    { id: "3", nome: "Fone de ouvido JBL", status: "Disponível", local: "Laboratório de Informática", data: "2026-10-05", usuario: "@3079689", descricao: "Fone de ouvido JBL encontrado no Laboratório de Informática.", imagem: "img/fone_jbl.png", telefone: "5511999999999" },
    { id: "4", nome: "Mochila preta", status: "Disponível", local: "Pátio", data: "2026-10-04", usuario: "@GU3079689", descricao: "Mochila preta encontrada no pátio do IFSP.", imagem: "img/bolsa_preta.png", telefone: "5511999999999" },
    { id: "5", nome: "Blusa azul", status: "Disponível", local: "Cantina", data: "2026-10-03", usuario: "@GU3079689", descricao: "Blusa azul encontrada na cantina do IFSP.", imagem: "img/blusa_azul.png", telefone: "5511999999999" },
    { id: "6", nome: "iPhone 15", status: "Disponível", local: "Biblioteca", data: "2026-10-02", usuario: "@GU3079689", descricao: "iPhone 15 encontrado na biblioteca do IFSP.", imagem: "img/iphone.png", telefone: "5511999999999" }
];

function formatarData(data) {
    if (!data) return "Não informada";
    const parts = data.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : data;
}
function getLocalObjects() {
    try {
        const values = JSON.parse(localStorage.getItem("achadosPerdidos_objetosCadastrados") || "[]");
        return Array.isArray(values) ? values : [];
    } catch {
        return [];
    }
}
function carregarDetalhes() {
    const id = new URLSearchParams(window.location.search).get("id");
    const localObject = getLocalObjects().find(object => String(object.id) === String(id));
    const fixedObject = objetosFixos.find(object => String(object.id) === String(id));
    const raw = localObject || fixedObject;

    if (!raw) {
        document.querySelector(".card-principal").hidden = true;
        document.querySelector(".card-descricao").hidden = true;
        document.querySelector(".contato").hidden = true;
        document.getElementById("mensagemErro").hidden = false;
        return;
    }

    const object = localObject ? {
        nome: raw.nome,
        status: raw.status || "Disponível",
        local: raw.localLabel || raw.local || "Não informado",
        data: raw.data,
        usuario: raw.usuario || "Usuário do IFSP",
        descricao: raw.descricao || "Sem descrição.",
        imagem: raw.imagem || "",
        telefone: raw.telefone || ""
    } : raw;

    const image = document.getElementById("imagemObjeto");
    if (object.imagem) {
        image.src = object.imagem;
        image.hidden = false;
    } else {
        image.hidden = true;
        image.alt = "Foto do objeto não enviada";
    }
    image.alt = `Foto de ${object.nome}`;
    image.onerror = () => { image.hidden = true; };

    document.getElementById("nomeObjeto").textContent = object.nome;
    document.getElementById("localObjeto").textContent = object.local;
    document.getElementById("dataObjeto").textContent = formatarData(object.data);
    document.getElementById("usuarioObjeto").textContent = object.usuario;
    document.getElementById("descricaoObjeto").textContent = object.descricao;

    const statusElement = document.getElementById("statusObjeto");
    document.getElementById("textoStatus").textContent = object.status;
    statusElement.classList.toggle("indisponivel", object.status.toLowerCase() !== "disponível");

    const button = document.getElementById("botaoWhatsApp");
    if (object.telefone && object.status.toLowerCase() === "disponível") {
        const message = encodeURIComponent(`Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "${object.nome}".`);
        button.href = `https://wa.me/${object.telefone}?text=${message}`;
        button.classList.remove("desabilitado");
        button.removeAttribute("aria-disabled");
    } else {
        button.removeAttribute("href");
        button.classList.add("desabilitado");
        button.setAttribute("aria-disabled", "true");
    }
    document.title = `${object.nome} | Achados e Perdidos IFSP`;
}
document.addEventListener("DOMContentLoaded", carregarDetalhes);
