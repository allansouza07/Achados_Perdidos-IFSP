document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const locationFilter =
        document.getElementById("locationFilter");

    const cards =
        document.querySelectorAll(".object-card");

    const resultCount =
        document.getElementById("resultCount");

    const noResults =
        document.getElementById("noResults");


    function filtrarObjetos() {

        const search =
            searchInput.value
                .toLowerCase()
                .trim();

        const category =
            categoryFilter.value;

        const location =
            locationFilter.value;


        let visible = 0;


        cards.forEach(card => {

            const name =
                card.dataset.name;

            const cardCategory =
                card.dataset.category;

            const cardLocation =
                card.dataset.location;


            const matchesSearch =
                name.includes(search);


            const matchesCategory =
                category === "todos" ||
                cardCategory === category;


            const matchesLocation =
                location === "todos" ||
                cardLocation === location;


            if (
                matchesSearch &&
                matchesCategory &&
                matchesLocation
            ) {

                card.style.display = "block";

                visible++;

            } else {

                card.style.display = "none";

            }

        });


        resultCount.textContent =
            `${visible} objeto${visible !== 1 ? "s" : ""} encontrado${visible !== 1 ? "s" : ""}`;


        if (visible === 0) {

            noResults.style.display = "block";

        } else {

            noResults.style.display = "none";

        }

    }


    searchInput.addEventListener(
        "input",
        filtrarObjetos
    );


    categoryFilter.addEventListener(
        "change",
        filtrarObjetos
    );


    locationFilter.addEventListener(
        "change",
        filtrarObjetos
    );


    /* =====================================
       BOTÕES DE DETALHES
    ====================================== */

    document
        .querySelectorAll(".details-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const card =
                        button.closest(".object-card");

                    const objectName =
                        card.dataset.name;

                    /*
                     * FUTURAMENTE:
                     *
                     * window.location.href =
                     * `../detalhes_objeto/detalhes.html?id=${id}`;
                     */

                    alert(
                        `Abrindo detalhes de: ${objectName}`
                    );

                }
            );

        });

});