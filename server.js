const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// =====================================
// DATABASE INITIALIZATION
// =====================================

async function initializeDatabase() {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            product TEXT NOT NULL,
            quantity TEXT NOT NULL,
            price INTEGER NOT NULL,
            delivery_date TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            items_json TEXT
        )
    `);

    // Add payment_method column if it does not exist
    await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD'
    `);

    console.log("PostgreSQL database ready.");
}


// =====================================
// TEST API
// =====================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "Dhana Foods backend is working with PostgreSQL!"
    });

});


// =====================================
// PLACE ORDER
// =====================================

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


        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Please select at least one product."
            });

        }


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


            return {
                product,
                size,
                quantity,
                price,
                total: price * quantity
            };

        });


        const total =
            cleanedItems.reduce(
                (sum, item) =>
                    sum + item.total,
                0
            );


        const productSummary =
            cleanedItems
                .map(
                    item =>
                        `${item.product} (${item.size})`
                )
                .join(", ");


        const quantitySummary =
            cleanedItems
                .map(
                    item =>
                        item.quantity
                )
                .join(", ");


        const itemsJson =
            JSON.stringify(cleanedItems);


        const selectedPayment =
            paymentMethod === "UPI"
                ? "UPI"
                : "COD";


        const result =
            await pool.query(
                `
                INSERT INTO orders (
                    customer_name,
                    phone,
                    address,
                    product,
                    quantity,
                    price,
                    delivery_date,
                    items_json,
                    payment_method
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )
                RETURNING id
                `,
                [
                    customerName,
                    phone,
                    address,
                    productSummary,
                    quantitySummary,
                    total,
                    deliveryDate,
                    itemsJson,
                    selectedPayment
                ]
            );


        res.json({

            success: true,

            orderId:
                result.rows[0].id,

            total:
                total,

            paymentMethod:
                selectedPayment,

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


// =====================================
// GET ALL ORDERS
// =====================================

app.get("/api/orders", async (req, res) => {

    try {

        const result =
            await pool.query(`
                SELECT *
                FROM orders
                ORDER BY created_at DESC
            `);


        const formattedOrders =
            result.rows.map(order => {

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


                // Old-order fallback
                if (
                    items.length === 0 &&
                    order.product
                ) {

                    items = [
                        {
                            product:
                                order.product,

                            size:
                                order.quantity,

                            quantity:
                                1,

                            price:
                                order.price,

                            total:
                                order.price
                        }
                    ];

                }


                return {
                    ...order,
                    items: items
                };

            });


        res.json(
            formattedOrders
        );


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


// =====================================
// UPDATE ORDER STATUS
// =====================================

app.put("/api/orders/:id", async (req, res) => {

    try {

        const {
            status
        } = req.body;


        const orderId =
            Number(req.params.id);


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


        const result =
            await pool.query(
                `
                UPDATE orders
                SET status = $1
                WHERE id = $2
                `,
                [
                    status,
                    orderId
                ]
            );


        if (
            result.rowCount === 0
        ) {

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


    } catch (error) {

        console.error(
            "Update status error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to update order status."

        });

    }

});


// =====================================
// DELETE ORDER
// =====================================

app.delete("/api/orders/:id", async (req, res) => {

    try {

        const orderId =
            Number(req.params.id);


        const result =
            await pool.query(
                `
                DELETE FROM orders
                WHERE id = $1
                `,
                [orderId]
            );


        if (
            result.rowCount === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."

            });

        }


        res.json({

            success: true,

            message:
                "Order deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete order error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to delete order."

        });

    }

});


// =====================================
// START SERVER
// =====================================

initializeDatabase()

    .then(() => {

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Dhana Foods running on port ${PORT}`
                );

            }
        );

    })

    .catch(error => {

        console.error(
            "Database initialization failed:",
            error
        );

        process.exit(1);

    });