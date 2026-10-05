const galleryButton = document.getElementById("galleryButton");
const cameraButton = document.getElementById("cameraButton");

const galleryInput = document.getElementById("galleryInput");
const cameraInput = document.getElementById("cameraInput");

const photoPreview = document.getElementById("photoPreview");
const previewImage = document.getElementById("previewImage");

const photoPlaceholder =
    document.getElementById("photoPlaceholder");

const photoTitle =
    document.getElementById("photoTitle");

const photoHint =
    document.getElementById("photoHint");

const removePhoto =
    document.getElementById("removePhoto");

const photoError =
    document.getElementById("photoError");


const matricula =
    document.getElementById("matricula");

const telefone =
    document.getElementById("telefone");


const matriculaError =
    document.getElementById("matriculaError");

const telefoneError =
    document.getElementById("telefoneError");


const loginForm =
    document.getElementById("loginForm");

const formMessage =
    document.getElementById("formMessage");


let selectedPhoto = null;



/* =========================================
   GALERIA
========================================= */

galleryButton.addEventListener("click", () => {

    galleryInput.click();

});


/* =========================================
   CÂMERA
========================================= */

cameraButton.addEventListener("click", () => {

    cameraInput.click();

});


/* =========================================
   CLIQUE NA FOTO
========================================= */

photoPreview.addEventListener("click", () => {

    galleryInput.click();

});



/* =========================================
   FOTO DA GALERIA
========================================= */

galleryInput.addEventListener(
    "change",
    function () {

        handlePhoto(this.files[0]);

    }
);



/* =========================================
   FOTO DA CÂMERA
========================================= */

cameraInput.addEventListener(
    "change",
    function () {

        handlePhoto(this.files[0]);

    }
);



/* =========================================
   PROCESSAR FOTO
========================================= */

function handlePhoto(file) {

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        photoError.textContent =
            "Selecione um arquivo de imagem válido.";

        return;
    }


    // Limite de 5 MB
    const maxSize = 5 * 1024 * 1024;


    if (file.size > maxSize) {

        photoError.textContent =
            "A foto deve ter no máximo 5 MB.";

        return;
    }


    selectedPhoto = file;


    photoError.textContent = "";


    const objectUrl =
        URL.createObjectURL(file);


    previewImage.src = objectUrl;

    previewImage.hidden = false;

    photoPlaceholder.hidden = true;


    photoTitle.textContent =
        "Foto selecionada";


    photoHint.textContent =
        file.name;


    removePhoto.hidden = false;

}



/* =========================================
   REMOVER FOTO
========================================= */

removePhoto.addEventListener(
    "click",
    clearPhoto
);


function clearPhoto() {

    selectedPhoto = null;


    previewImage.src = "";

    previewImage.hidden = true;

    photoPlaceholder.hidden = false;


    photoTitle.textContent =
        "Adicione sua foto";


    photoHint.textContent =
        "Escolha uma imagem da galeria ou tire uma foto";


    removePhoto.hidden = true;


    photoError.textContent = "";


    galleryInput.value = "";

    cameraInput.value = "";

}



/* =========================================
   MATRÍCULA
========================================= */

matricula.addEventListener(
    "input",
    () => {

        matricula.value =
            matricula.value
                .replace(/\D/g, "")
                .slice(0, 9);


        matriculaError.textContent = "";

    }
);



/* =========================================
   TELEFONE
========================================= */

telefone.addEventListener(
    "input",
    () => {

        let value =
            telefone.value
                .replace(/\D/g, "")
                .slice(0, 11);


        if (value.length <= 2) {

            telefone.value =
                value
                    ? `(${value}`
                    : "";

        }

        else if (value.length <= 7) {

            telefone.value =
                `(${value.slice(0, 2)}) ${value.slice(2)}`;

        }

        else {

            telefone.value =
                `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        }


        telefoneError.textContent = "";

    }
);



/* =========================================
   ENVIO
========================================= */

loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        formMessage.textContent = "";


        let valid = true;



        /* FOTO */

        if (!selectedPhoto) {

            photoError.textContent =
                "Adicione uma foto para continuar.";

            valid = false;

        }



        /* MATRÍCULA */

        const matriculaValue =
            matricula.value.replace(/\D/g, "");


        if (matriculaValue.length !== 9) {

            matriculaError.textContent =
                "Digite uma matrícula válida.";

            valid = false;

        }



        /* TELEFONE */

        const phoneValue =
            telefone.value.replace(/\D/g, "");


        if (
            phoneValue.length < 10 ||
            phoneValue.length > 11
        ) {

            telefoneError.textContent =
                "Digite um número de telefone válido.";

            valid = false;

        }



        if (!valid) {

            return;

        }



        /*
        ========================================
        PRÓXIMA ETAPA

        Aqui vamos conectar com o Flask.

        Exemplo:

        const formData = new FormData();

        formData.append(
            "matricula",
            matriculaValue
        );

        formData.append(
            "telefone",
            phoneValue
        );

        formData.append(
            "foto",
            selectedPhoto
        );


        fetch(
            "http://127.0.0.1:5000/usuarios",
            {
                method: "POST",
                body: formData
            }
        );

        ========================================
        */


        formMessage.textContent =
            "Dados preenchidos!";

    }
);