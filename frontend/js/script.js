document.addEventListener("DOMContentLoaded", function () {
    const byId = id => document.getElementById(id);
    const galleryButton = byId("galleryButton");
    const cameraButton = byId("cameraButton");
    const galleryInput = byId("galleryInput");
    const cameraInput = byId("cameraInput");
    const preview = byId("previewImage");
    const placeholder = byId("photoPlaceholder");
    const photoTitle = byId("photoTitle");
    const photoHint = byId("photoHint");
    const removePhoto = byId("removePhoto");
    const photoError = byId("photoError");
    const nome = byId("nome");
    const nomeError = byId("nomeError");
    const matricula = byId("matricula");
    const matriculaError = byId("matriculaError");
    const telefone = byId("telefone");
    const telefoneError = byId("telefoneError");
    const form = byId("loginForm");
    const message = byId("formMessage");
    const button = byId("continueButton");
    let selectedPhoto = null;

    galleryButton.addEventListener("click", () => galleryInput.click());
    cameraButton.addEventListener("click", () => cameraInput.click());
    byId("photoPreview").addEventListener("click", () => galleryInput.click());
    galleryInput.addEventListener("change", () => selectPhoto(galleryInput.files[0]));
    cameraInput.addEventListener("change", () => selectPhoto(cameraInput.files[0]));

    function selectPhoto(file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            photoError.textContent = "Selecione um arquivo de imagem válido.";
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            photoError.textContent = "A foto deve ter no máximo 2 MB.";
            return;
        }
        selectedPhoto = file;
        photoError.textContent = "";
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        placeholder.hidden = true;
        photoTitle.textContent = "Foto selecionada";
        photoHint.textContent = file.name;
        removePhoto.hidden = false;
    }

    removePhoto.addEventListener("click", () => {
        selectedPhoto = null;
        preview.removeAttribute("src");
        preview.hidden = true;
        placeholder.hidden = false;
        photoTitle.textContent = "Adicione sua foto";
        photoHint.textContent = "Escolha uma imagem da galeria ou tire uma foto";
        removePhoto.hidden = true;
        galleryInput.value = "";
        cameraInput.value = "";
        photoError.textContent = "";
    });

    matricula.addEventListener("input", () => {
        matricula.value = matricula.value
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 9)
            .toUpperCase();
        matriculaError.textContent = "";
    });

    telefone.addEventListener("input", () => {
        const digits = telefone.value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 2) {
            telefone.value = digits ? "(" + digits : "";
        } else if (digits.length <= 7) {
            telefone.value = "(" + digits.slice(0, 2) + ") " + digits.slice(2);
        } else {
            telefone.value = "(" + digits.slice(0, 2) + ") " +
                digits.slice(2, 7) + "-" + digits.slice(7);
        }
        telefoneError.textContent = "";
    });

    function readPhotoAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        [photoError, nomeError, matriculaError, telefoneError, message]
            .forEach(element => element.textContent = "");

        const nomeValue = nome.value.trim();
        const matriculaValue = matricula.value.trim().toUpperCase();
        const telefoneValue = telefone.value.replace(/\D/g, "");
        let valid = true;

        if (!selectedPhoto) {
            photoError.textContent = "Adicione uma foto para continuar.";
            valid = false;
        }
        if (nomeValue.length < 2) {
            nomeError.textContent = "Digite seu nome completo.";
            valid = false;
        }
        if (!/^[A-Z0-9]{9}$/.test(matriculaValue)) {
            matriculaError.textContent = "A matrícula deve conter 9 letras ou números.";
            valid = false;
        }
        if (telefoneValue.length < 10 || telefoneValue.length > 11) {
            telefoneError.textContent = "Digite um telefone válido com DDD.";
            valid = false;
        }
        if (!valid) return;

        const originalButtonHTML = button.innerHTML;
        button.disabled = true;
        button.textContent = "SALVANDO...";
        message.textContent = "Salvando seus dados no banco de dados...";

        try {
            const foto = await readPhotoAsDataURL(selectedPhoto);
            const response = await fetch("http://127.0.0.1:5000/api/usuarios/identificar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nomeValue,
                    matricula: matriculaValue,
                    telefone: telefoneValue,
                    foto: foto
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.erro || result.mensagem ||
                    "Não foi possível salvar o cadastro.");
            }

            const savedUser = result.usuario;
            sessionStorage.setItem("usuarioAchadosPerdidos", JSON.stringify({
                id: savedUser.IDUSUARIO,
                nome: savedUser.NOME_USUARIO,
                matricula: savedUser.MATRICULA,
                telefone: savedUser.TELEFONE,
                foto: savedUser.foto_url,
                fotoNome: savedUser.FOTO
            }));
            window.location.href = "frontend/pagina_inicial/pagina_inicial.html";
        } catch (error) {
            message.textContent = error.message ||
                "Erro ao comunicar com o servidor. Confira se o Flask está em execução.";
            button.disabled = false;
            button.innerHTML = originalButtonHTML;
        }
    });
});
