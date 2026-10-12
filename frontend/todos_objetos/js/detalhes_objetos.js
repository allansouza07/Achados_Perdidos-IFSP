
const objetos = [
    {
        id: 1,
        nome: "Estojo azul",
        status: "Disponível",
        local: "Biblioteca",
        data: "2026-10-07",
        usuario: "@GU3079689",
        descricao:
            "Estojo azul encontrado na biblioteca do IFSP. " +
            "O proprietário pode entrar em contato para combinar a devolução.",
        imagem: "img/estojo_azul.png",
        telefone: "5511999999999"
    },
    {
        id: 2,
        nome: "Garrafa preta",
        status: "Disponível",
        local: "Sala F1",
        data: "2026-10-06",
        usuario: "@GU3079689",
        descricao:
            "Garrafa preta encontrada na sala F1 do IFSP.",
        imagem: "img/garrafa_preta.png",
        telefone: "5511999999999"
    },
    {
        id: 3,
        nome: "Fone de ouvido JBL",
        status: "Disponível",
        local: "Laboratório de Informática",
        data: "2026-10-05",
        usuario: "@3079689",
        descricao:
            "Fone de ouvido JBL encontrado no Laboratório de Informática.",
        imagem: "img/fone_jbl.png",
        telefone: "5511999999999"
    },
    {
        id: 4,
        nome: "Mochila preta",
        status: "Disponível",
        local: "Pátio",
        data: "2026-10-04",
        usuario: "@GU3079689",
        descricao:
            "Mochila preta encontrada no pátio do IFSP.",
        imagem: "img/bolsa_preta.png",
        telefone: "5511999999999"
    },
    {
        id: 5,
        nome: "Blusa azul",
        status: "Disponível",
        local: "Cantina",
        data: "2026-10-03",
        usuario: "@GU3079689",
        descricao:
            "Blusa azul encontrada na cantina do IFSP.",
        imagem: "img/blusa_azul.png",
        telefone: "5511999999999"
    },
    {
        id: 6,
        nome: "iPhone 15",
        status: "Disponível",
        local: "Biblioteca",
        data: "2026-10-02",
        usuario: "@GU3079689",
        descricao:
            "iPhone 15 encontrado na biblioteca do IFSP. " +
            "Entre em contato para obter mais informações sobre a devolução.",
        imagem: "img/iphone.png",
        telefone: "5511999999999"
    }
];

function formatarData(data) {
    if (!data) return "Não informada";

    const partes = data.split("-");

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
}

function carregarDetalhes() {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    const objeto = objetos.find(item => String(item.id) === id);

    if (!objeto) {
        document.querySelector(".card-principal").hidden = true;
        document.querySelector(".card-descricao").hidden = true;
        document.querySelector(".contato").hidden = true;
        document.getElementById("mensagemErro").hidden = false;
        return;
    }

    // FOTO E INFORMAÇÕES
    const imagem = document.getElementById("imagemObjeto");

    imagem.src = objeto.imagem;
    imagem.alt = `Foto de ${objeto.nome}`;

    imagem.onerror = () => {
        imagem.removeAttribute("src");
        imagem.alt = "Imagem do objeto não disponível";
    };

    document.getElementById("nomeObjeto").textContent = objeto.nome;
    document.getElementById("localObjeto").textContent = objeto.local;
    document.getElementById("dataObjeto").textContent =
        formatarData(objeto.data);
    document.getElementById("usuarioObjeto").textContent = objeto.usuario;

    document.getElementById("descricaoObjeto").textContent =
        objeto.descricao;

    // STATUS
    const status = document.getElementById("statusObjeto");
    const textoStatus = document.getElementById("textoStatus");

    textoStatus.textContent = objeto.status;

    const disponivel =
        objeto.status.toLowerCase() === "disponível";

    status.classList.toggle("indisponivel", !disponivel);

    // CONTATO PELO WHATSAPP
    const botao = document.getElementById("botaoWhatsApp");

    if (disponivel && objeto.telefone) {
        const mensagem = encodeURIComponent(
            `Olá! Estou entrando em contato pelo Achados e Perdidos ` +
            `do IFSP sobre o objeto "${objeto.nome}".`
        );

        botao.href =
            `https://wa.me/${objeto.telefone}?text=${mensagem}`;

        botao.classList.remove("desabilitado");
        botao.removeAttribute("aria-disabled");
    } else {
        botao.removeAttribute("href");
        botao.classList.add("desabilitado");
        botao.setAttribute("aria-disabled", "true");
    }

    document.title = `${objeto.nome} | Achados e Perdidos IFSP`;
}

document.addEventListener("DOMContentLoaded", carregarDetalhes);
