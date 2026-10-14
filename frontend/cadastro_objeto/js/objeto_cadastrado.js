document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("objetoCadastrado") !== "true") {
        window.location.replace("../pagina_inicial/pagina_inicial.html");
        return;
    }

    let objeto = null;
    try {
        objeto = JSON.parse(sessionStorage.getItem("objetoTemporario") || "null");
    } catch (error) {
        console.error("Não foi possível recuperar o objeto recém-cadastrado.", error);
    }

    const title = document.getElementById("tituloSucesso");
    const message = document.querySelector(".mensagem-sucesso");
    if (objeto && title) title.textContent = `“${objeto.nome}” foi cadastrado!`;
    if (message) {
        message.textContent = "O objeto foi adicionado à lista local de Achados e Perdidos. Nesta versão, os dados ficam armazenados apenas neste navegador.";
    }

    document.getElementById("verObjeto").addEventListener("click", () => {
        const id = sessionStorage.getItem("objetoId");
        window.location.href = id
            ? `../todos_objetos/detalhes_objetos.html?id=${encodeURIComponent(id)}`
            : "../todos_objetos/todos_objetos.html";
    });

    sessionStorage.removeItem("objetoCadastrado");
});
