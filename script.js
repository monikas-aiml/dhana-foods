/* =========================================================
   DHANA FOODS - CUSTOMER SCRIPT
   Version 14
   ========================================================= */

console.log("Dhana Foods customer script v14 loaded.");

/* =========================================================
   OFFICIAL PRODUCT PRICES
   ========================================================= */

const PRODUCTS = {
  "Idli Batter": {
    "500g": 25,
    "1kg": 45
  },

  "Dosa Batter": {
    "500g": 25,
    "1kg": 45
  },

  "Adai Batter": {
    "500g": 40,
    "1kg": 80
  },

  "Mappilai Samba Batter": {
    "500g": 40,
    "1kg": 80
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


/* =========================================================
   PRODUCT ALIASES
   Allows old/alternate spellings to work
   ========================================================= */

const PRODUCT_ALIASES = {

  "idli": "Idli Batter",
  "idli batter": "Idli Batter",

  "dosa": "Dosa Batter",
  "dosa batter": "Dosa Batter",

  "adai": "Adai Batter",
  "adai batter": "Adai Batter",

  "mappilai samba": "Mappilai Samba Batter",
  "mappilai samba batter": "Mappilai Samba Batter",

  "mapillai samba": "Mappilai Samba Batter",
  "mapillai samba batter": "Mappilai Samba Batter",

  "appam": "Appam Batter",
  "appam batter": "Appam Batter",

  "millet": "Millet Batter",
  "millet batter": "Millet Batter",

  "poonghar": "Poonghar Batter",
  "poonghar batter": "Poonghar Batter",

  "poongar": "Poonghar Batter",
  "poongar batter": "Poonghar Batter",

  "poongaar": "Poonghar Batter",
  "poongaar batter": "Poonghar Batter",

  "karuppu kavuni": "Karuppu Kavuni Batter",
  "karuppu kavuni batter": "Karuppu Kavuni Batter",

  "karupu kavuni": "Karuppu Kavuni Batter",
  "karupu kavuni batter": "Karuppu Kavuni Batter",

  "keerai": "Keerai Batter",
  "keerai batter": "Keerai Batter",

  "kambu yasnam": "Kambu Yasnam Batter",
  "kambu yasnam batter": "Kambu Yasnam Batter",

  "ragi": "Ragi Batter",
  "ragi batter": "Ragi Batter",

  "karunguruvai": "Karunguruvai Batter",
  "karunguruvai batter": "Karunguruvai Batter",

  "karinagaruvai": "Karunguruvai Batter",
  "karinagaruvai batter": "Karunguruvai Batter",

  "karunaguvrai": "Karunguruvai Batter",
  "karunaguvrai batter": "Karunguruvai Batter",

  "karumburuvai": "Karunguruvai Batter",
  "karumburuvai batter": "Karunguruvai Batter",

  "pachai payiru": "Pachai Payiru Batter",
  "pachai payiru batter": "Pachai Payiru Batter",

  "pachai payir": "Pachai Payiru Batter",
  "pachai payir batter": "Pachai Payiru Batter"
};


/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeProductKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}


function normalizeProductName(value) {
  const original = String(value || "").trim();

  if (!original) {
    return "";
  }

  const key = normalizeProductKey(original);

  return PRODUCT_ALIASES[key] || original;
}


/* =========================================================
   CART
   ========================================================= */

let cart = [];


/* =========================================================
   GET ELEMENT
   ========================================================= */

function getElement(id) {
  return document.getElementById(id);
}


/* =========================================================
   FORMAT RUPEES
   ========================================================= */

function formatPrice(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}


/* =========================================================
   GET PRICE
   ========================================================= */

function getProductPrice(productName, size) {

  const canonicalName = normalizeProductName(productName);

  if (
    !PRODUCTS[canonicalName] ||
    !PRODUCTS[canonicalName][size]
  ) {
    return null;
  }

  return PRODUCTS[canonicalName][size];
}


/* =========================================================
   ADD PRODUCT TO CART
   ========================================================= */

function addToCart(productName, size, quantity) {

  const canonicalName = normalizeProductName(productName);

  const qty = Number(quantity);

  if (!canonicalName || !size || !qty || qty < 1) {
    return;
  }

  const price = getProductPrice(canonicalName, size);

  if (price === null) {
    alert("Invalid product or size.");
    return;
  }

  const existing = cart.find(
    item =>
      item.productName === canonicalName &&
      item.size === size
  );

  if (existing) {

    existing.quantity += qty;

  } else {

    cart.push({
      productName: canonicalName,
      size: size,
      quantity: qty,
      price: price
    });

  }

  renderCart();
}


/* =========================================================
   REMOVE CART ITEM
   ========================================================= */

function removeFromCart(index) {

  if (index < 0 || index >= cart.length) {
    return;
  }

  cart.splice(index, 1);

  renderCart();
}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeCartQuantity(index, change) {

  if (!cart[index]) {
    return;
  }

  cart[index].quantity += change;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
}


/* =========================================================
   CALCULATE CART TOTAL
   ========================================================= */

function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>
      total + (Number(item.price) * Number(item.quantity)),
    0
  );
}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  const cartContainer =
    getElement("cartItems") ||
    getElement("cart");

  const cartTotal =
    getElement("cartTotal");

  const cartCount =
    getElement("cartCount");

  if (!cartContainer) {
    return;
  }

  if (cart.length === 0) {

    cartContainer.innerHTML = `
      <div class="empty-cart">
        🛒 Your cart is empty.
      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent = "₹0";
    }

    if (cartCount) {
      cartCount.textContent = "0";
    }

    return;
  }


  let html = "";

  cart.forEach((item, index) => {

    const itemTotal =
      Number(item.price) * Number(item.quantity);

    html += `
      <div class="cart-item">

        <div class="cart-item-info">
          <strong>${escapeHtml(item.productName)}</strong>
          <span>${escapeHtml(item.size)}</span>
        </div>

        <div class="cart-item-price">
          ${formatPrice(item.price)}
        </div>

        <div class="cart-quantity">

          <button
            type="button"
            onclick="changeCartQuantity(${index}, -1)"
          >
            −
          </button>

          <span>${item.quantity}</span>

          <button
            type="button"
            onclick="changeCartQuantity(${index}, 1)"
          >
            +
          </button>

        </div>

        <div class="cart-item-total">
          ${formatPrice(itemTotal)}
        </div>

        <button
          type="button"
          class="remove-cart-item"
          onclick="removeFromCart(${index})"
        >
          ✕
        </button>

      </div>
    `;
  });


  cartContainer.innerHTML = html;


  const total = calculateCartTotal();

  if (cartTotal) {
    cartTotal.textContent = formatPrice(total);
  }


  if (cartCount) {

    const count = cart.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    cartCount.textContent = String(count);
  }
}


/* =========================================================
   READ PRODUCT QUANTITY INPUTS
   ========================================================= */

function readProductInputs() {

  const inputs =
    document.querySelectorAll(".product-qty");

  inputs.forEach(input => {

    const quantity = Number(input.value || 0);

    if (!quantity || quantity < 1) {
      return;
    }

    const productName =
      normalizeProductName(
        input.dataset.product ||
        input.dataset.name ||
        input.getAttribute("data-product") ||
        ""
      );

    const size =
      input.dataset.size ||
      input.getAttribute("data-size") ||
      "";

    if (!productName || !size) {
      return;
    }

    const price =
      getProductPrice(productName, size);

    if (price === null) {
      console.warn(
        "Invalid product input:",
        productName,
        size
      );
      return;
    }

    const existing = cart.find(
      item =>
        item.productName === productName &&
        item.size === size
    );

    if (existing) {

      existing.quantity += quantity;

    } else {

      cart.push({
        productName,
        size,
        quantity,
        price
      });

    }

    input.value = "";
  });


  renderCart();
}


/* =========================================================
   CUSTOMER FORM VALUES
   ========================================================= */

function getCustomerDetails() {

  const customerNameInput =
    getElement("customerName");

  const phoneInput =
    getElement("phone");

  const addressInput =
    getElement("address");

  const deliveryDateInput =
    getElement("deliveryDate");


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


  return {
    customerName,
    phone,
    address,
    deliveryDate
  };
}


/* =========================================================
   VALIDATE CUSTOMER DETAILS
   ========================================================= */

function validateCustomerDetails(details) {

  if (!details.customerName) {

    alert("Please enter your name.");

    const input = getElement("customerName");

    if (input) {
      input.focus();
    }

    return false;
  }


  if (!details.phone) {

    alert("Please enter your phone number.");

    const input = getElement("phone");

    if (input) {
      input.focus();
    }

    return false;
  }


  const phoneDigits =
    details.phone.replace(/\D/g, "");

  if (phoneDigits.length < 10) {

    alert("Please enter a valid phone number.");

    const input = getElement("phone");

    if (input) {
      input.focus();
    }

    return false;
  }


  if (!details.address) {

    alert("Please enter your delivery address.");

    const input = getElement("address");

    if (input) {
      input.focus();
    }

    return false;
  }


  if (!details.deliveryDate) {

    alert("Please select a delivery date.");

    const input = getElement("deliveryDate");

    if (input) {
      input.focus();
    }

    return false;
  }


  return true;
}


/* =========================================================
   CREATE ORDER
   ========================================================= */

async function placeOrder(event) {

  if (event) {
    event.preventDefault();
  }


  /*
     First read products from the quantity boxes.
  */
  readProductInputs();


  /*
     Customer details are read AT SUBMIT TIME.
     This prevents old/empty values being sent.
  */
  const details =
    getCustomerDetails();


  if (!validateCustomerDetails(details)) {
    return;
  }


  if (cart.length === 0) {

    alert(
      "Please add at least one product to your cart."
    );

    return;
  }


  /*
     Build clean order items.
     Prices are always taken from the official
     client-side price table.
  */

  const items = cart.map(item => {

    const productName =
      normalizeProductName(item.productName);

    const size =
      item.size;

    const quantity =
      Number(item.quantity);

    const price =
      getProductPrice(productName, size);


    return {
      productName,
      size,
      quantity,
      price
    };

  });


  /*
     Final safety check.
  */

  for (const item of items) {

    if (!PRODUCTS[item.productName]) {

      alert(
        `Invalid product: ${item.productName}`
      );

      return;
    }


    if (
      item.size !== "500g" &&
      item.size !== "1kg"
    ) {

      alert(
        `Invalid size for ${item.productName}.`
      );

      return;
    }


    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {

      alert(
        `Invalid quantity for ${item.productName}.`
      );

      return;
    }

  }


  /*
     IMPORTANT:
     No payment information is included.
     No UPI.
     No QR.
     No COD.
     No payment screenshot.
  */

  const orderData = {

    customerName:
      details.customerName,

    phone:
      details.phone,

    address:
      details.address,

    items:
      items,

    deliveryDate:
      details.deliveryDate

  };


  console.log(
    "Sending order to server:",
    orderData
  );


  const submitButton =
    document.querySelector(
      'button[type="submit"], #placeOrderBtn'
    );


  const originalButtonText =
    submitButton
      ? submitButton.textContent
      : "";


  try {

    if (submitButton) {

      submitButton.disabled = true;

      submitButton.textContent =
        "Placing Order...";
    }


    const response =
      await fetch("/api/orders", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(orderData)

      });


    let result = null;

    try {

      result =
        await response.json();

    } catch (jsonError) {

      result = null;

    }


    console.log(
      "Server response:",
      result
    );


    if (!response.ok) {

      const errorMessage =
        result?.error ||
        result?.message ||
        "Unable to place order.";

      throw new Error(errorMessage);
    }


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.error ||
        result.message ||
        "Unable to place order."
      );
    }


    /*
       Support different successful response formats.
    */

    const orderId =
      result?.order?.id ||
      result?.id ||
      result?.orderId ||
      result?.data?.id ||
      "Success";


    const serverTotal =
      result?.order?.total ||
      result?.total ||
      calculateCartTotal();


    showOrderSuccess(
      orderId,
      serverTotal,
      details.deliveryDate
    );


    /*
       Clear cart after successful order.
    */

    cart = [];

    renderCart();


    /*
       Clear customer form.
    */

    clearCustomerForm();


  } catch (error) {

    console.error(
      "Order placement error:",
      error
    );


    alert(
      error.message ||
      "Something went wrong while placing your order."
    );


  } finally {

    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        originalButtonText ||
        "Place Order";

    }

  }

}


/* =========================================================
   SUCCESS MESSAGE
   ========================================================= */

function showOrderSuccess(
  orderId,
  total,
  deliveryDate
) {

  const successBox =
    getElement("orderSuccess") ||
    getElement("successMessage") ||
    getElement("success");

  const formattedDate =
    formatDeliveryDate(deliveryDate);


  const message = `
    <div class="success-content">

      <div class="success-icon">
        ✅
      </div>

      <h2>Order Placed Successfully!</h2>

      <p>
        Thank you for ordering from
        <strong>DHANA FOODS</strong>.
      </p>

      <p>
        <strong>Order ID:</strong>
        #${escapeHtml(String(orderId))}
      </p>

      <p>
        <strong>Total:</strong>
        ${formatPrice(total)}
      </p>

      <p>
        <strong>Delivery Date:</strong>
        ${escapeHtml(formattedDate)}
      </p>

      <p>
        Our team will prepare your fresh batter.
      </p>

    </div>
  `;


  if (successBox) {

    successBox.innerHTML = message;

    successBox.style.display = "block";

    successBox.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } else {

    alert(
      `Order placed successfully!\n\n` +
      `Order ID: #${orderId}\n` +
      `Total: ${formatPrice(total)}\n` +
      `Delivery Date: ${formattedDate}`
    );

  }

}


/* =========================================================
   FORMAT DELIVERY DATE
   ========================================================= */

function formatDeliveryDate(dateValue) {

  if (!dateValue) {
    return "-";
  }


  const date =
    new Date(`${dateValue}T00:00:00`);


  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


/* =========================================================
   CLEAR CUSTOMER FORM
   ========================================================= */

function clearCustomerForm() {

  const form =
    getElement("orderForm") ||
    document.querySelector("form");


  if (form) {

    /*
       Do not blindly reset every element if
       the page contains unrelated forms.
    */

    const name =
      getElement("customerName");

    const phone =
      getElement("phone");

    const address =
      getElement("address");

    const deliveryDate =
      getElement("deliveryDate");


    if (name) {
      name.value = "";
    }

    if (phone) {
      phone.value = "";
    }

    if (address) {
      address.value = "";
    }

    if (deliveryDate) {
      deliveryDate.value = "";
    }

  }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   SET MINIMUM DELIVERY DATE
   ========================================================= */

function setMinimumDeliveryDate() {

  const deliveryDate =
    getElement("deliveryDate");


  if (!deliveryDate) {
    return;
  }


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");


  const day =
    String(now.getDate())
      .padStart(2, "0");


  const today =
    `${year}-${month}-${day}`;


  deliveryDate.min = today;
}


/* =========================================================
   CONNECT FORM
   ========================================================= */

function connectOrderForm() {

  const form =
    getElement("orderForm");


  if (!form) {
    console.warn(
      "orderForm not found."
    );

    return;
  }


  /*
     Prevent duplicate event listeners.
  */

  if (form.dataset.dhanaConnected === "true") {
    return;
  }


  form.dataset.dhanaConnected = "true";


  form.addEventListener(
    "submit",
    placeOrder
  );
}


/* =========================================================
   CONNECT PRODUCT BUTTONS
   ========================================================= */

function connectProductButtons() {

  const buttons =
    document.querySelectorAll(
      "[data-product][data-size]"
    );


  buttons.forEach(button => {

    /*
       If the button is already connected,
       don't connect it again.
    */

    if (
      button.dataset.dhanaConnected === "true"
    ) {
      return;
    }


    /*
       Only automatically handle buttons
       that look like Add-to-cart buttons.
    */

    const text =
      String(button.textContent || "")
        .toLowerCase();


    if (
      !text.includes("add") &&
      !text.includes("cart")
    ) {
      return;
    }


    button.dataset.dhanaConnected = "true";


    button.addEventListener(
      "click",
      function(event) {

        event.preventDefault();


        const productName =
          normalizeProductName(
            button.dataset.product
          );


        const size =
          button.dataset.size;


        const quantity =
          Number(
            button.dataset.quantity || 1
          );


        addToCart(
          productName,
          size,
          quantity
        );

      }
    );

  });

}


/* =========================================================
   UPDATE PRODUCT PRICE DISPLAY
   ========================================================= */

function updatePriceDisplays() {

  /*
     Supports elements such as:

     data-product="Idli Batter"
     data-size="500g"

     or

     data-product="Idli Batter"
     data-size="1kg"
  */

  const elements =
    document.querySelectorAll(
      "[data-product][data-size][data-price]"
    );


  elements.forEach(element => {

    const productName =
      normalizeProductName(
        element.dataset.product
      );


    const size =
      element.dataset.size;


    const price =
      getProductPrice(
        productName,
        size
      );


    if (price !== null) {

      element.textContent =
        formatPrice(price);

    }

  });

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.changeCartQuantity =
  changeCartQuantity;

window.placeOrder =
  placeOrder;

window.renderCart =
  renderCart;


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "DHANA FOODS customer page ready."
    );


    setMinimumDeliveryDate();

    connectOrderForm();

    connectProductButtons();

    updatePriceDisplays();

    renderCart();

  }
);