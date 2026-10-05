const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;

// ======================================================
// DHANA FOODS - PRODUCT PRICES
// ======================================================

const PRODUCT_PRICES = {
  "Idli Batter": {
    "500g": 25,
    "1kg": 45
  },

  "Dosa Batter": {
    "500g": 25,
    "1kg": 45
  },

  "Adai Batter": {
    "500g": 30,
    "1kg": 60
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

  "Poongar Batter": {
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

  "Karinagaruvai Batter": {
    "500g": 40,
    "1kg": 80
  },

  "Pachai Payiru Batter": {
    "500g": 40,
    "1kg": 80
  }
};

const ALLOWED_STATUSES = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

// ======================================================
// POSTGRESQL
// ======================================================

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  console.error("Please set DATABASE_URL before starting the server.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  console.error("❌ Unexpected PostgreSQL error:", error);
});

// ======================================================
// DATABASE SETUP
// ======================================================

async function setupDatabase() {
  try {
    // --------------------------------------------------
    // Check whether an old orders table exists
    // --------------------------------------------------

    const tableCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'orders'
      ORDER BY ordinal_position
    `);

    const oldColumns = tableCheck.rows.map(
      row => row.column_name
    );

    // --------------------------------------------------
    // OLD DATABASE STRUCTURE DETECTED
    //
    // The old version used a "product" column.
    // Our new version stores all cart items in JSONB.
    //
    // There are no real customer orders, so it is safe
    // to remove the old testing table.
    // --------------------------------------------------

    if (oldColumns.includes("product")) {
      console.log("⚠️ Old orders table detected.");
      console.log("🗑️ Removing old test orders table...");

      await pool.query(`
        DROP TABLE IF EXISTS orders
      `);

      console.log("✅ Old orders table removed.");
    }

    // --------------------------------------------------
    // Create the correct orders table
    // --------------------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,

        customer_name TEXT NOT NULL,

        phone TEXT NOT NULL,

        address TEXT NOT NULL,

        items JSONB NOT NULL,

        total NUMERIC(10, 2) NOT NULL,

        delivery_date TEXT NOT NULL,

        status TEXT NOT NULL DEFAULT 'Pending',

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ PostgreSQL orders table is ready.");

  } catch (error) {
    console.error("❌ Database setup failed:");
    console.error(error);

    throw error;
  }
}

// ======================================================
// CLEAN + VALIDATE ITEMS
// ======================================================

function cleanItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const cleanedItems = [];

  for (const item of items) {
    const product = String(item.product || "").trim();
    const size = String(item.size || "").trim();

    const quantity = Number(item.quantity);

    if (!product) {
      throw new Error("Invalid product.");
    }

    if (!size) {
      throw new Error("Invalid product size.");
    }

    if (!PRODUCT_PRICES[product]) {
      throw new Error(`Invalid product: ${product}`);
    }

    if (!PRODUCT_PRICES[product][size]) {
      throw new Error(
        `Invalid size for ${product}: ${size}`
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      throw new Error(
        `Invalid quantity for ${product}.`
      );
    }

    // Never trust price from browser.
    const price = PRODUCT_PRICES[product][size];

    const subtotal = price * quantity;

    cleanedItems.push({
      product,
      size,
      quantity,
      price,
      subtotal
    });
  }

  return cleanedItems;
}

// ======================================================
// CALCULATE TOTAL
// ======================================================

function calculateTotal(items) {
  return items.reduce(
    (total, item) => total + item.subtotal,
    0
  );
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      status: "OK",
      database: "PostgreSQL",
      service: "Dhana Foods",
      time: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Health check failed:", error);

    res.status(500).json({
      success: false,
      status: "ERROR",
      database: "PostgreSQL",
      message: "Database connection failed."
    });
  }
});

// ======================================================
// CREATE ORDER
// ======================================================

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      deliveryDate,
      items
    } = req.body;

    // --------------------------------------------------
    // Customer validation
    // --------------------------------------------------

    const cleanName =
      String(customerName || "").trim();

    const cleanPhone =
      String(phone || "").trim();

    const cleanAddress =
      String(address || "").trim();

    const cleanDeliveryDate =
      String(deliveryDate || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name."
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter your mobile number."
      });
    }

    if (!cleanAddress) {
      return res.status(400).json({
        success: false,
        message: "Please enter your delivery address."
      });
    }

    if (!cleanDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery date."
      });
    }

    // --------------------------------------------------
    // Product validation
    // --------------------------------------------------

    const cleanOrderItems = cleanItems(items);

    const total = calculateTotal(cleanOrderItems);

    // --------------------------------------------------
    // Save order
    // --------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO orders
      (
        customer_name,
        phone,
        address,
        items,
        total,
        delivery_date,
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
        $7
      )
      RETURNING
        id,
        customer_name,
        phone,
        address,
        items,
        total,
        delivery_date,
        status,
        created_at
      `,
      [
        cleanName,
        cleanPhone,
        cleanAddress,
        JSON.stringify(cleanOrderItems),
        total,
        cleanDeliveryDate,
        "Pending"
      ]
    );

    const order = result.rows[0];

    console.log(
      `✅ New Order #${order.id} | ${order.customer_name} | ₹${order.total}`
    );

    res.status(201).json({
      success: true,

      message: "Order placed successfully.",

      order: {
        id: order.id,
        customerName: order.customer_name,
        phone: order.phone,
        address: order.address,
        items: order.items,
        total: Number(order.total),
        deliveryDate: order.delivery_date,
        status: order.status,
        createdAt: order.created_at
      }
    });

  } catch (error) {
    console.error("❌ Create order failed:");
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to place order."
    });
  }
});

// ======================================================
// GET ALL ORDERS
// ======================================================

app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        customer_name,
        phone,
        address,
        items,
        total,
        delivery_date,
        status,
        created_at
      FROM orders
      ORDER BY id DESC
    `);

    const orders = result.rows.map(order => ({
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

      status:
        order.status,

      createdAt:
        order.created_at
    }));

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error("❌ Get orders failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load orders."
    });
  }
});

// ======================================================
// GET SINGLE ORDER
// ======================================================

app.get("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        customer_name,
        phone,
        address,
        items,
        total,
        delivery_date,
        status,
        created_at
      FROM orders
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    const order = result.rows[0];

    res.json({
      success: true,

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

        status:
          order.status,

        createdAt:
          order.created_at
      }
    });

  } catch (error) {
    console.error("❌ Get order failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load order."
    });
  }
});

// ======================================================
// UPDATE ORDER STATUS
// ======================================================

app.put("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const status =
      String(req.body.status || "").trim();

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: " +
          ALLOWED_STATUSES.join(", ")
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        customer_name,
        phone,
        address,
        items,
        total,
        delivery_date,
        status,
        created_at
      `,
      [
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    const order = result.rows[0];

    console.log(
      `🔄 Order #${id} status changed to ${status}`
    );

    res.json({
      success: true,

      message:
        "Order status updated.",

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

        status:
          order.status,

        createdAt:
          order.created_at
      }
    });

  } catch (error) {
    console.error(
      "❌ Update status failed:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update order status."
    });
  }
});

// ======================================================
// DELETE ORDER
// ======================================================

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM orders
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    console.log(
      `🗑️ Order #${id} deleted`
    );

    res.json({
      success: true,
      message:
        "Order deleted successfully.",
      id
    });

  } catch (error) {
    console.error(
      "❌ Delete order failed:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete order."
    });
  }
});

// ======================================================
// FRONTEND
// ======================================================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// ======================================================
// API 404
// ======================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// ======================================================
// GENERAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
  console.error(
    "❌ Server error:",
    error
  );

  res.status(500).json({
    success: false,
    message:
      "Internal server error."
  });
});

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  try {
    await setupDatabase();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log("");
        console.log(
          "=========================================="
        );
        console.log(
          "          DHANA FOODS SERVER"
        );
        console.log(
          "=========================================="
        );
        console.log(
          `🌐 Port: ${PORT}`
        );
        console.log(
          "🗄️ Database: PostgreSQL"
        );
        console.log(
          `📦 Products: ${
            Object.keys(PRODUCT_PRICES).length
          }`
        );
        console.log(
          "🚚 Door Delivery: Available"
        );
        console.log(
          "=========================================="
        );
        console.log("");
      }
    );

  } catch (error) {
    console.error("");
    console.error(
      "=========================================="
    );
    console.error(
      "❌ SERVER STARTUP FAILED"
    );
    console.error(
      "=========================================="
    );
    console.error(error);

    process.exit(1);
  }
}

startServer();

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

async function shutdown(signal) {
  console.log(
    `\n${signal} received. Shutting down...`
  );

  try {
    await pool.end();

    console.log(
      "✅ PostgreSQL connection closed."
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "❌ Shutdown error:",
      error
    );

    process.exit(1);
  }
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);