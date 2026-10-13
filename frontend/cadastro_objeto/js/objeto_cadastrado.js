
document.addEventListener("DOMContentLoaded", () => {
    const cadastroConfirmado =
        sessionStorage.getItem("objetoCadastrado");

    // Impede o acesso à confirmação sem concluir um cadastro.
    if (cadastroConfirmado !== "true") {
        window.location.replace(
            "../pagina_inicial/pagina_inicial.html"
        );
        return;
    }

    const botaoVerObjeto = document.getElementById("verObjeto");

    botaoVerObjeto.addEventListener("click", () => {
        const objetoId = sessionStorage.getItem("objetoId");

        if (objetoId) {
            // Ajustaremos o destino para a página de detalhes
            // assim que confirmarmos sua rota no projeto.
            sessionStorage.setItem("objetoParaVisualizar", objetoId);

            window.location.href =
                "../pagina_inicial/pagina_inicial.html";
        } else {
            window.location.href =
                "../pagina_inicial/pagina_inicial.html";
        }
    });

    const botaoPesquisa = document.getElementById("botaoPesquisa");

    botaoPesquisa.addEventListener("click", () => {
        window.location.href =
            "../pagina_inicial/pagina_inicial.html#objetos";
    });

    // O sinal é consumido para que atualizar a página
    // não mantenha a confirmação como uma sessão válida.
    sessionStorage.removeItem("objetoCadastrado");
});
