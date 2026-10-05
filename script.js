document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Dhana Foods script loaded");

    // =========================================================
    // ELEMENTS
    // =========================================================

    const orderForm = document.getElementById("orderForm");
    const cartItemsBox = document.getElementById("cartItems");
    const cartTotalBox = document.getElementById("cartTotal");
    const submitButton = document.getElementById("submitButton");

    const productInputs = document.querySelectorAll(".product-qty");

    console.log("🛒 Product inputs found:", productInputs.length);

    // =========================================================
    // CART
    // =========================================================

    function getCartItems() {

        const items = [];

        document.querySelectorAll(".product-qty").forEach(input => {

            const quantity = parseInt(input.value, 10) || 0;

            if (quantity <= 0) {
                return;
            }

            const product = input.dataset.product;
            const size = input.dataset.size;
            const price = Number(input.dataset.price);

            if (!product || !size || !price) {
                console.warn(
                    "Invalid product input:",
                    input
                );
                return;
            }

            items.push({
                product: product,
                size: size,
                quantity: quantity,
                price: price,
                subtotal: price * quantity
            });
        });

        return items;
    }

    // =========================================================
    // UPDATE CART
    // =========================================================

    function updateCart() {

        if (!cartItemsBox || !cartTotalBox) {
            console.error(
                "❌ Cart elements not found."
            );
            return;
        }

        const items = getCartItems();

        // Empty cart
        if (items.length === 0) {

            cartItemsBox.innerHTML = `
                <div class="empty-cart">
                    🛒 Your cart is empty.
                    <br>
                    <small>
                        Select a batter above to add it to your order.
                    </small>
                </div>
            `;

            cartTotalBox.textContent = "Total: ₹0";

            return;
        }

        let total = 0;

        let html = "";

        items.forEach((item, index) => {

            total += item.subtotal;

            html += `
                <div
                    class="cart-item"
                    data-index="${index}"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:15px;
                        padding:15px 0;
                        border-bottom:1px solid #ead2bc;
                    "
                >

                    <div style="flex:1;">
                        <strong>
                            ${escapeHTML(item.product)}
                        </strong>

                        <div
                            style="
                                margin-top:5px;
                                color:#777;
                                font-size:14px;
                            "
                        >
                            ${escapeHTML(item.size)}
                            ×
                            ${item.quantity}
                        </div>

                        <div
                            style="
                                margin-top:5px;
                                font-weight:bold;
                            "
                        >
                            ₹${item.subtotal}
                        </div>
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
                            data-product="${escapeAttribute(item.product)}"
                            data-size="${escapeAttribute(item.size)}"
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

                        <span
                            style="
                                min-width:25px;
                                text-align:center;
                                font-weight:bold;
                            "
                        >
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            class="cart-plus"
                            data-product="${escapeAttribute(item.product)}"
                            data-size="${escapeAttribute(item.size)}"
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

                        <button
                            type="button"
                            class="cart-remove"
                            data-product="${escapeAttribute(item.product)}"
                            data-size="${escapeAttribute(item.size)}"
                            style="
                                margin-left:8px;
                                border:none;
                                background:transparent;
                                color:#b00000;
                                font-size:20px;
                                cursor:pointer;
                            "
                            title="Remove"
                        >
                            ×
                        </button>

                    </div>

                </div>
            `;
        });

        cartItemsBox.innerHTML = html;

        cartTotalBox.textContent =
            `Total: ₹${total}`;
    }

    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {

        return escapeHTML(value);
    }

    // =========================================================
    // CHANGE QUANTITY
    // =========================================================

    productInputs.forEach(input => {

        input.addEventListener("input", () => {

            let value = parseInt(input.value, 10);

            if (isNaN(value) || value < 0) {
                value = 0;
            }

            if (value > 100) {
                value = 100;
            }

            input.value = value;

            updateCart();
        });

        input.addEventListener("change", () => {

            let value = parseInt(input.value, 10);

            if (isNaN(value) || value < 0) {
                value = 0;
            }

            if (value > 100) {
                value = 100;
            }

            input.value = value;

            updateCart();
        });
    });

    // =========================================================
    // CART BUTTONS
    // =========================================================

    document.addEventListener("click", event => {

        const plusButton =
            event.target.closest(".cart-plus");

        const minusButton =
            event.target.closest(".cart-minus");

        const removeButton =
            event.target.closest(".cart-remove");

        // ---------------------------------------------
        // PLUS
        // ---------------------------------------------

        if (plusButton) {

            const product =
                plusButton.dataset.product;

            const size =
                plusButton.dataset.size;

            const input =
                findProductInput(product, size);

            if (input) {

                let quantity =
                    parseInt(input.value, 10) || 0;

                if (quantity < 100) {
                    quantity++;
                }

                input.value = quantity;

                updateCart();
            }

            return;
        }

        // ---------------------------------------------
        // MINUS
        // ---------------------------------------------

        if (minusButton) {

            const product =
                minusButton.dataset.product;

            const size =
                minusButton.dataset.size;

            const input =
                findProductInput(product, size);

            if (input) {

                let quantity =
                    parseInt(input.value, 10) || 0;

                quantity--;

                if (quantity < 0) {
                    quantity = 0;
                }

                input.value = quantity;

                updateCart();
            }

            return;
        }

        // ---------------------------------------------
        // REMOVE
        // ---------------------------------------------

        if (removeButton) {

            const product =
                removeButton.dataset.product;

            const size =
                removeButton.dataset.size;

            const input =
                findProductInput(product, size);

            if (input) {
                input.value = 0;
                updateCart();
            }

            return;
        }

    });

    // =========================================================
    // FIND PRODUCT INPUT
    // =========================================================

    function findProductInput(product, size) {

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

    // =========================================================
    // FORM SUBMISSION
    // =========================================================

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                console.log(
                    "📦 Order form submitted"
                );

                const items = getCartItems();

                // -----------------------------------------
                // CHECK CART
                // -----------------------------------------

                if (items.length === 0) {

                    alert(
                        "Please add at least one product to your cart."
                    );

                    return;
                }

                // -----------------------------------------
                // CUSTOMER DETAILS
                // -----------------------------------------

                const customerName =
                    document
                        .getElementById("customerName")
                        ?.value
                        .trim();

                const phone =
                    document
                        .getElementById("phone")
                        ?.value
                        .trim();

                const address =
                    document
                        .getElementById("address")
                        ?.value
                        .trim();

                const deliveryDate =
                    document
                        .getElementById("deliveryDate")
                        ?.value;

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

                if (!/^\d{10}$/.test(phone)) {

                    alert(
                        "Please enter a valid 10-digit mobile number."
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

                // -----------------------------------------
                // TOTAL
                // -----------------------------------------

                const total =
                    items.reduce(
                        (sum, item) =>
                            sum + item.subtotal,
                        0
                    );

                // -----------------------------------------
                // BUTTON
                // -----------------------------------------

                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "⏳ Placing Order...";
                }

                try {

                    console.log(
                        "Sending order:",
                        {
                            customerName,
                            phone,
                            address,
                            deliveryDate,
                            items,
                            total
                        }
                    );

                    // -------------------------------------
                    // SEND TO SERVER
                    // -------------------------------------

                    const response =
                        await fetch(
                            "/api/orders",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    customerName,
                                    phone,
                                    address,
                                    deliveryDate,
                                    items
                                })
                            }
                        );

                    const data =
                        await response.json();

                    console.log(
                        "Server response:",
                        data
                    );

                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to place order."
                        );
                    }

                    if (!data.success) {

                        throw new Error(
                            data.message ||
                            "Order failed."
                        );
                    }

                    // -------------------------------------
                    // ORDER NUMBER
                    // -------------------------------------

                    const orderId =
                        data.orderId ??
                        data.id ??
                        data.order?.id ??
                        "-";

                    const orderTotal =
                        data.total ??
                        data.order?.total ??
                        total;

                    const orderDeliveryDate =
                        data.deliveryDate ??
                        data.order?.deliveryDate ??
                        deliveryDate;

                    // -------------------------------------
                    // SUCCESS MESSAGE
                    // -------------------------------------

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
                            orderId;
                    }

                    if (successTotal) {

                        successTotal.textContent =
                            `₹${orderTotal}`;
                    }

                    if (successDeliveryDate) {

                        successDeliveryDate.textContent =
                            orderDeliveryDate;
                    }

                    if (successMessage) {

                        successMessage.style.display =
                            "block";

                        successMessage.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                    }

                    // -------------------------------------
                    // CLEAR CART
                    // -------------------------------------

                    document
                        .querySelectorAll(".product-qty")
                        .forEach(input => {
                            input.value = 0;
                        });

                    updateCart();

                    // -------------------------------------
                    // RESET FORM
                    // -------------------------------------

                    orderForm.reset();

                    console.log(
                        "✅ Order placed successfully:",
                        orderId
                    );

                    // -------------------------------------
                    // BUTTON
                    // -------------------------------------

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "🛒 Place Order";
                    }

                } catch (error) {

                    console.error(
                        "❌ Order error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Something went wrong while placing your order."
                    );

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "🛒 Place Order";
                    }
                }
            }
        );
    }

    // =========================================================
    // INITIAL CART
    // =========================================================

    updateCart();

});