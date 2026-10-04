const express = require("express");
const Database = require("better-sqlite3");

const app = express();

// Use hosting provider's PORT, or 3000 locally
const PORT = process.env.PORT || 3000;

// Database
const db = new Database("dhanafoods.db");

// =====================================================
// CREATE EXISTING ORDERS TABLE
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
// DATABASE MIGRATION
// Add items_json column if it doesn't already exist
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

    console.log("Added items_json column to orders table.");
}


// =====================================================
// EXPRESS MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.static(__dirname));


// =====================================================
// TEST API
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
            total,
            deliveryDate
        } = req.body;


        // ---------------------------------------------
        // VALIDATE CUSTOMER DETAILS
        // ---------------------------------------------

        if (
            !customerName ||
            !phone ||
            !address ||
            !deliveryDate
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all customer details."

            });

        }


        // ---------------------------------------------
        // VALIDATE ITEMS
        // ---------------------------------------------

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please select at least one product."

            });

        }


        // ---------------------------------------------
        // CLEAN AND VALIDATE ITEMS
        // ---------------------------------------------

        const cleanedItems = items.map(item => {

            const product =
                String(item.product || "").trim();

            const size =
                String(item.size || "").trim();

            const quantity =
                Number(item.quantity);

            const price =
                Number(item.price);

            const itemTotal =
                Number(item.total);


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


            return {

                product: product,

                size: size,

                quantity: quantity,

                price: price,

                total:
                    Number.isFinite(itemTotal)
                        ? itemTotal
                        : price * quantity

            };

        });


        // ---------------------------------------------
        // CALCULATE TOTAL ON SERVER
        // ---------------------------------------------

        const calculatedTotal =
            cleanedItems.reduce(
                (sum, item) =>
                    sum + item.total,
                0
            );


        // Don't trust total sent by browser.
        // Server calculates it again.

        const finalTotal =
            calculatedTotal;


        // ---------------------------------------------
        // CREATE PRODUCT SUMMARY
        // ---------------------------------------------

        const productSummary =
            cleanedItems
                .map(item =>
                    `${item.product} (${item.size})`
                )
                .join(", ");


        // ---------------------------------------------
        // CREATE QUANTITY SUMMARY
        // ---------------------------------------------

        const quantitySummary =
            cleanedItems
                .map(item =>
                    `${item.quantity}`
                )
                .join(", ");


        // ---------------------------------------------
        // SAVE COMPLETE ITEMS AS JSON
        // ---------------------------------------------

        const itemsJson =
            JSON.stringify(cleanedItems);


        // ---------------------------------------------
        // INSERT ORDER
        // ---------------------------------------------

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

            finalTotal,

            deliveryDate,

            itemsJson

        );


        // ---------------------------------------------
        // RETURN SUCCESS
        // ---------------------------------------------

        res.json({

            success: true,

            orderId:
                result.lastInsertRowid,

            total:
                finalTotal,

            message:
                "Order placed successfully."

        });


    } catch (error) {

        console.error(
            "Order creation error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to place order."

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


        // Convert items_json back into items
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

            message:
                "Unable to load orders."

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


    // Available statuses
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

            message:
                "Invalid status."

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

            message:
                "Order not found."

        });

    }


    res.json({

        success: true,

        message:
            "Order status updated."

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