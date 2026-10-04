const express = require("express");
const Database = require("better-sqlite3");

const app = express();

const PORT = process.env.PORT || 3000;

// =====================================================
// DATABASE
// =====================================================

const db = new Database("dhanafoods.db");

// =====================================================
// CREATE ORDERS TABLE
// =====================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        product TEXT NOT NULL,
        quantity TEXT NOT NULL,
        price INTEGER NOT NULL,
        delivery_date TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// =====================================================
// ADD items_json COLUMN IF NEEDED
// =====================================================

const columns = db
    .prepare(`PRAGMA table_info(orders)`)
    .all();

const hasItemsJson = columns.some(
    column => column.name === "items_json"
);

if (!hasItemsJson) {
    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN items_json TEXT
    `).run();

    console.log("Added items_json column.");
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.static(__dirname));

// =====================================================
// TEST
// =====================================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "Dhana Foods backend is working!"
    });

});

// =====================================================
// CREATE ORDER
// =====================================================

app.post("/api/orders", (req, res) => {

    try {

        const {
            customerName,
            phone,
            address,
            items,
            deliveryDate
        } = req.body;

        // Validate customer details
        if (
            !customerName ||
            !phone ||
            !address ||
            !deliveryDate
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all customer details."
            });

        }

        // Validate items
        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Please select at least one product."
            });

        }

        // Clean items
        const cleanedItems = items.map(item => {

            const product =
                String(item.product || "").trim();

            const size =
                String(item.size || "").trim();

            const quantity =
                Number(item.quantity);

            const price =
                Number(item.price);

            if (
                !product ||
                !size ||
                !Number.isFinite(quantity) ||
                quantity <= 0 ||
                !Number.isFinite(price) ||
                price < 0
            ) {

                throw new Error(
                    "Invalid product information."
                );

            }

            const itemTotal =
                price * quantity;

            return {
                product,
                size,
                quantity,
                price,
                total: itemTotal
            };

        });

        // Calculate total on server
        const total =
            cleanedItems.reduce(
                (sum, item) =>
                    sum + item.total,
                0
            );

        // Product summary for old database fields
        const productSummary =
            cleanedItems
                .map(item =>
                    `${item.product} (${item.size})`
                )
                .join(", ");

        const quantitySummary =
            cleanedItems
                .map(item =>
                    `${item.quantity}`
                )
                .join(", ");

        // Store full items as JSON
        const itemsJson =
            JSON.stringify(cleanedItems);

        // Insert order
        const result = db.prepare(`
            INSERT INTO orders (
                customer_name,
                phone,
                address,
                product,
                quantity,
                price,
                delivery_date,
                items_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            customerName,
            phone,
            address,
            productSummary,
            quantitySummary,
            total,
            deliveryDate,
            itemsJson
        );

        res.json({
            success: true,
            orderId: result.lastInsertRowid,
            total: total,
            message: "Order placed successfully."
        });

    } catch (error) {

        console.error(
            "Order creation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to place order."
        });

    }

});

// =====================================================
// GET ALL ORDERS
// =====================================================

app.get("/api/orders", (req, res) => {

    try {

        const orders = db.prepare(`
            SELECT *
            FROM orders
            ORDER BY created_at DESC
        `).all();

        const formattedOrders =
            orders.map(order => {

                let items = [];

                if (order.items_json) {

                    try {

                        items =
                            JSON.parse(
                                order.items_json
                            );

                    } catch (error) {

                        console.error(
                            "Invalid items JSON for order:",
                            order.id
                        );

                    }

                }

                // Support old orders
                if (
                    items.length === 0 &&
                    order.product
                ) {

                    items = [{
                        product: order.product,
                        size: order.quantity,
                        quantity: 1,
                        price: order.price,
                        total: order.price
                    }];

                }

                return {
                    ...order,
                    items: items
                };

            });

        res.json(formattedOrders);

    } catch (error) {

        console.error(
            "Get orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load orders."
        });

    }

});

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

app.put("/api/orders/:id", (req, res) => {

    const {
        status
    } = req.body;

    const orderId =
        req.params.id;

    const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Delivered",
        "Cancelled"
    ];

    if (
        !allowedStatuses.includes(status)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid status."
        });

    }

    const result = db.prepare(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
    `).run(
        status,
        orderId
    );

    if (result.changes === 0) {

        return res.status(404).json({
            success: false,
            message: "Order not found."
        });

    }

    res.json({
        success: true,
        message: "Order status updated."
    });

});

// =====================================================
// DELETE ORDER
// =====================================================

app.delete("/api/orders/:id", (req, res) => {

    const orderId =
        req.params.id;

    const result = db.prepare(`
        DELETE FROM orders
        WHERE id = ?
    `).run(
        orderId
    );

    if (result.changes === 0) {

        return res.status(404).json({
            success: false,
            message: "Order not found."
        });

    }

    res.json({
        success: true,
        message: "Order deleted successfully."
    });

});

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Dhana Foods running on port ${PORT}`
        );

    }
);