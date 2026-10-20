/* Carrega os dados do usuário em qualquer página que inclua este arquivo. */
(() => {
    let user = null;
    try { user = JSON.parse(sessionStorage.getItem("usuarioAchadosPerdidos") || "null"); }
    catch (e) { console.warn("Dados do perfil inválidos", e); }

    if (!user) return;
    const name = user.nome || user.NOME_USUARIO || "Usuário";
    const photo = user.foto_url || user.foto || user.FOTO_URL || user.FOTO;
    document.querySelectorAll("[data-user-name], #profileName").forEach(el => el.textContent = name);
    document.querySelectorAll("[data-user-photo], #profilePhoto, .profile img").forEach(img => {
        if (photo) {
            img.src = photo;
            img.alt = `Foto de ${name}`;
            img.classList.add("user-photo");
        }
    });
})();
