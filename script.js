document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const orderForm = document.getElementById("orderForm");
    const cartItemsBox = document.getElementById("cartItems");
    const cartTotalBox = document.getElementById("cartTotal");
    const submitButton = document.getElementById("submitButton");

    const productInputs =
        document.querySelectorAll(".product-qty");


    /* =====================================================
       SAFE HTML
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
       GET CART ITEMS
    ===================================================== */

    function getCartItems() {

        const items = [];

        productInputs.forEach(input => {

            const quantity =
                Number(input.value);

            if (
                Number.isInteger(quantity) &&
                quantity > 0
            ) {

                items.push({

                    product:
                        String(
                            input.dataset.product || ""
                        ).trim(),

                    size:
                        String(
                            input.dataset.size || ""
                        ).trim(),

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

        return items.reduce(
            (total, item) => {

                return total +
                    (
                        Number(item.quantity) *
                        Number(item.price)
                    );

            },
            0
        );

    }


    /* =====================================================
       FIND PRODUCT INPUT
    ===================================================== */

    function findProductInput(
        product,
        size
    ) {

        return Array.from(
            productInputs
        ).find(input =>

            input.dataset.product === product &&
            input.dataset.size === size

        );

    }


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        const items =
            getCartItems();

        const total =
            calculateTotal(items);


        if (items.length === 0) {

            cartItemsBox.innerHTML =
                "No products selected.";

            cartTotalBox.textContent =
                "Total: ₹0";

            return;
        }


        let html = "";


        items.forEach(item => {

            const itemTotal =
                Number(item.quantity) *
                Number(item.price);


            html += `

                <div
                    class="cart-item"
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        padding:10px 0;
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
                            style="
                                width:32px;
                                height:32px;
                                border:1px solid #ccc;
                                border-radius:6px;
                                cursor:pointer;
                            "
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
                            style="
                                width:32px;
                                height:32px;
                                border:1px solid #ccc;
                                border-radius:6px;
                                cursor:pointer;
                            "
                        >
                            +
                        </button>


                        <strong
                            style="
                                min-width:70px;
                                text-align:right;
                            "
                        >
                            ₹${itemTotal}
                        </strong>


                        <button
                            type="button"
                            class="cart-remove"
                            data-product="${escapeHTML(item.product)}"
                            data-size="${escapeHTML(item.size)}"
                            style="
                                border:none;
                                background:none;
                                color:#b42318;
                                cursor:pointer;
                                font-size:18px;
                            "
                            title="Remove"
                        >
                            ✕
                        </button>

                    </div>

                </div>

            `;

        });


        cartItemsBox.innerHTML =
            html;


        cartTotalBox.textContent =
            `Total: ₹${total}`;
    }


    /* =====================================================
       PRODUCT INPUT EVENTS
    ===================================================== */

    productInputs.forEach(input => {

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
       CART BUTTONS
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

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
                Number(input.value) || 0;


            /* PLUS */

            if (
                button.classList.contains(
                    "cart-plus"
                )
            ) {

                if (quantity < 100) {
                    quantity++;
                }

            }


            /* MINUS */

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


            /* REMOVE */

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
       PLACE ORDER
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                /* -----------------------------------------
                   CUSTOMER NAME
                ----------------------------------------- */

                const customerNameInput =
                    document.getElementById(
                        "customerName"
                    );


                /* -----------------------------------------
                   PHONE
                ----------------------------------------- */

                const phoneInput =
                    document.getElementById(
                        "phone"
                    );


                /* -----------------------------------------
                   ADDRESS
                ----------------------------------------- */

                const addressInput =
                    document.getElementById(
                        "address"
                    );


                /* -----------------------------------------
                   DELIVERY DATE
                ----------------------------------------- */

                const deliveryDateInput =
                    document.getElementById(
                        "deliveryDate"
                    );


                /* -----------------------------------------
                   READ VALUES
                ----------------------------------------- */

                const customerName =
                    customerNameInput
                        ? customerNameInput.value.trim()
                        : "";


                const phone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : "";


                const address =
                    addressInput
                        ? addressInput.value.trim()
                        : "";


                const deliveryDate =
                    deliveryDateInput
                        ? deliveryDateInput.value
                        : "";


                /* -----------------------------------------
                   VALIDATION
                ----------------------------------------- */

                if (!customerName) {

                    alert(
                        "Please enter your name."
                    );

                    if (customerNameInput) {
                        customerNameInput.focus();
                    }

                    return;
                }


                if (!phone) {

                    alert(
                        "Please enter your phone number."
                    );

                    if (phoneInput) {
                        phoneInput.focus();
                    }

                    return;
                }


                if (!address) {

                    alert(
                        "Please enter your delivery address."
                    );

                    if (addressInput) {
                        addressInput.focus();
                    }

                    return;
                }


                if (!deliveryDate) {

                    alert(
                        "Please select delivery date."
                    );

                    if (deliveryDateInput) {
                        deliveryDateInput.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   CART
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
                       IMPORTANT:
                       CUSTOMER NAME IS EXPLICITLY SENT
                    ------------------------------------- */

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
                        "Sending order:",
                        orderData
                    );


                    /* -------------------------------------
                       SEND TO SERVER
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


                    const rawText =
                        await response.text();


                    let data;

                    try {

                        data =
                            JSON.parse(
                                rawText
                            );

                    } catch (jsonError) {

                        throw new Error(
                            "Server returned invalid response."
                        );

                    }


                    if (
                        !response.ok ||
                        data.success === false
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to place order."
                        );

                    }


                    /* -------------------------------------
                       SUCCESS
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
                            data.orderId || "-";

                    }


                    if (successTotal) {

                        successTotal.textContent =
                            `₹${Number(
                                data.total || 0
                            ).toFixed(2)}`;

                    }


                    if (successDeliveryDate) {

                        successDeliveryDate.textContent =
                            data.deliveryDate ||
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
                       CLEAR PRODUCT QUANTITIES
                    ------------------------------------- */

                    productInputs.forEach(
                        input => {

                            input.value = 0;

                        }
                    );


                    updateCart();


                    /* -------------------------------------
                       CLEAR CUSTOMER FORM
                    ------------------------------------- */

                    if (customerNameInput) {
                        customerNameInput.value = "";
                    }

                    if (phoneInput) {
                        phoneInput.value = "";
                    }

                    if (addressInput) {
                        addressInput.value = "";
                    }

                    if (deliveryDateInput) {
                        deliveryDateInput.value = "";
                    }


                    console.log(
                        "Order placed successfully:",
                        data
                    );


                } catch (error) {

                    console.error(
                        "Order error:",
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