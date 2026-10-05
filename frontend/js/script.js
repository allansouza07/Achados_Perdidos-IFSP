const galleryButton = document.getElementById("galleryButton");
const cameraButton = document.getElementById("cameraButton");

const galleryInput = document.getElementById("galleryInput");
const cameraInput = document.getElementById("cameraInput");

const photoPreview = document.getElementById("photoPreview");
const previewImage = document.getElementById("previewImage");

const nome = document.getElementById("nome");
const nomeError = document.getElementById("nomeError");

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


    /* Verifica se é imagem */

    if (!file.type.startsWith("image/")) {

        photoError.textContent =
            "Selecione um arquivo de imagem válido.";

        return;
    }


    /* Limite de 5 MB */

    const maxSize = 5 * 1024 * 1024;


    if (file.size > maxSize) {

        photoError.textContent =
            "A foto deve ter no máximo 5 MB.";

        return;
    }


    /* Guarda a foto */

    selectedPhoto = file;


    photoError.textContent = "";


    /* Cria preview */

    const objectUrl =
        URL.createObjectURL(file);


    previewImage.src = objectUrl;

    previewImage.hidden = false;

    photoPlaceholder.hidden = true;


    /* Atualiza textos */

    photoTitle.textContent =
        "Foto selecionada";


    photoHint.textContent =
        file.name;


    /* Mostra botão remover */

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

matricula.addEventListener("input", () => {
    matricula.value = matricula.value
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 9)
        .toUpperCase();

    matriculaError.textContent = "";
});


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


        /* Até 2 números */

        if (value.length <= 2) {

            telefone.value =
                value
                    ? `(${value}`
                    : "";

        }


        /* DDD + telefone */

        else if (value.length <= 7) {

            telefone.value =
                `(${value.slice(0, 2)}) ${value.slice(2)}`;

        }


        /* Telefone completo */

        else {

            telefone.value =
                `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        }


        telefoneError.textContent = "";

    }
);



/* =========================================
   ENVIO PARA O FLASK
========================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        /* Limpa mensagem anterior */

        formMessage.textContent = "";


        let valid = true;



        /* ==============================
           FOTO
        ============================== */

        if (!selectedPhoto) {

            photoError.textContent =
                "Adicione uma foto para continuar.";

            valid = false;

        }



        /* ==============================
           MATRÍCULA
        ============================== */

        const matriculaValue =
            matricula.value.replace(/\D/g, "");


        if (matriculaValue.length !== 9) {

            matriculaError.textContent =
                "Digite uma matrícula válida.";

            valid = false;

        }



        /* ==============================
           TELEFONE
        ============================== */

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



        /* ==============================
           INTERROMPE SE HOUVER ERRO
        ============================== */

        if (!valid) {

            return;

        }



        /* ==============================
           PREPARA OS DADOS
        ============================== */
        const nomeValue = nome.value.trim();

        if (nomeValue.length < 2) {
            nomeError.textContent = "Digite seu nome completo.";
            valid = false;
}
        const formData =
            new FormData();


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


        formData.append("nome", nomeValue);
        /* ==============================
           BOTÃO
        ============================== */

        const button =
            loginForm.querySelector(
                ".continue-button"
            );


        const originalButtonText =
            button.innerHTML;


        button.disabled = true;


        button.innerHTML =
            "<span>ENVIANDO...</span>";


        formMessage.textContent =
            "Identificando usuário...";
        window.location.href = "pagina_inicial.html";



        try {


            /* ==============================
               ENVIA PARA O FLASK
            ============================== */
            window.location.href = "pagina_inicial/pagina_inicial.html";
            const response =
                await fetch(
                    "http://127.0.0.1:5000/api/usuarios/identificar",
                    {
                        method: "POST",
                        body: formData
                    }
                );



            /* ==============================
               CONVERTE RESPOSTA
            ============================== */

            const responseText =
    await response.text();

console.log("STATUS:", response.status);
console.log("RESPOSTA DO FLASK:", responseText);

let data;

try {

    data = JSON.parse(responseText);

} catch (error) {

    throw new Error(
        "O Flask não retornou JSON. Veja a resposta no Console (F12)."
    );

}



            /* ==============================
               VERIFICA ERRO DA API
            ============================== */

            if (!response.ok) {

                throw new Error(
                    data.mensagem ||
                    "Não foi possível identificar o usuário."
                );

            }



            /* ==============================
               SUCESSO
            ============================== */

            console.log(
                "Usuário identificado:",
                data.usuario
            );


            formMessage.textContent =
                `Olá, ${data.usuario.nome}! Usuário identificado com sucesso.`;



            /* ==============================
               SALVA USUÁRIO NO NAVEGADOR
            ============================== */

            localStorage.setItem(
                "usuario",
                JSON.stringify(data.usuario)
            );


            /*
             * Por enquanto permanecemos
             * nessa tela.
             *
             * Na próxima etapa vamos
             * redirecionar para a página
             * principal do sistema.
             */


        }


        /* ==============================
           ERRO
        ============================== */

        catch (error) {

            console.error(
                "Erro:",
                error
            );


            formMessage.textContent =
                error.message ||
                "Erro ao conectar com o servidor.";

        }


        /* ==============================
           RESTAURA BOTÃO
        ============================== */

        finally {

            button.disabled = false;

            button.innerHTML =
                originalButtonText;

        }

    }
);
