/* =========================================================
   DHANA FOODS
   PostgreSQL Order Server
========================================================= */

const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";


/* =========================================================
   DATABASE
========================================================= */

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


/* =========================================================
   OFFICIAL PRODUCTS & PRICES
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

  "poongar batter": "Poonghar Batter",

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
   STATUS
========================================================= */

const VALID_STATUSES = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Delivered"
];


/* =========================================================
   HELPERS
========================================================= */

function normalizeProductKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}


function normalizeProductName(value) {

  const original =
    String(value || "").trim();

  if (!original) {
    return "";
  }

  const key =
    normalizeProductKey(original);

  return PRODUCT_ALIASES[key] || original;
}


function getOfficialPrice(product, size) {

  const canonicalProduct =
    normalizeProductName(product);

  if (
    !PRODUCTS[canonicalProduct] ||
    !PRODUCTS[canonicalProduct][size]
  ) {
    return null;
  }

  return PRODUCTS[canonicalProduct][size];
}


function calculateTotal(items) {

  return items.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

}


/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,

      customer_name TEXT NOT NULL,

      phone TEXT NOT NULL,

      address TEXT NOT NULL,

      items JSONB NOT NULL,

      total NUMERIC(10,2) NOT NULL DEFAULT 0,

      delivery_date DATE,

      payment_method TEXT DEFAULT 'COD',

      status TEXT NOT NULL DEFAULT 'Pending',

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);


  /* Add columns if an older orders table exists */

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_date DATE
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD'
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending'
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);


  console.log("🗄️ PostgreSQL database ready.");
}


/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {

  res.sendFile(
    require("path").join(
      __dirname,
      "index.html"
    )
  );

});


/* =========================================================
   ADMIN
========================================================= */

app.get("/admin.html", (req, res) => {

  res.sendFile(
    require("path").join(
      __dirname,
      "admin.html"
    )
  );

});


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", async (req, res) => {

  try {

    await pool.query("SELECT 1");

    res.json({
      ok: true,
      database: "connected",
      service: "Dhana Foods"
    });

  } catch (error) {

    console.error(
      "Health check error:",
      error
    );

    res.status(500).json({
      ok: false,
      database: "error"
    });

  }

});


/* =========================================================
   PRODUCTS API
========================================================= */

app.get("/api/products", (req, res) => {

  res.json(PRODUCTS);

});


/* =========================================================
   CREATE ORDER
========================================================= */

app.post("/api/orders", async (req, res) => {

  try {

    const {
      customerName,
      phone,
      address,
      items,
      deliveryDate,
      paymentMethod
    } = req.body;


    /* -------------------------------
       CUSTOMER VALIDATION
    -------------------------------- */

    if (
      !customerName ||
      !String(customerName).trim()
    ) {

      return res.status(400).json({
        error: "Customer name is required."
      });

    }


    if (
      !phone ||
      !String(phone).trim()
    ) {

      return res.status(400).json({
        error: "Phone number is required."
      });

    }


    const cleanPhone =
      String(phone)
        .replace(/\D/g, "");


    if (
      !/^[6-9]\d{9}$/.test(
        cleanPhone
      )
    ) {

      return res.status(400).json({
        error: "Please enter a valid 10-digit mobile number."
      });

    }


    if (
      !address ||
      !String(address).trim()
    ) {

      return res.status(400).json({
        error: "Delivery address is required."
      });

    }


    if (
      !deliveryDate ||
      !String(deliveryDate).trim()
    ) {

      return res.status(400).json({
        error: "Delivery date is required."
      });

    }


    /* -------------------------------
       ITEMS VALIDATION
    -------------------------------- */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      return res.status(400).json({
        error: "Please select at least one product."
      });

    }


    const normalizedItems = [];


    for (const item of items) {

      const product =
        normalizeProductName(
          item.product
        );

      const size =
        String(item.size || "")
          .trim();

      const quantity =
        Number(item.quantity);


      if (!PRODUCTS[product]) {

        return res.status(400).json({
          error:
            `Invalid product: ${item.product}`
        });

      }


      if (
        size !== "500g" &&
        size !== "1kg"
      ) {

        return res.status(400).json({
          error:
            `Invalid size for ${product}.`
        });

      }


      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100
      ) {

        return res.status(400).json({
          error:
            `Invalid quantity for ${product}.`
        });

      }


      const officialPrice =
        getOfficialPrice(
          product,
          size
        );


      if (officialPrice === null) {

        return res.status(400).json({
          error:
            `Invalid price for ${product}.`
        });

      }


      normalizedItems.push({

        product,

        size,

        quantity,

        price: officialPrice

      });

    }


    /* -------------------------------
       TOTAL
    -------------------------------- */

    const total =
      calculateTotal(
        normalizedItems
      );


    /* -------------------------------
       PAYMENT
    -------------------------------- */

    const finalPaymentMethod =
      paymentMethod === "UPI"
        ? "UPI"
        : "COD";


    /* -------------------------------
       SAVE ORDER
    -------------------------------- */

    const result =
      await pool.query(
        `
        INSERT INTO orders
        (
          customer_name,
          phone,
          address,
          items,
          total,
          delivery_date,
          payment_method,
          status
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4::jsonb,
          $5,
          $6,
          $7,
          'Pending'
        )
        RETURNING *
        `,
        [
          String(customerName).trim(),

          cleanPhone,

          String(address).trim(),

          JSON.stringify(
            normalizedItems
          ),

          total,

          deliveryDate,

          finalPaymentMethod
        ]
      );


    const order =
      result.rows[0];


    console.log(
      `🛒 New order #${order.id} - ₹${total}`
    );


    return res.status(201).json({

      success: true,

      message:
        "Order placed successfully.",

      id: order.id,

      orderId: order.id,

      order: {

        id: order.id,

        customerName:
          order.customer_name,

        phone:
          order.phone,

        address:
          order.address,

        items:
          order.items,

        total:
          Number(order.total),

        deliveryDate:
          order.delivery_date,

        paymentMethod:
          order.payment_method,

        status:
          order.status,

        createdAt:
          order.created_at

      }

    });

  } catch (error) {

    console.error(
      "❌ Create order error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to place order. Please try again."
    });

  }

});


/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get("/api/orders", async (req, res) => {

  try {

    const result =
      await pool.query(`
        SELECT
          id,
          customer_name,
          phone,
          address,
          items,
          total,
          delivery_date,
          payment_method,
          status,
          created_at,
          updated_at
        FROM orders
        ORDER BY id DESC
      `);


    const orders =
      result.rows.map(
        (order) => ({

          id:
            order.id,

          customerName:
            order.customer_name,

          phone:
            order.phone,

          address:
            order.address,

          items:
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items,

          total:
            Number(order.total || 0),

          deliveryDate:
            order.delivery_date,

          paymentMethod:
            order.payment_method || "COD",

          status:
            order.status,

          createdAt:
            order.created_at,

          updatedAt:
            order.updated_at

        })
      );


    res.json(orders);

  } catch (error) {

    console.error(
      "❌ Get orders error:",
      error
    );

    res.status(500).json({
      error:
        "Unable to load orders."
    });

  }

});


/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get(
  "/api/orders/:id",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid order ID."
        });

      }


      const result =
        await pool.query(
          `
          SELECT *
          FROM orders
          WHERE id = $1
          `,
          [id]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          error: "Order not found."
        });

      }


      const order =
        result.rows[0];


      res.json({

        id:
          order.id,

        customerName:
          order.customer_name,

        phone:
          order.phone,

        address:
          order.address,

        items:
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items,

        total:
          Number(order.total || 0),

        deliveryDate:
          order.delivery_date,

        paymentMethod:
          order.payment_method || "COD",

        status:
          order.status,

        createdAt:
          order.created_at,

        updatedAt:
          order.updated_at

      });

    } catch (error) {

      console.error(
        "❌ Get order error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to load order."
      });

    }

  }
);


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.put(
  "/api/orders/:id",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid order ID."
        });

      }


      const status =
        String(
          req.body.status || ""
        ).trim();


      if (
        !VALID_STATUSES.includes(
          status
        )
      ) {

        return res.status(400).json({
          error:
            "Invalid order status."
        });

      }


      const result =
        await pool.query(
          `
          UPDATE orders
          SET
            status = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
          `,
          [
            status,
            id
          ]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          error: "Order not found."
        });

      }


      const order =
        result.rows[0];


      console.log(
        `📦 Order #${id} → ${status}`
      );


      res.json({

        success: true,

        message:
          "Order status updated.",

        order: {

          id:
            order.id,

          status:
            order.status

        }

      });

    } catch (error) {

      console.error(
        "❌ Update status error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to update order status."
      });

    }

  }
);


/* =========================================================
   DELETE ORDER
========================================================= */

app.delete(
  "/api/orders/:id",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid order ID."
        });

      }


      const result =
        await pool.query(
          `
          DELETE FROM orders
          WHERE id = $1
          RETURNING id
          `,
          [id]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          error: "Order not found."
        });

      }


      console.log(
        `🗑️ Order #${id} deleted`
      );


      res.json({

        success: true,

        message:
          "Order deleted.",

        id

      });

    } catch (error) {

      console.error(
        "❌ Delete order error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to delete order."
      });

    }

  }
);


/* =========================================================
   404 API
========================================================= */

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({
      error:
        "API endpoint not found."
    });

  }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

  try {

    await initializeDatabase();


    app.listen(
      PORT,
      HOST,
      () => {

        console.log("");
        console.log(
          "========================================"
        );

        console.log(
          "🥣 DHANA FOODS SERVER STARTED"
        );

        console.log(
          `🌐 Port: ${PORT}`
        );

        console.log(
          `🛒 Ordering: ACTIVE`
        );

        console.log(
          `🗄️ PostgreSQL: ACTIVE`
        );

        console.log(
          `👨‍💼 Admin API: ACTIVE`
        );

        console.log(
          "========================================"
        );

        console.log("");

      }
    );

  } catch (error) {

    console.error(
      "❌ Server startup failed:",
      error
    );

    process.exit(1);

  }

}


startServer();


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

process.on(
  "SIGTERM",
  async () => {

    console.log(
      "🛑 SIGTERM received."
    );

    await pool.end();

    process.exit(0);

  }
);


process.on(
  "SIGINT",
  async () => {

    console.log(
      "🛑 Server stopping..."
    );

    await pool.end();

    process.exit(0);

  }
);