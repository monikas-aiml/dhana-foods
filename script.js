document.addEventListener("DOMContentLoaded", () => {

    const orderForm = document.getElementById("orderForm");
    const cartItemsBox = document.getElementById("cartItems");
    const cartTotalBox = document.getElementById("cartTotal");
    const submitButton = document.getElementById("submitButton");

    let currentItems = [];


    // =====================================================
    // GET ALL PRODUCT QUANTITY INPUTS
    // =====================================================

    function getProductInputs() {
        return document.querySelectorAll(".product-qty");
    }


    // =====================================================
    // READ PRODUCTS FROM PAGE
    // =====================================================

    function collectItems() {

        const items = [];

        getProductInputs().forEach(input => {

            const quantity = Number(input.value) || 0;

            if (quantity <= 0) {
                return;
            }

            const product =
                input.dataset.product ||
                input.getAttribute("data-product");

            const size =
                input.dataset.size ||
                input.getAttribute("data-size");

            const price =
                Number(
                    input.dataset.price ||
                    input.getAttribute("data-price")
                ) || 0;


            if (!product || !size || price <= 0) {
                return;
            }


            items.push({
                product: product,
                size: size,
                quantity: quantity,
                price: price
            });

        });


        return items;
    }


    // =====================================================
    // UPDATE CART
    // =====================================================

    function updateCart() {

        currentItems = collectItems();

        renderCart();

    }


    // =====================================================
    // RENDER CART
    // =====================================================

    function renderCart() {

        if (!cartItemsBox) {
            return;
        }


        if (currentItems.length === 0) {

            cartItemsBox.innerHTML = `
                <div class="empty-cart">

                    🛒 Your cart is empty.

                    <br>

                    <span>
                        Select a batter above to add it to your order.
                    </span>

                </div>
            `;

            if (cartTotalBox) {
                cartTotalBox.textContent = "₹0";
            }

            return;
        }


        let total = 0;


        cartItemsBox.innerHTML = "";


        currentItems.forEach((item, index) => {

            const itemTotal =
                item.quantity * item.price;

            total += itemTotal;


            const row =
                document.createElement("div");

            row.className = "cart-item";


            row.innerHTML = `

                <div class="cart-item-info">

                    <strong>
                        ${escapeHTML(item.product)}
                    </strong>

                    <span>
                        ${escapeHTML(item.size)}
                    </span>

                </div>


                <div class="cart-item-qty">

                    <button
                        type="button"
                        class="cart-minus"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="cart-plus"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>


                <div class="cart-item-price">

                    ₹${itemTotal}

                </div>


                <button
                    type="button"
                    class="cart-remove"
                    data-index="${index}"
                    title="Remove"
                >
                    ✕
                </button>

            `;


            cartItemsBox.appendChild(row);

        });


        if (cartTotalBox) {

            cartTotalBox.textContent =
                `₹${total}`;

        }


        // Add buttons

        cartItemsBox
            .querySelectorAll(".cart-minus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(button.dataset.index);

                        changeQuantity(
                            currentItems[index],
                            -1
                        );

                    }
                );

            });


        cartItemsBox
            .querySelectorAll(".cart-plus")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(button.dataset.index);

                        changeQuantity(
                            currentItems[index],
                            1
                        );

                    }
                );

            });


        cartItemsBox
            .querySelectorAll(".cart-remove")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(button.dataset.index);

                        removeItem(
                            currentItems[index]
                        );

                    }
                );

            });

    }


    // =====================================================
    // CHANGE QUANTITY
    // =====================================================

    function changeQuantity(
        item,
        amount
    ) {

        getProductInputs().forEach(input => {

            const product =
                input.dataset.product;

            const size =
                input.dataset.size;


            if (
                product === item.product &&
                size === item.size
            ) {

                let newValue =
                    (Number(input.value) || 0)
                    + amount;


                if (newValue < 0) {
                    newValue = 0;
                }


                input.value = newValue;

            }

        });


        updateCart();

    }


    // =====================================================
    // REMOVE ITEM
    // =====================================================

    function removeItem(item) {

        getProductInputs().forEach(input => {

            const product =
                input.dataset.product;

            const size =
                input.dataset.size;


            if (
                product === item.product &&
                size === item.size
            ) {

                input.value = 0;

            }

        });


        updateCart();

    }


    // =====================================================
    // LISTEN TO QUANTITY CHANGES
    // =====================================================

    getProductInputs().forEach(input => {

        input.addEventListener(
            "input",
            updateCart
        );


        input.addEventListener(
            "change",
            updateCart
        );

    });


    // =====================================================
    // FORM SUBMIT
    // =====================================================

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                currentItems =
                    collectItems();


                if (
                    currentItems.length === 0
                ) {

                    alert(
                        "Please select at least one batter."
                    );

                    return;

                }


                const customerName =
                    document.getElementById(
                        "customerName"
                    )?.value.trim();


                const phone =
                    document.getElementById(
                        "phone"
                    )?.value.trim();


                const address =
                    document.getElementById(
                        "address"
                    )?.value.trim();


                const deliveryDate =
                    document.getElementById(
                        "deliveryDate"
                    )?.value;


                if (!customerName) {

                    alert(
                        "Please enter your name."
                    );

                    return;

                }


                if (!phone) {

                    alert(
                        "Please enter your phone number."
                    );

                    return;

                }


                if (!address) {

                    alert(
                        "Please enter your delivery address."
                    );

                    return;

                }


                if (!deliveryDate) {

                    alert(
                        "Please select a delivery date."
                    );

                    return;

                }


                const total =
                    currentItems.reduce(
                        (sum, item) =>
                            sum +
                            (
                                item.quantity *
                                item.price
                            ),
                        0
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "⏳ Placing Order...";

                }


                try {

                    const response =
                        await fetch(
                            "/api/orders",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        customerName:
                                            customerName,

                                        phone:
                                            phone,

                                        address:
                                            address,

                                        deliveryDate:
                                            deliveryDate,

                                        items:
                                            currentItems

                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to place order."
                        );

                    }


                    showSuccess(
                        data,
                        total,
                        deliveryDate
                    );


                    orderForm.reset();


                    currentItems = [];


                    updateCart();


                } catch (error) {

                    console.error(
                        "Order error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to place order."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "🥣 Place Order";

                    }

                }

            }
        );

    }


    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    function showSuccess(
        data,
        total,
        deliveryDate
    ) {

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


        const successMessage =
            document.getElementById(
                "successMessage"
            );


        if (successOrderId) {

            successOrderId.textContent =
                data.orderId ||
                data.id ||
                "-";

        }


        if (successTotal) {

            successTotal.textContent =
                `₹${data.total || total}`;

        }


        if (successDeliveryDate) {

            successDeliveryDate.textContent =
                deliveryDate;

        }


        if (successMessage) {

            successMessage.style.display =
                "block";

            successMessage.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } else {

            alert(
                `Order placed successfully! Order #${
                    data.orderId || data.id || ""
                }`
            );

        }

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // INITIAL CART
    // =====================================================

    updateCart();

});