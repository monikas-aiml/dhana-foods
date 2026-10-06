document.addEventListener("DOMContentLoaded", function () {

    const orderForm =
        document.getElementById("orderForm");

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    const submitButton =
        document.getElementById("submitButton");


    /* =====================================================
       CART
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


    function updateCart() {

        const items =
            getCartItems();


        let total = 0;


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
                item.quantity *
                item.price;


            total += itemTotal;


            html += `
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:10px 0;
                        border-bottom:1px solid #eee;
                    "
                >

                    <div>

                        <strong>
                            ${item.product}
                        </strong>

                        <br>

                        <small>
                            ${item.size}
                            ×
                            ${item.quantity}
                        </small>

                    </div>

                    <div>

                        ₹${itemTotal}

                    </div>

                </div>
            `;

        });


        cartItems.innerHTML =
            html;


        cartTotal.textContent =
            `Total: ₹${total}`;
    }


    /* =====================================================
       PRODUCT INPUTS
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
       ORDER SUBMIT
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                /* -----------------------------------------
                   CUSTOMER FIELDS
                ----------------------------------------- */

                const customerNameInput =
                    document.getElementById(
                        "customerName"
                    );


                const phoneInput =
                    document.getElementById(
                        "phone"
                    );


                const addressInput =
                    document.getElementById(
                        "address"
                    );


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
                        "Please enter your Customer Name."
                    );

                    customerNameInput?.focus();

                    return;
                }


                if (!phone) {

                    alert(
                        "Please enter your Phone Number."
                    );

                    phoneInput?.focus();

                    return;
                }


                if (!address) {

                    alert(
                        "Please enter your Delivery Address."
                    );

                    addressInput?.focus();

                    return;
                }


                if (!deliveryDate) {

                    alert(
                        "Please select your Delivery Date."
                    );

                    deliveryDateInput?.focus();

                    return;
                }


                /* -----------------------------------------
                   PRODUCTS
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
                   ORDER DATA
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
                    "SENDING ORDER:",
                    orderData
                );


                /* -----------------------------------------
                   BUTTON
                ----------------------------------------- */

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Placing Order...";

                }


                try {

                    const response =
                        await fetch(
                            "/api/orders",
                            {

                                method:
                                    "POST",

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


                    const text =
                        await response.text();


                    console.log(
                        "SERVER RESPONSE:",
                        text
                    );


                    let result;


                    try {

                        result =
                            JSON.parse(text);

                    } catch {

                        throw new Error(
                            "Invalid server response."
                        );

                    }


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Unable to place order."
                        );

                    }


                    if (
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to place order."
                        );

                    }


                    /* -----------------------------------------
                       SUCCESS BOX
                    ----------------------------------------- */

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
                            result.orderId;

                    }


                    if (successTotal) {

                        successTotal.textContent =
                            "₹" +
                            Number(
                                result.total
                            ).toFixed(2);

                    }


                    if (successDeliveryDate) {

                        successDeliveryDate.textContent =
                            result.deliveryDate;

                    }


                    if (successMessage) {

                        successMessage.style.display =
                            "block";

                        successMessage.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }


                    /* -----------------------------------------
                       CLEAR CART
                    ----------------------------------------- */

                    document
                        .querySelectorAll(".product-qty")
                        .forEach(function (input) {

                            input.value = "0";

                        });


                    updateCart();


                    /* -----------------------------------------
                       CLEAR CUSTOMER DETAILS
                    ----------------------------------------- */

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


                } catch (error) {

                    console.error(
                        "ORDER ERROR:",
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