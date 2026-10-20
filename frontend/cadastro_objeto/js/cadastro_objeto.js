document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("objectForm");
    if (!form) return;

    const photoInput = document.getElementById("photoInput");
    const photoUpload = document.getElementById("photoUpload");
    const photoPreview = document.getElementById("photoPreview");
    const nome = document.getElementById("nomeObjeto");
    const categoria = document.getElementById("categoria");
    const local = document.getElementById("local");
    const data = document.getElementById("dataEncontrada");
    const descricao = document.getElementById("descricao");
    const counter = document.getElementById("charCounter");
    const submit = form.querySelector('button[type="submit"]');
    const API = window.ACHADOS_API_URL || "https://achadosperdidos-ifsp-production.up.railway.app";

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const today = now.toISOString().slice(0, 10);
    data.max = today;
    descricao.addEventListener("input", () => counter.textContent = `${descricao.value.length}/500`);

    let photoData = "";
    function previewFile(file) {
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            alert("Selecione uma imagem JPG, PNG ou WEBP de até 2 MB.");
            photoInput.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            photoData = String(reader.result || "");
            photoPreview.replaceChildren();
            const image = document.createElement("img");
            image.src = photoData;
            image.alt = "Pré-visualização da foto do objeto";
            photoPreview.appendChild(image);
            photoPreview.style.display = "block";
        };
        reader.onerror = () => alert("Não foi possível abrir a imagem.");
        reader.readAsDataURL(file);
    }
    photoInput.addEventListener("change", () => previewFile(photoInput.files[0]));
    photoUpload?.addEventListener("dragover", e => { e.preventDefault(); photoUpload.classList.add("dragover"); });
    photoUpload?.addEventListener("dragleave", () => photoUpload.classList.remove("dragover"));
    photoUpload?.addEventListener("drop", e => {
        e.preventDefault();
        photoUpload.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        photoInput.files = transfer.files;
        previewFile(file);
    });

    function error(field, id, message) {
        field.classList.add("input-error");
        document.getElementById(id).textContent = message;
    }
    function clearError(field, id) {
        field.classList.remove("input-error");
        document.getElementById(id).textContent = "";
    }
    function validate() {
        let valid = true;
        const fields = [
            [nome, "nomeError", !nome.value.trim(), "Informe o nome do objeto."],
            [categoria, "categoriaError", !categoria.value, "Selecione uma categoria."],
            [local, "localError", !local.value, "Selecione o local."],
            [data, "dataError", !data.value, "Informe a data encontrada."],
            [descricao, "descricaoError", !descricao.value.trim(), "Informe a descrição."]
        ];
        fields.forEach(([field, id, invalid, message]) => {
            if (invalid) { error(field, id, message); valid = false; }
            else clearError(field, id);
        });
        if (data.value && data.value > today) {
            error(data, "dataError", "A data não pode ser futura.");
            valid = false;
        }
        return valid;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!validate()) {
            form.querySelector(".input-error")?.focus();
            return;
        }
        let user;
        try { user = JSON.parse(sessionStorage.getItem("usuarioAchadosPerdidos") || "null"); }
        catch { user = null; }
        const idUsuario = user?.IDUSUARIO ?? user?.id_usuario ?? user?.id;
        if (!idUsuario) {
            alert("Não encontrei seu cadastro de usuário. Volte à tela de identificação e entre novamente.");
            return;
        }

        const labels = {
            vestuario: "VESTUÁRIO",
            eletronico: "ELETRÔNICO",
            item_pessoal: "ITEM PESSOAL"
        };
        const original = submit.textContent;
        submit.disabled = true;
        submit.textContent = "Salvando no banco...";
        try {
            const response = await fetch(`${API}/api/objetos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome_objeto: nome.value.trim(),
                    categoria: labels[categoria.value] || categoria.value,
                    local: local.options[local.selectedIndex].text.trim(),
                    data_ocorrencia: data.value,
                    descricao: descricao.value.trim().slice(0, 300),
                    foto: photoData,
                    id_usuario: Number(idUsuario),
                    tipo: "ENCONTRADO"
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.erro || result.mensagem || "Falha ao cadastrar objeto.");
            sessionStorage.setItem("objetoCadastrado", "true");
            sessionStorage.setItem("objetoId", String(result.id));
            window.location.href = "./objeto_cadastrado.html";
        } catch (err) {
            console.error(err);
            alert(`${err.message}\n\nConfira se o backend está online e se a migração SQL foi executada.`);
            submit.disabled = false;
            submit.textContent = original;
        }
    });

    document.getElementById("cancelButton")?.addEventListener("click", () => {
        if (!confirm("Deseja limpar o formulário?")) return;
        form.reset();
        photoData = "";
        photoPreview.replaceChildren();
        photoPreview.style.display = "none";
        counter.textContent = "0/500";
        document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
        document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
    });
    document.getElementById("backLink")?.addEventListener("click", e => {
        e.preventDefault();
        window.history.back();
    });
});
