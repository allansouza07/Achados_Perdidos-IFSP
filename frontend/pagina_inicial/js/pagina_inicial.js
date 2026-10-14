document.addEventListener("DOMContentLoaded", function () {
    // Lê os dados que o formulário de identificação salvou na sessão.
    let user = null;

    try {
        const rawUser = sessionStorage.getItem("usuarioAchadosPerdidos");
        user = rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        console.error("Não foi possível recuperar os dados do usuário.", error);
    }

    const nome = user && user.nome ? user.nome : "Visitante";
    const profileName = document.getElementById("profileName");
    const profilePhoto = document.getElementById("profilePhoto");
    const profileMatricula = document.getElementById("profileMatricula");
    const welcomeTitle = document.getElementById("welcomeTitle");

    if (profileName) profileName.textContent = nome;
    if (welcomeTitle) welcomeTitle.textContent = "Olá, " + nome + "!";

    if (profileMatricula) {
        profileMatricula.textContent = user && user.matricula
            ? "Matrícula: " + user.matricula
            : "";
        profileMatricula.hidden = !(user && user.matricula);
    }

    if (profilePhoto && user && user.foto) {
        profilePhoto.src = user.foto;
        profilePhoto.alt = "Foto de " + nome;
        profilePhoto.classList.add("user-photo");
    }

    // A pesquisa encaminha o termo para a tela de todos os objetos.
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    function pesquisar() {
        const termo = searchInput ? searchInput.value.trim() : "";
        const destino = "../todos_objetos/todos_objetos.html";
        window.location.href = termo
            ? destino + "?busca=" + encodeURIComponent(termo)
            : destino;
    }

    if (searchBtn) searchBtn.addEventListener("click", pesquisar);

    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") pesquisar();
        });
    }
});
