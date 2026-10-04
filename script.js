const form = document.getElementById("orderForm");
const product = document.getElementById("product");
const quantity = document.getElementById("quantity");
const priceDisplay = document.getElementById("priceDisplay");
const successMessage = document.getElementById("successMessage");

const prices = {
    "Adai Batter": { "500g": 40, "1kg": 80 },
    "Mappilai Samba": { "500g": 40, "1kg": 80 },
    "Appam Batter": { "500g": 30, "1kg": 60 },
    "Poongar": { "500g": 40, "1kg": 80 },
    "Millet Batter": { "500g": 40, "1kg": 80 },
    "Karupu Gavuni": { "500g": 40, "1kg": 80 },
    "Keerai Batter": { "500g": 40, "1kg": 80 },
    "Kaatu Yaanam": { "500g": 40, "1kg": 80 },
    "Karunguruvai": { "500g": 40, "1kg": 80 },
    "Pacha Payiru": { "500g": 40, "1kg": 80 },
    "Ragi Batter": { "500g": 40, "1kg": 80 }
};

function updatePrice() {
    const selectedProduct = product.value;
    const selectedQuantity = quantity.value;

    if (selectedProduct && selectedQuantity) {
        priceDisplay.textContent =
            `Price: ₹${prices[selectedProduct][selectedQuantity]}`;
    } else {
        priceDisplay.textContent = "";
    }
}

product.addEventListener("change", updatePrice);
quantity.addEventListener("change", updatePrice);

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const selectedProduct = product.value;
    const selectedQuantity = quantity.value;
    const date = document.getElementById("deliveryDate").value;

    if (!name || !phone || !address || !selectedProduct || !selectedQuantity || !date) {
        alert("Please fill all details.");
        return;
    }

    const price = prices[selectedProduct][selectedQuantity];

    const orderData = {
        customerName: name,
        phone: phone,
        address: address,
        product: selectedProduct,
        quantity: selectedQuantity,
        price: price,
        deliveryDate: date
    };

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const sellerNumber = "919498352613";

        const message =
            `🌾 *DHANA FOODS - NEW ORDER* 🌾\n\n` +
            `🆔 Order ID: #${result.orderId}\n` +
            `👤 Name: ${name}\n` +
            `📞 Phone: ${phone}\n` +
            `📍 Address: ${address}\n` +
            `🥣 Product: ${selectedProduct}\n` +
            `⚖️ Quantity: ${selectedQuantity}\n` +
            `💰 Price: ₹${price}\n` +
            `📅 Delivery Date: ${date}\n\n` +
            `Thank you for ordering from Dhana Foods! ❤️`;

        const whatsappURL =
            `https://wa.me/${sellerNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");

        successMessage.textContent =
            `✅ Order #${result.orderId} placed successfully!`;

        successMessage.style.display = "block";

        form.reset();
        priceDisplay.textContent = "";

    } catch (error) {
        console.error(error);
        alert("Unable to place order. Please make sure the server is running.");
    }
});