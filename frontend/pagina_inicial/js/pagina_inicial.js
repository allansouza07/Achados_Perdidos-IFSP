document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // BOTÃO DE BUSCA
    // =========================================

    const searchBtn =
        document.getElementById("searchBtn");


    searchBtn.addEventListener("click", () => {

        const searchInput =
            document.querySelector(".search-input");


        searchInput.classList.add("searching");


        setTimeout(() => {

            searchInput.classList.remove(
                "searching"
            );

        }, 350);


        alert(
            "A busca será integrada ao sistema de objetos encontrados."
        );

    });



    // =========================================
    // BOTÕES DE AÇÃO
    // =========================================

    const actionButtons =
        document.querySelectorAll(
            ".action-card button"
        );


    actionButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    button.textContent.includes(
                        "Pesquisar"
                    )
                ) {

                    window.location.href =
                        "#objetos";

                }


                if (
                    button.textContent.includes(
                        "Cadastrar"
                    )
                ) {

                  
                }

            }
        );

    });



    // =========================================
    // OBJETOS
    // =========================================

    const objectButtons =
        document.querySelectorAll(
            ".object-card button"
        );


    objectButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                alert(
                    "Aqui será aberta a página de detalhes do objeto."
                );

            }
        );

    });

});