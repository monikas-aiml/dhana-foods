document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       DHANA FOODS - CUSTOMER ORDER SCRIPT
    ===================================================== */

    const orderForm = document.getElementById("orderForm");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const submitButton = document.getElementById("submitButton");

    const productInputs =
        document.querySelectorAll(".product-qty");


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       GET PRODUCTS FROM CART
    ===================================================== */

    function getCartItems() {

        const items = [];

        document
            .querySelectorAll(".product-qty")
            .forEach(function (input) {

                const quantity =
                    parseInt(input.value, 10) || 0;

                if (quantity > 0) {

                    items.push({

                        product:
                            (input.dataset.product || "")
                                .trim(),

                        size:
                            (input.dataset.size || "")
                                .trim(),

                        quantity:
                            quantity,

                        price:
                            Number(
                                input.dataset.price || 0
                            )

                    });

                }

            });

        return items;
    }


    /* =====================================================
       CALCULATE TOTAL
    ===================================================== */

    function calculateTotal(items) {

        let total = 0;

        items.forEach(function (item) {

            total +=
                Number(item.quantity) *
                Number(item.price);

        });

        return total;
    }


    /* =====================================================
       FIND PRODUCT INPUT
    ===================================================== */

    function findProductInput(
        product,
        size
    ) {

        const inputs =
            document.querySelectorAll(".product-qty");

        for (const input of inputs) {

            if (
                input.dataset.product === product &&
                input.dataset.size === size
            ) {
                return input;
            }

        }

        return null;
    }


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        const items =
            getCartItems();

        const total =
            calculateTotal(items);


        if (!cartItems || !cartTotal) {
            return;
        }


        if (items.length === 0) {

            cartItems.innerHTML =
                "No products selected.";

            cartTotal.textContent =
                "Total: ₹0";

            return;
        }


        let html = "";


        items.forEach(function (item) {

            const itemTotal =
                Number(item.quantity) *
                Number(item.price);


            html += `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        padding:12px 0;
                        border-bottom:1px solid #eee;
                    "
                >

                    <div>

                        <strong>
                            ${escapeHTML(item.product)}
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(item.size)}
                            ×
                            ${item.quantity}
                        </small>

                    </div>


                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:6px;
                        "
                    >

                        <button
                            type="button"
                            class="cart-minus"
                            data-product="${escapeHTML(item.product)}"
                            data-size="${escapeHTML(item.size)}"
                        >
                            −
                        </button>

                        <strong>
                            ${item.quantity}
                        </strong>

                        <button
                            type="button"
                            class="cart-plus"
                            data-product="${escapeHTML(item.product)}"
                            data-size="${escapeHTML(item.size)}"
                        >
                            +
                        </button>

                        <strong>
                            ₹${itemTotal}
                        </strong>

                        <button
                            type="button"
                            class="cart-remove"
                            data-product="${escapeHTML(item.product)}"
                            data-size="${escapeHTML(item.size)}"
                        >
                            ✕
                        </button>

                    </div>

                </div>

            `;

        });


        cartItems.innerHTML = html;

        cartTotal.textContent =
            `Total: ₹${total}`;
    }


    /* =====================================================
       PRODUCT INPUT CHANGE
    ===================================================== */

    document
        .querySelectorAll(".product-qty")
        .forEach(function (input) {

            input.addEventListener(
                "input",
                updateCart
            );

            input.addEventListener(
                "change",
                updateCart
            );

        });


    /* =====================================================
       CART PLUS / MINUS / REMOVE
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".cart-plus, .cart-minus, .cart-remove"
                );


            if (!button) {
                return;
            }


            const product =
                button.dataset.product;

            const size =
                button.dataset.size;


            const input =
                findProductInput(
                    product,
                    size
                );


            if (!input) {
                return;
            }


            let quantity =
                parseInt(input.value, 10) || 0;


            if (
                button.classList.contains(
                    "cart-plus"
                )
            ) {

                if (quantity < 100) {
                    quantity++;
                }

            }


            if (
                button.classList.contains(
                    "cart-minus"
                )
            ) {

                quantity--;

                if (quantity < 0) {
                    quantity = 0;
                }

            }


            if (
                button.classList.contains(
                    "cart-remove"
                )
            ) {

                quantity = 0;

            }


            input.value =
                quantity;

            updateCart();

        }
    );


    /* =====================================================
       ORDER SUBMISSION
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                /* -----------------------------------------
                   GET CUSTOMER NAME
                ----------------------------------------- */

                const customerNameElement =
                    document.getElementById(
                        "customerName"
                    );


                /* -----------------------------------------
                   GET PHONE
                ----------------------------------------- */

                const phoneElement =
                    document.getElementById(
                        "phone"
                    );


                /* -----------------------------------------
                   GET ADDRESS
                ----------------------------------------- */

                const addressElement =
                    document.getElementById(
                        "address"
                    );


                /* -----------------------------------------
                   GET DELIVERY DATE
                ----------------------------------------- */

                const deliveryDateElement =
                    document.getElementById(
                        "deliveryDate"
                    );


                /* -----------------------------------------
                   READ VALUES
                ----------------------------------------- */

                const customerName =
                    customerNameElement
                        ? customerNameElement.value.trim()
                        : "";


                const phone =
                    phoneElement
                        ? phoneElement.value.trim()
                        : "";


                const address =
                    addressElement
                        ? addressElement.value.trim()
                        : "";


                const deliveryDate =
                    deliveryDateElement
                        ? deliveryDateElement.value.trim()
                        : "";


                /* -----------------------------------------
                   DEBUG
                ----------------------------------------- */

                console.log(
                    "CUSTOMER NAME:",
                    customerName
                );

                console.log(
                    "PHONE:",
                    phone
                );

                console.log(
                    "ADDRESS:",
                    address
                );

                console.log(
                    "DELIVERY DATE:",
                    deliveryDate
                );


                /* -----------------------------------------
                   VALIDATE CUSTOMER NAME
                ----------------------------------------- */

                if (!customerName) {

                    alert(
                        "Please enter your Customer Name."
                    );

                    if (customerNameElement) {
                        customerNameElement.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   VALIDATE PHONE
                ----------------------------------------- */

                if (!phone) {

                    alert(
                        "Please enter your Phone Number."
                    );

                    if (phoneElement) {
                        phoneElement.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   VALIDATE ADDRESS
                ----------------------------------------- */

                if (!address) {

                    alert(
                        "Please enter your Delivery Address."
                    );

                    if (addressElement) {
                        addressElement.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   VALIDATE DELIVERY DATE
                ----------------------------------------- */

                if (!deliveryDate) {

                    alert(
                        "Please select your Delivery Date."
                    );

                    if (deliveryDateElement) {
                        deliveryDateElement.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   GET CART
                ----------------------------------------- */

                const items =
                    getCartItems();


                if (items.length === 0) {

                    alert(
                        "Please select at least one product."
                    );

                    return;
                }


                /* -----------------------------------------
                   PREPARE ORDER DATA
                ----------------------------------------- */

                const orderData = {

                    customerName:
                        customerName,

                    phone:
                        phone,

                    address:
                        address,

                    items:
                        items,

                    deliveryDate:
                        deliveryDate

                };


                console.log(
                    "ORDER DATA SENT TO SERVER:",
                    orderData
                );


                /* -----------------------------------------
                   DISABLE BUTTON
                ----------------------------------------- */

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Placing Order...";

                }


                try {

                    /* -------------------------------------
                       SEND ORDER
                    ------------------------------------- */

                    const response =
                        await fetch(
                            "/api/orders",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify(
                                        orderData
                                    )

                            }
                        );


                    const responseText =
                        await response.text();


                    console.log(
                        "SERVER RESPONSE:",
                        responseText
                    );


                    let result;


                    try {

                        result =
                            JSON.parse(
                                responseText
                            );

                    } catch (error) {

                        throw new Error(
                            "Server returned an invalid response."
                        );

                    }


                    /* -------------------------------------
                       SERVER ERROR
                    ------------------------------------- */

                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Unable to place order."
                        );

                    }


                    if (
                        result.success === false
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to place order."
                        );

                    }


                    /* -------------------------------------
                       SHOW SUCCESS
                    ------------------------------------- */

                    const successMessage =
                        document.getElementById(
                            "successMessage"
                        );


                    const successOrderId =
                        document.getElementById(
                            "successOrderId"
                        );


                    const successTotal =
                        document.getElementById(
                            "successTotal"
                        );


                    const successDeliveryDate =
                        document.getElementById(
                            "successDeliveryDate"
                        );


                    if (successOrderId) {

                        successOrderId.textContent =
                            result.orderId || "-";

                    }


                    if (successTotal) {

                        successTotal.textContent =
                            "₹" +
                            Number(
                                result.total || 0
                            ).toFixed(2);

                    }


                    if (successDeliveryDate) {

                        successDeliveryDate.textContent =
                            result.deliveryDate ||
                            deliveryDate;

                    }


                    if (successMessage) {

                        successMessage.style.display =
                            "block";

                        successMessage.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }


                    /* -------------------------------------
                       CLEAR PRODUCTS
                    ------------------------------------- */

                    document
                        .querySelectorAll(".product-qty")
                        .forEach(function (input) {

                            input.value = "0";

                        });


                    updateCart();


                    /* -------------------------------------
                       CLEAR CUSTOMER FORM
                    ------------------------------------- */

                    if (customerNameElement) {
                        customerNameElement.value = "";
                    }

                    if (phoneElement) {
                        phoneElement.value = "";
                    }

                    if (addressElement) {
                        addressElement.value = "";
                    }

                    if (deliveryDateElement) {
                        deliveryDateElement.value = "";
                    }


                    console.log(
                        "ORDER SUCCESS:",
                        result
                    );


                } catch (error) {

                    console.error(
                        "ORDER SUBMISSION ERROR:",
                        error
                    );


                    alert(
                        "Unable to place order.\n\n" +
                        error.message
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Place Order";

                    }

                }

            }
        );

    }


    /* =====================================================
       INITIAL CART
    ===================================================== */

    updateCart();

});