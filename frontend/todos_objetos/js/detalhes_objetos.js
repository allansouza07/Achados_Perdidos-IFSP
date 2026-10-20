
document.addEventListener("DOMContentLoaded", async () => {
    const API = (
        window.ACHADOS_API_URL ||
        "https://achadosperdidos-ifsp-production.up.railway.app"
    ).replace(/\/$/, "");


const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const staticKey = params.get("static");

    const byId = value => document.getElementById(value);

const errorBox = byId("mensagemErro");
    const mainCard = document.querySelector(".card-principal");
    const descriptionCard = document.querySelector(".card-descricao");
    const contactSection = document.querySelector(".contato");

const staticObjects = {
        "estojo-azul": {
            name: "Estojo azul",
            image: "img/estojo_azul.png",
            local: "Biblioteca",
            date: "07/10/2026",
            user: "@GU3079689",
            description: "Estojo azul encontrado na biblioteca."
        },
        "garrafa-preta": {
            name: "Garrafa preta",
            image: "img/garrafa_preta.png",
            local: "Sala F1",
            date: "06/10/2026",
            user: "@GU3079689",
            description: "Garrafa preta encontrada na sala F1."
        },
        "fone-jbl": {
            name: "Fone de ouvido JBL",
            image: "img/fone_jbl.png",
            local: "Laboratório de Informática",
            date: "05/10/2026",
            user: "@3079689",
            description: "Fone de ouvido JBL encontrado no laboratório."
        },
        "mochila-preta": {
            name: "Mochila preta",
            image: "img/bolsa_preta.png",
            local: "Pátio",
            date: "04/10/2026",
            user: "@GU304521",
            description: "Mochila preta encontrada no pátio."
        },
        "blusa-azul": {
            name: "Blusa azul",
            image: "img/blusa_azul.png",
            local: "Cantina",
            date: "03/10/2026",
            user: "@GU302145",
            description: "Blusa azul encontrada na cantina."
        },
        "iphone-15": {
            name: "Iphone 15",
            image: "img/iphone.png",
            local: "Biblioteca",
            date: "02/10/2026",
            user: "@GU301782",
            description: "Iphone 15 encontrado na biblioteca."
        }
    };

function showError(message) {
        if (mainCard) mainCard.hidden = true;
        if (descriptionCard) descriptionCard.hidden = true;
        if (contactSection) contactSection.hidden = true;

if (errorBox) {
            errorBox.hidden = false;
            const textNode = [...errorBox.childNodes].find(
                node => node.nodeType === Node.TEXT_NODE
            );

if (textNode) {
                textNode.textContent = message + " ";
            } else {
                errorBox.prepend(document.createTextNode(message + " "));
            }
        }
    }

function formatDate(value) {
        if (!value) return "Não informada";

const text = String(value);
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

if (match) {
return $DIL0/$DIL1/$DIL2;
}

        const parsed = new Date(value);

return Number.isNaN(parsed.getTime())
            ? text
            : parsed.toLocaleDateString("pt-BR");
    }

function displayImage(url, name) {
        const image = byId("imagemObjeto");

image.onerror = () => {
            image.hidden = true;
            image.alt = "Foto do objeto não disponível";
        };

image.alt = Foto de $DIL0;
image.src = url;
image.hidden = false;
}

function disableWhatsApp() {
        const button = byId("botaoWhatsApp");

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

document.title = $DIL0 | Achados e Perdidos IFSP;
}

function displayDatabaseObject(obj) {
        const name = obj.NOME_OBJETO || "Objeto sem nome";
        const local = obj.NOME_LOCAL || "Local não informado";
        const date = formatDate(
            obj.DATA_OCORRENCIA || obj.DATA_CADASTRO
        );
        const user = obj.NOME_USUARIO || "Usuário do IFSP";
        const description = obj.DESCRICAO || "Sem descrição informada.";

        const statusRaw = String(obj.STATUS || "ATIVO").toUpperCase();

const status = ["RESOLVIDO", "RESOLVIDA"].includes(statusRaw)
            ? "Resolvido"
            : statusRaw === "PERDIDO"
                ? "Perdido"
                : "Encontrado";

byId("nomeObjeto").textContent = name;
        byId("localObjeto").textContent = local;
        byId("dataObjeto").textContent = date;
        byId("usuarioObjeto").textContent = user;
        byId("descricaoObjeto").textContent = description;
        byId("textoStatus").textContent = status;

byId("statusObjeto").classList.toggle(
            "indisponivel",
            status === "Resolvido"
        );

if (obj.foto_url) {
            displayImage(obj.foto_url, name);
        } else {
            const image = byId("imagemObjeto");
            image.removeAttribute("src");
            image.alt = "Foto do objeto não disponível";
            image.hidden = true;
        }

const button = byId("botaoWhatsApp");
        const phone = String(obj.TELEFONE || "").replace(/\D/g, "");

if (phone && status !== "Resolvido") {
const message = encodeURIComponent(
Olá! Estou entrando em contato pelo Achados e Perdidos do IFSP sobre o objeto "$DIL0".
);

button.href = https://wa.me/$DIL0?text=$DIL1;
button.classList.remove("desabilitado");
button.removeAttribute("aria-disabled");
} else {
disableWhatsApp();
}

document.title = $DIL0 | Achados e Perdidos IFSP;
}

// 1. Objetos estáticos: imagens diretamente da pasta img.
    if (staticKey) {
        const item = staticObjects[staticKey];

if (!item) {
            showError("Objeto demonstrativo não encontrado.");
            return;
        }

displayStaticObject(item);
        return;
    }

// 2. Objetos cadastrados: consulta pelo ID no banco.
    if (!id || !/^\d+$/.test(id)) {
        showError("Identificador do objeto inválido ou ausente.");
        return;
    }

try {
const response = await fetch(
$DIL0/api/objetos/$DIL1,
{ cache: "no-store" }
);

if (response.status === 404) {
            showError("O objeto solicitado não foi encontrado no banco de dados.");
            return;
        }

if (!response.ok) {
throw new Error(A API respondeu HTTP $DIL0);
}

        const obj = await response.json();

        const returnedId = obj.IDOBJETO ?? obj.id_objeto ?? obj.id;

if (String(returnedId) !== String(id)) {
throw new Error(
ID solicitado ($DIL0) diferente do ID retornado ($DIL1).
);
}

displayDatabaseObject(obj);
    } catch (error) {
        console.error("Erro ao carregar detalhes do objeto:", error);
        showError(
            "Não foi possível carregar os detalhes do objeto. Tente novamente."
        );
    }
});
