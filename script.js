/* =========================================================
   DHANA FOODS - CUSTOMER ORDER SCRIPT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =====================================================
           ELEMENTS
        ===================================================== */

        const orderForm =
            document.getElementById(
                "orderForm"
            );


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


        const cartItemsElement =
            document.getElementById(
                "cartItems"
            );


        const cartTotalElement =
            document.getElementById(
                "cartTotal"
            );


        const submitButton =
            document.getElementById(
                "submitButton"
            );


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


        /* =====================================================
           CART
        ===================================================== */

        let cart = [];


        /* =====================================================
           PRODUCT PRICE LIST

           These prices must match server.js
        ===================================================== */

        const PRODUCT_PRICES = {

            "Idli Batter": {
                "500g": 20,
                "1kg": 40
            },

            "Dosa Batter": {
                "500g": 20,
                "1kg": 40
            },

            "Adai Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Mappilai Samba Batter": {
                "500g": 60,
                "1kg": 120
            },

            "Appam Batter": {
                "500g": 30,
                "1kg": 60
            },

            "Millet Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Poonghar Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Karuppu Kavuni Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Keerai Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Kambu Yasnam Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Ragi Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Karunguruvai Batter": {
                "500g": 40,
                "1kg": 80
            },

            "Pachai Payiru Batter": {
                "500g": 40,
                "1kg": 80
            }

        };


        /* =====================================================
           PRODUCT NAME ALIASES
        ===================================================== */

        const PRODUCT_ALIASES = {

            "idli batter":
                "Idli Batter",

            "dosa batter":
                "Dosa Batter",

            "adai batter":
                "Adai Batter",

            "mappilai samba":
                "Mappilai Samba Batter",

            "mappilai samba batter":
                "Mappilai Samba Batter",

            "appam batter":
                "Appam Batter",

            "millet batter":
                "Millet Batter",

            "poongar":
                "Poonghar Batter",

            "poongar batter":
                "Poonghar Batter",

            "poonghar":
                "Poonghar Batter",

            "poonghar batter":
                "Poonghar Batter",

            "karupu kavuni":
                "Karuppu Kavuni Batter",

            "karupu kavuni batter":
                "Karuppu Kavuni Batter",

            "karuppu kavuni":
                "Karuppu Kavuni Batter",

            "karuppu kavuni batter":
                "Karuppu Kavuni Batter",

            "keerai batter":
                "Keerai Batter",

            "kambu yasnam":
                "Kambu Yasnam Batter",

            "kambu yasnam batter":
                "Kambu Yasnam Batter",

            "ragi batter":
                "Ragi Batter",

            "karinagaruvai":
                "Karunguruvai Batter",

            "karinagaruvai batter":
                "Karunguruvai Batter",

            "karunaguvrai":
                "Karunguruvai Batter",

            "karunaguvrai batter":
                "Karunguruvai Batter",

            "karunguruvai":
                "Karunguruvai Batter",

            "karunguruvai batter":
                "Karunguruvai Batter",

            "pachai payiru":
                "Pachai Payiru Batter",

            "pachai payiru batter":
                "Pachai Payiru Batter"

        };


        /* =====================================================
           NORMALIZE PRODUCT NAME
        ===================================================== */

        function normalizeProductName(
            product
        ) {

            const original =
                String(
                    product || ""
                ).trim();


            const key =
                original.toLowerCase();


            return (
                PRODUCT_ALIASES[key] ||
                original
            );

        }


        /* =====================================================
           ESCAPE HTML
        ===================================================== */

        function escapeHtml(
            value
        ) {

            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        /* =====================================================
           FIND PRODUCT BUTTONS
        ===================================================== */

        const productButtons =
            document.querySelectorAll(
                ".add-to-cart"
            );


        productButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const product =
                            normalizeProductName(
                                button.dataset.product ||
                                button.getAttribute(
                                    "data-product"
                                ) ||
                                ""
                            );


                        const size =
                            button.dataset.size ||
                            button.getAttribute(
                                "data-size"
                            ) ||
                            "";


                        let price =
                            Number(
                                button.dataset.price ||
                                button.getAttribute(
                                    "data-price"
                                )
                            );


                        /*
                           If button doesn't have
                           a price, get official price
                           from PRODUCT_PRICES.
                        */

                        if (
                            !Number.isFinite(
                                price
                            ) ||
                            price <= 0
                        ) {

                            if (
                                PRODUCT_PRICES[
                                    product
                                ] &&
                                PRODUCT_PRICES[
                                    product
                                ][size] !== undefined
                            ) {

                                price =
                                    PRODUCT_PRICES[
                                        product
                                    ][size];

                            }

                        }


                        if (
                            !product ||
                            !size
                        ) {

                            alert(
                                "Please select a product and size."
                            );

                            return;

                        }


                        if (
                            !Number.isFinite(
                                price
                            ) ||
                            price <= 0
                        ) {

                            alert(
                                "Unable to find the product price."
                            );

                            return;

                        }


                        addToCart(
                            product,
                            size,
                            price
                        );

                    }
                );

            }
        );


        /* =====================================================
           ADD TO CART
        ===================================================== */

        function addToCart(
            product,
            size,
            price
        ) {

            const existingItem =
                cart.find(
                    function (item) {

                        return (
                            item.product === product &&
                            item.size === size
                        );

                    }
                );


            if (existingItem) {

                existingItem.quantity += 1;

            } else {

                cart.push({

                    product:
                        product,

                    size:
                        size,

                    price:
                        price,

                    quantity:
                        1

                });

            }


            updateCart();

        }


        /* =====================================================
           REMOVE FROM CART
        ===================================================== */

        function removeFromCart(
            index
        ) {

            if (
                index < 0 ||
                index >= cart.length
            ) {

                return;

            }


            cart.splice(
                index,
                1
            );


            updateCart();

        }


        /* =====================================================
           CHANGE QUANTITY
        ===================================================== */

        function changeQuantity(
            index,
            change
        ) {

            if (
                !cart[index]
            ) {

                return;

            }


            cart[index].quantity +=
                change;


            if (
                cart[index].quantity <= 0
            ) {

                cart.splice(
                    index,
                    1
                );

            }


            updateCart();

        }


        /* =====================================================
           UPDATE CART
        ===================================================== */

        function updateCart() {

            if (
                !cartItemsElement ||
                !cartTotalElement
            ) {

                return;

            }


            if (
                cart.length === 0
            ) {

                cartItemsElement.innerHTML =
                    "No products selected.";


                cartTotalElement.textContent =
                    "Total: ₹0";


                return;

            }


            let total = 0;


            let html = "";


            cart.forEach(
                function (
                    item,
                    index
                ) {

                    const itemTotal =
                        item.price *
                        item.quantity;


                    total +=
                        itemTotal;


                    html += `

                        <div class="cart-item">

                            <div class="cart-item-info">

                                <strong>
                                    ${escapeHtml(
                                        item.product
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        item.size
                                    )}
                                </span>

                                <span>
                                    ₹${item.price}
                                    ×
                                    ${item.quantity}
                                </span>

                            </div>


                            <div class="cart-item-actions">

                                <button
                                    type="button"
                                    onclick="changeCartQuantity(
                                        ${index},
                                        -1
                                    )"
                                >
                                    −
                                </button>


                                <span>
                                    ${item.quantity}
                                </span>


                                <button
                                    type="button"
                                    onclick="changeCartQuantity(
                                        ${index},
                                        1
                                    )"
                                >
                                    +
                                </button>


                                <button
                                    type="button"
                                    onclick="removeCartItem(
                                        ${index}
                                    )"
                                >
                                    ✕
                                </button>

                            </div>


                            <div class="cart-item-total">

                                ₹${itemTotal}

                            </div>

                        </div>

                    `;

                }
            );


            cartItemsElement.innerHTML =
                html;


            cartTotalElement.textContent =
                `Total: ₹${total}`;

        }


        /* =====================================================
           GLOBAL CART FUNCTIONS

           Needed because cart buttons use onclick.
        ===================================================== */

        window.changeCartQuantity =
            function (
                index,
                change
            ) {

                changeQuantity(
                    index,
                    change
                );

            };


        window.removeCartItem =
            function (
                index
            ) {

                removeFromCart(
                    index
                );

            };


        /* =====================================================
           CALCULATE CART TOTAL
        ===================================================== */

        function calculateCartTotal() {

            return cart.reduce(
                function (
                    total,
                    item
                ) {

                    return (
                        total +
                        (
                            Number(
                                item.price
                            ) *
                            Number(
                                item.quantity
                            )
                        )
                    );

                },
                0
            );

        }


        /* =====================================================
           FORM SUBMIT
        ===================================================== */

        if (
            orderForm
        ) {

            orderForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    /* =========================================
                       READ CUSTOMER DETAILS AT SUBMIT TIME

                       IMPORTANT:
                       We read the current values here,
                       not when the page loads.
                    ========================================= */

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


                    /* =========================================
                       VALIDATE CUSTOMER NAME
                    ========================================= */

                    if (
                        !customerName
                    ) {

                        alert(
                            "Please enter your name."
                        );


                        if (
                            customerNameInput
                        ) {

                            customerNameInput.focus();

                        }


                        return;

                    }


                    /* =========================================
                       VALIDATE PHONE
                    ========================================= */

                    if (
                        !phone
                    ) {

                        alert(
                            "Please enter your phone number."
                        );


                        if (
                            phoneInput
                        ) {

                            phoneInput.focus();

                        }


                        return;

                    }


                    /* =========================================
                       VALIDATE ADDRESS
                    ========================================= */

                    if (
                        !address
                    ) {

                        alert(
                            "Please enter your delivery address."
                        );


                        if (
                            addressInput
                        ) {

                            addressInput.focus();

                        }


                        return;

                    }


                    /* =========================================
                       VALIDATE DELIVERY DATE
                    ========================================= */

                    if (
                        !deliveryDate
                    ) {

                        alert(
                            "Please select a delivery date."
                        );


                        if (
                            deliveryDateInput
                        ) {

                            deliveryDateInput.focus();

                        }


                        return;

                    }


                    /* =========================================
                       VALIDATE CART
                    ========================================= */

                    if (
                        cart.length === 0
                    ) {

                        alert(
                            "Please select at least one product."
                        );


                        return;

                    }


                    /* =========================================
                       CREATE CLEAN ORDER ITEMS
                    ========================================= */

                    const items =
                        cart.map(
                            function (
                                item
                            ) {

                                return {

                                    product:
                                        normalizeProductName(
                                            item.product
                                        ),

                                    size:
                                        item.size,

                                    quantity:
                                        Number(
                                            item.quantity
                                        ),

                                    price:
                                        Number(
                                            item.price
                                        )

                                };

                            }
                        );


                    /* =========================================
                       FINAL TOTAL

                       This is only displayed locally.
                       Server calculates the official total.
                    ========================================= */

                    const localTotal =
                        calculateCartTotal();


                    /* =========================================
                       ORDER DATA

                       THIS IS THE IMPORTANT FIX.

                       Customer name and delivery date
                       are explicitly included here.
                    ========================================= */

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


                    /* =========================================
                       DISABLE BUTTON
                    ========================================= */

                    if (
                        submitButton
                    ) {

                        submitButton.disabled =
                            true;


                        submitButton.textContent =
                            "Placing Order...";

                    }


                    try {

                        /* =====================================
                           SEND TO SERVER
                        ===================================== */

                        const response =
                            await fetch(
                                "/api/orders",
                                {

                                    method:
                                        "POST",

                                    headers: {

                                        "Content-Type":
                                            "application/json"

                                    },

                                    body:
                                        JSON.stringify(
                                            orderData
                                        )

                                }
                            );


                        /* =====================================
                           READ SERVER RESPONSE
                        ===================================== */

                        const data =
                            await response.json();


                        console.log(
                            "Server response:",
                            data
                        );


                        /* =====================================
                           CHECK RESPONSE
                        ===================================== */

                        if (
                            !response.ok ||
                            !data.success
                        ) {

                            throw new Error(

                                data.message ||
                                "Unable to place order."

                            );

                        }


                        /* =====================================
                           SUCCESS VALUES
                        ===================================== */

                        const orderId =
                            data.orderId;


                        const serverTotal =
                            Number(
                                data.total
                            );


                        const finalTotal =
                            Number.isFinite(
                                serverTotal
                            )
                                ? serverTotal
                                : localTotal;


                        const serverDeliveryDate =
                            data.deliveryDate ||
                            deliveryDate;


                        /* =====================================
                           SHOW SUCCESS INFORMATION
                        ===================================== */

                        if (
                            successOrderId
                        ) {

                            successOrderId.textContent =
                                orderId;

                        }


                        if (
                            successTotal
                        ) {

                            successTotal.textContent =
                                `₹${finalTotal}`;

                        }


                        if (
                            successDeliveryDate
                        ) {

                            successDeliveryDate.textContent =
                                serverDeliveryDate;

                        }


                        if (
                            successMessage
                        ) {

                            successMessage.style.display =
                                "block";

                        }


                        /* =====================================
                           RESET CART
                        ===================================== */

                        cart = [];


                        updateCart();


                        /* =====================================
                           RESET FORM
                        ===================================== */

                        orderForm.reset();


                        /* =====================================
                           SCROLL TO SUCCESS MESSAGE
                        ===================================== */

                        if (
                            successMessage
                        ) {

                            successMessage.scrollIntoView({

                                behavior:
                                    "smooth",

                                block:
                                    "center"

                            });

                        }


                    } catch (
                        error
                    ) {

                        console.error(
                            "Order error:",
                            error
                        );


                        alert(
                            error.message ||
                            "Unable to place order. Please try again."
                        );


                    } finally {

                        /* =====================================
                           ENABLE BUTTON AGAIN
                        ===================================== */

                        if (
                            submitButton
                        ) {

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


        /* =====================================================
           MINIMUM DELIVERY DATE
        ===================================================== */

        if (
            deliveryDateInput
        ) {

            /*
               Prevent selecting a past date.
            */

            const today =
                new Date();


            const year =
                today.getFullYear();


            const month =
                String(
                    today.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const day =
                String(
                    today.getDate()
                ).padStart(
                    2,
                    "0"
                );


            const todayString =
                `${year}-${month}-${day}`;


            deliveryDateInput.min =
                todayString;

        }


    }
);