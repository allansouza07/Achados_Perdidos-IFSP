/* =========================================================
   ACHADOS E PERDIDOS IFSP
   Cadastro de objeto encontrado
   ========================================================= */


const form = document.getElementById("objectForm");

const photoInput = document.getElementById("photoInput");

const photoUpload = document.getElementById("photoUpload");

const photoPreview = document.getElementById("photoPreview");

const nomeObjeto = document.getElementById("nomeObjeto");

const categoria = document.getElementById("categoria");

const local = document.getElementById("local");

const dataEncontrada =
    document.getElementById("dataEncontrada");

const descricao =
    document.getElementById("descricao");

const charCounter =
    document.getElementById("charCounter");

const cancelButton =
    document.getElementById("cancelButton");

const backLink =
    document.getElementById("backLink");



/* =========================================================
   DATA MÁXIMA
   ========================================================= */

const today =
    new Date().toISOString().split("T")[0];

dataEncontrada.max = today;



/* =========================================================
   CONTADOR DA DESCRIÇÃO
   ========================================================= */

descricao.addEventListener("input", () => {

    charCounter.textContent =
        `${descricao.value.length}/500`;

});



/* =========================================================
   FOTO
   ========================================================= */

photoInput.addEventListener("change", () => {

    const file = photoInput.files[0];

    if (file) {

        showPhotoPreview(file);

    }

});


function showPhotoPreview(file) {

    if (!file.type.startsWith("image/")) {

        alert(
            "Selecione um arquivo de imagem válido."
        );

        photoInput.value = "";

        return;
    }


    const reader = new FileReader();


    reader.onload = (event) => {

        photoPreview.innerHTML = `

            <img
                src="${event.target.result}"
                alt="Pré-visualização da foto"
            >

        `;

        photoPreview.style.display = "block";

    };


    reader.readAsDataURL(file);

}



/* =========================================================
   DRAG AND DROP
   ========================================================= */

photoUpload.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        photoUpload.classList.add(
            "dragover"
        );

    }
);


photoUpload.addEventListener(
    "dragleave",
    () => {

        photoUpload.classList.remove(
            "dragover"
        );

    }
);


photoUpload.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        photoUpload.classList.remove(
            "dragover"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert(
                "Solte apenas arquivos de imagem."
            );

            return;
        }


        const dataTransfer =
            new DataTransfer();

        dataTransfer.items.add(file);

        photoInput.files =
            dataTransfer.files;


        showPhotoPreview(file);

    }
);



/* =========================================================
   ERROS
   ========================================================= */

function showError(
    input,
    errorElement,
    message
) {

    input.classList.add(
        "input-error"
    );

    errorElement.textContent =
        message;

}


function clearError(
    input,
    errorElement
) {

    input.classList.remove(
        "input-error"
    );

    errorElement.textContent = "";

}



/* =========================================================
   VALIDAÇÃO
   ========================================================= */

function validateForm() {

    let valid = true;


    const nomeError =
        document.getElementById("nomeError");

    const categoriaError =
        document.getElementById(
            "categoriaError"
        );

    const localError =
        document.getElementById(
            "localError"
        );

    const dataError =
        document.getElementById(
            "dataError"
        );

    const descricaoError =
        document.getElementById(
            "descricaoError"
        );



    /* NOME */

    if (!nomeObjeto.value.trim()) {

        showError(
            nomeObjeto,
            nomeError,
            "Informe o nome do objeto."
        );

        valid = false;

    } else {

        clearError(
            nomeObjeto,
            nomeError
        );

    }



    /* CATEGORIA */

    if (!categoria.value) {

        showError(
            categoria,
            categoriaError,
            "Selecione uma categoria."
        );

        valid = false;

    } else {

        clearError(
            categoria,
            categoriaError
        );

    }



    /* LOCAL */

    if (!local.value) {

        showError(
            local,
            localError,
            "Selecione o local onde encontrou o objeto."
        );

        valid = false;

    } else {

        clearError(
            local,
            localError
        );

    }



    /* DATA */

    if (!dataEncontrada.value) {

        showError(
            dataEncontrada,
            dataError,
            "Informe a data em que o objeto foi encontrado."
        );

        valid = false;

    }

    else if (
        dataEncontrada.value > today
    ) {

        showError(
            dataEncontrada,
            dataError,
            "A data não pode ser futura."
        );

        valid = false;

    }

    else {

        clearError(
            dataEncontrada,
            dataError
        );

    }



    /* DESCRIÇÃO */

    if (!descricao.value.trim()) {

        showError(
            descricao,
            descricaoError,
            "Informe uma descrição do objeto."
        );

        valid = false;

    } else {

        clearError(
            descricao,
            descricaoError
        );

    }


    return valid;

}



/* =========================================================
   SUBMIT
   ========================================================= */

form.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        if (!validateForm()) {

            return;

        }


        /*
         * POR ENQUANTO:
         *
         * Os dados não são enviados para o banco.
         *
         * Estamos apenas montando o objeto.
         */


        const objeto = {

            nome:
                nomeObjeto.value.trim(),

            categoria:
                categoria.value,

            local:
                local.value,

            data_encontrada:
                dataEncontrada.value,

            descricao:
                descricao.value.trim(),

            foto:
                photoInput.files[0] || null

        };


        console.log(
            "Objeto pronto para API:",
            objeto
        );


        alert(
            "Objeto validado com sucesso!\n\n" +
            "Na próxima etapa iremos conectar " +
            "este formulário ao Flask e ao MySQL."
        );


        /*
         * =====================================================
         * FUTURA INTEGRAÇÃO COM FLASK
         * =====================================================
         *
         * const formData = new FormData();
         *
         * formData.append(
         *     "nome",
         *     objeto.nome
         * );
         *
         * formData.append(
         *     "categoria",
         *     objeto.categoria
         * );
         *
         * formData.append(
         *     "local",
         *     objeto.local
         * );
         *
         * formData.append(
         *     "data_encontrada",
         *     objeto.data_encontrada
         * );
         *
         * formData.append(
         *     "descricao",
         *     objeto.descricao
         * );
         *
         * formData.append(
         *     "foto",
         *     objeto.foto
         * );
         *
         *
         * fetch(
         *     "http://127.0.0.1:5000/api/objetos",
         *     {
         *         method: "POST",
         *         body: formData
         *     }
         * )
         * .then(response => response.json())
         * .then(data => {
         *
         *     console.log(data);
         *
         * })
         * .catch(error => {
         *
         *     console.error(error);
         *
         * });
         *
         * =====================================================
         */

    }
);



/* =========================================================
   CANCELAR
   ========================================================= */

cancelButton.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Deseja cancelar o cadastro? " +
                "Os dados preenchidos serão perdidos."
            );


        if (!confirmed) {
            return;
        }


        form.reset();


        photoPreview.innerHTML = "";

        photoPreview.style.display =
            "none";


        charCounter.textContent =
            "0/500";


        document
            .querySelectorAll(
                ".error-message"
            )
            .forEach(
                (error) => {

                    error.textContent = "";

                }
            );


        document
            .querySelectorAll(
                ".input-error"
            )
            .forEach(
                (input) => {

                    input.classList.remove(
                        "input-error"
                    );

                }
            );

    }
);



/* =========================================================
   VOLTAR
   ========================================================= */

backLink.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        window.history.back();

    }
);