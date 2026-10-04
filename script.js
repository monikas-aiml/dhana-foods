const form = document.getElementById("orderForm");
const successMessage = document.getElementById("successMessage");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");


// ================================
// PRODUCT QUANTITY INPUTS
// ================================

const quantityInputs = document.querySelectorAll(".product-qty");


// ================================
// UPDATE CART
// ================================

function updateCart() {

    let total = 0;
    let items = [];

    quantityInputs.forEach(input => {

        const quantity = parseInt(input.value) || 0;

        if (quantity > 0) {

            const product = input.dataset.product;
            const size = input.dataset.size;
            const price = Number(input.dataset.price);

            const itemTotal = price * quantity;

            total += itemTotal;

            items.push({
                product: product,
                size: size,
                quantity: quantity,
                price: price,
                total: itemTotal
            });
        }
    });


    // Clear cart display
    cartItems.innerHTML = "";


    // No products
    if (items.length === 0) {

        cartItems.innerHTML =
            "<p>No products selected.</p>";

        cartTotal.textContent = "0";

        return;
    }


    // Display selected products
    items.forEach(item => {

        const itemElement = document.createElement("div");

        itemElement.className = "cart-item";

        itemElement.innerHTML = `
            <p>
                <strong>${item.product}</strong>
                - ${item.size}
            </p>

            <p>
                ₹${item.price} × ${item.quantity}
                = <strong>₹${item.total}</strong>
            </p>
        `;

        cartItems.appendChild(itemElement);
    });


    // Display total
    cartTotal.textContent = total;
}


// ================================
// LISTEN FOR QUANTITY CHANGES
// ================================

quantityInputs.forEach(input => {

    input.addEventListener("input", updateCart);

    input.addEventListener("change", updateCart);

});


// ================================
// GET SELECTED ITEMS
// ================================

function getSelectedItems() {

    const items = [];

    quantityInputs.forEach(input => {

        const quantity = parseInt(input.value) || 0;

        if (quantity > 0) {

            items.push({
                product: input.dataset.product,
                size: input.dataset.size,
                quantity: quantity,
                price: Number(input.dataset.price),
                total:
                    Number(input.dataset.price) * quantity
            });
        }
    });

    return items;
}


// ================================
// PLACE ORDER
// ================================

form.addEventListener("submit", async function(event) {

    event.preventDefault();


    // Customer details
    const name =
        document.getElementById("customerName")
            .value
            .trim();

    const phone =
        document.getElementById("phone")
            .value
            .trim();

    const address =
        document.getElementById("address")
            .value
            .trim();

    const deliveryDate =
        document.getElementById("deliveryDate")
            .value;


    // Get cart items
    const items = getSelectedItems();


    // Validate customer details
    if (!name || !phone || !address || !deliveryDate) {

        alert("Please fill all customer details.");

        return;
    }


    // Validate products
    if (items.length === 0) {

        alert("Please select at least one product.");

        return;
    }


    // Calculate total
    const total = items.reduce(
        (sum, item) => sum + item.total,
        0
    );


    // ================================
    // ORDER DATA
    // ================================

    const orderData = {

        customerName: name,

        phone: phone,

        address: address,

        items: items,

        total: total,

        deliveryDate: deliveryDate

    };


    // Disable button while submitting
    const submitButton =
        form.querySelector("button[type='submit']");

    submitButton.disabled = true;

    submitButton.textContent =
        "Placing Order...";


    try {

        // ================================
        // SEND TO SERVER
        // ================================

        const response = await fetch("/api/orders", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(orderData)

        });


        if (!response.ok) {

            throw new Error(
                "Server returned an error."
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to place order."
            );
        }


        // ================================
        // SUCCESS
        // ================================

        successMessage.innerHTML = `

            <div class="order-success">

                <h2>✅ Order Placed Successfully!</h2>

                <p>
                    Thank you, ${name}!
                </p>

                <p>
                    <strong>Order Number:</strong>
                    #${result.orderId}
                </p>

                <p>
                    <strong>Total:</strong>
                    ₹${total}
                </p>

                <p>
                    <strong>Delivery Date:</strong>
                    ${deliveryDate}
                </p>

                <p>
                    Your order has been received.
                </p>

            </div>

        `;


        successMessage.style.display = "block";


        // Reset form
        form.reset();


        // Reset cart
        updateCart();


        // Scroll to success message
        successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        console.error(
            "Order error:",
            error
        );


        alert(
            "Unable to place order. Please try again."
        );


    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            "Place Order";

    }

});


// ================================
// INITIAL CART
// ================================

updateCart();