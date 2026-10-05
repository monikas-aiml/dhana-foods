const quantityInputs =
    document.querySelectorAll(".product-qty");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const orderForm =
    document.getElementById("orderForm");

const submitButton =
    document.getElementById("submitButton");

const successMessage =
    document.getElementById("successMessage");

const paymentOptions =
    document.querySelectorAll(
        'input[name="paymentMethod"]'
    );

const qrPaymentBox =
    document.getElementById("qrPaymentBox");


// =====================================
// GET SELECTED PRODUCTS
// =====================================

function getSelectedItems() {

    const items = [];

    quantityInputs.forEach(input => {

        const quantity =
            Number(input.value);

        if (quantity > 0) {

            const product =
                input.dataset.product;

            const size =
                input.dataset.size;

            const price =
                Number(input.dataset.price);

            items.push({
                product: product,
                size: size,
                quantity: quantity,
                price: price,
                total: price * quantity
            });
        }
    });

    return items;
}


// =====================================
// UPDATE CART
// =====================================

function updateCart() {

    const items =
        getSelectedItems();

    if (items.length === 0) {

        cartItems.innerHTML =
            "No products selected.";

        cartTotal.textContent =
            "Total: ₹0";

        return;
    }

    let total = 0;

    cartItems.innerHTML = "";


    items.forEach(item => {

        total += item.total;


        const div =
            document.createElement("div");

        div.className =
            "cart-item";


        div.innerHTML = `
            <span>
                ${item.product}
                (${item.size})
                × ${item.quantity}
            </span>

            <strong>
                ₹${item.total}
            </strong>
        `;


        cartItems.appendChild(div);

    });


    cartTotal.textContent =
        `Total: ₹${total}`;
}


// =====================================
// QUANTITY CHANGE
// =====================================

quantityInputs.forEach(input => {

    input.addEventListener(
        "input",
        updateCart
    );

});


// =====================================
// PAYMENT METHOD
// =====================================

paymentOptions.forEach(option => {

    option.addEventListener(
        "change",
        function () {

            if (this.value === "UPI") {

                qrPaymentBox.style.display =
                    "block";

            } else {

                qrPaymentBox.style.display =
                    "none";

            }

        }
    );

});


// =====================================
// PLACE ORDER
// =====================================

orderForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        // Get products
        const items =
            getSelectedItems();


        if (items.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }


        // Customer details
        const customerName =
            document
                .getElementById("customerName")
                .value
                .trim();


        const phone =
            document
                .getElementById("phone")
                .value
                .trim();


        const address =
            document
                .getElementById("address")
                .value
                .trim();


        const deliveryDate =
            document
                .getElementById("deliveryDate")
                .value;


        // Payment
        const selectedPayment =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!selectedPayment) {

            alert(
                "Please select a payment method."
            );

            return;
        }


        const paymentMethod =
            selectedPayment.value;


        // Disable button
        submitButton.disabled =
            true;

        submitButton.textContent =
            "Placing Order...";


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

                        body: JSON.stringify({

                            customerName:
                                customerName,

                            phone:
                                phone,

                            address:
                                address,

                            items:
                                items,

                            deliveryDate:
                                deliveryDate,

                            paymentMethod:
                                paymentMethod
                        })
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to place order."
                );
            }


            // =================================
            // SUCCESS MESSAGE
            // =================================

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

            const successPayment =
                document.getElementById(
                    "successPayment"
                );


            if (successOrderId) {

                successOrderId.textContent =
                    `#${result.orderId}`;
            }


            if (successTotal) {

                successTotal.textContent =
                    `₹${result.total}`;
            }


            if (successDeliveryDate) {

                successDeliveryDate.textContent =
                    deliveryDate;
            }


            if (successPayment) {

                successPayment.textContent =
                    paymentMethod === "UPI"
                        ? "UPI / QR Code"
                        : "Cash on Delivery";
            }


            if (successMessage) {

                successMessage.style.display =
                    "block";
            }


            // Reset form
            orderForm.reset();


            quantityInputs.forEach(input => {

                input.value = 0;

            });


            qrPaymentBox.style.display =
                "none";


            updateCart();


            // Scroll to success message
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });


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

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Place Order";
        }

    }
);


// =====================================
// INITIAL CART
// =====================================

updateCart();