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
    const STORAGE_KEY = "achadosPerdidos_objetosCadastrados";

    // Usa a data local do computador, evitando divergências de fuso horário.
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const today = now.toISOString().slice(0, 10);
    data.max = today;

    descricao.addEventListener("input", () => {
        counter.textContent = `${descricao.value.length}/500`;
    });

    let photoData = "";
    function previewFile(file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem válido.");
            photoInput.value = "";
            return;
        }
        // Limite para evitar exceder a capacidade do armazenamento do navegador.
        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2 MB nesta versão de teste.");
            photoInput.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            photoData = String(reader.result || "");
            photoPreview.replaceChildren();
            const img = document.createElement("img");
            img.src = photoData;
            img.alt = "Pré-visualização da foto do objeto";
            photoPreview.appendChild(img);
            photoPreview.style.display = "block";
        };
        reader.onerror = () => alert("Não foi possível abrir esta imagem.");
        reader.readAsDataURL(file);
    }

    photoInput.addEventListener("change", () => previewFile(photoInput.files[0]));
    photoUpload.addEventListener("dragover", event => {
        event.preventDefault();
        photoUpload.classList.add("dragover");
    });
    photoUpload.addEventListener("dragleave", () => photoUpload.classList.remove("dragover"));
    photoUpload.addEventListener("drop", event => {
        event.preventDefault();
        photoUpload.classList.remove("dragover");
        const file = event.dataTransfer.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
            alert("Selecione uma imagem válida de até 2 MB.");
            return;
        }
        const transfer = new DataTransfer();
        transfer.items.add(file);
        photoInput.files = transfer.files;
        previewFile(file);
    });

    function showError(field, errorId, message) {
        field.classList.add("input-error");
        document.getElementById(errorId).textContent = message;
    }
    function clearError(field, errorId) {
        field.classList.remove("input-error");
        document.getElementById(errorId).textContent = "";
    }
    function validate() {
        let valid = true;
        const fields = [
            [nome, "nomeError", !nome.value.trim(), "Informe o nome do objeto."],
            [categoria, "categoriaError", !categoria.value, "Selecione uma categoria."],
            [local, "localError", !local.value, "Selecione o local onde encontrou o objeto."],
            [data, "dataError", !data.value, "Informe a data em que encontrou o objeto."],
            [descricao, "descricaoError", !descricao.value.trim(), "Informe uma descrição do objeto."]
        ];
        fields.forEach(([field, id, invalid, message]) => {
            if (invalid) {
                showError(field, id, message);
                valid = false;
            } else {
                clearError(field, id);
            }
        });
        if (data.value && data.value > today) {
            showError(data, "dataError", "A data não pode ser futura.");
            valid = false;
        }
        return valid;
    }
    function readStoredObjects() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Não foi possível ler os objetos salvos localmente.", error);
            return [];
        }
    }
    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem("usuarioAchadosPerdidos") || "null");
        } catch {
            return null;
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!validate()) {
            form.querySelector(".input-error")?.focus();
            return;
        }

        const originalText = submit.textContent;
        submit.disabled = true;
        submit.textContent = "Preparando cadastro...";

        try {
            const user = getCurrentUser();
            const categoryLabels = {
                vestuario: "Vestuário",
                eletronico: "Eletrônico",
                item_pessoal: "Item pessoal"
            };
            const locationLabels = {
                biblioteca: "Biblioteca",
                sala_aula: "Sala de aula",
                laboratorio: "Laboratório",
                patio: "Pátio",
                cantina: "Cantina",
                quadra: "Quadra",
                corredor: "Corredor",
                outro: "Outro"
            };
            const objeto = {
                id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                nome: nome.value.trim(),
                categoria: categoria.value,
                categoriaLabel: categoryLabels[categoria.value] || categoria.value,
                local: local.value,
                localLabel: locationLabels[local.value] || local.value,
                data: data.value,
                descricao: descricao.value.trim(),
                imagem: photoData,
                usuario: user?.nome || "Usuário do IFSP",
                telefone: (user?.telefone || "").replace(/\D/g, ""),
                status: "Disponível",
                criadoEm: new Date().toISOString()
            };

            const dataFormatada = objeto.data.split("-").reverse().join("/");
            const resumo = [
                `Objeto: ${objeto.nome}`,
                `Categoria: ${objeto.categoriaLabel}`,
                `Local: ${objeto.localLabel}`,
                `Data encontrada: ${dataFormatada}`
            ].join("\n");

            // A publicação só ocorre quando a pessoa confirma os dados.
            if (!confirm(`Confira os dados antes de confirmar o cadastro:\n\n${resumo}\n\nApós confirmar, o objeto aparecerá em “Todos os objetos” neste navegador.`)) {
                submit.disabled = false;
                submit.textContent = originalText;
                return;
            }

            const objects = readStoredObjects();
            objects.unshift(objeto);
            // Falha controladamente se o navegador estiver sem espaço disponível.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
            sessionStorage.setItem("objetoCadastrado", "true");
            sessionStorage.setItem("objetoId", objeto.id);
            sessionStorage.setItem("objetoTemporario", JSON.stringify(objeto));
            window.location.href = "./objeto_cadastrado.html";
        } catch (error) {
            console.error("Erro ao salvar objeto localmente:", error);
            alert("O navegador não conseguiu guardar os dados. Tente remover a foto ou usar uma imagem menor.");
            submit.disabled = false;
            submit.textContent = originalText;
        }
    });

    document.getElementById("cancelButton").addEventListener("click", () => {
        if (!confirm("Deseja limpar o formulário? Os dados preenchidos serão perdidos.")) return;
        form.reset();
        photoData = "";
        photoPreview.replaceChildren();
        photoPreview.style.display = "none";
        counter.textContent = "0/500";
        document.querySelectorAll(".error-message").forEach(element => element.textContent = "");
        document.querySelectorAll(".input-error").forEach(element => element.classList.remove("input-error"));
    });

    document.getElementById("backLink").addEventListener("click", event => {
        event.preventDefault();
        window.history.back();
    });
});
