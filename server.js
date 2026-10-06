require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT) || 10000;


/* =========================================================
   POSTGRESQL
========================================================= */

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: process.env.DATABASE_URL
        ? {
            rejectUnauthorized: false
        }
        : false
});


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =========================================================
   DHANA FOODS OFFICIAL PRICES
========================================================= */

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

    "Mappilai Samba": {
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

    "Poongar": {
        "500g": 40,
        "1kg": 80
    },

    "Karuppu Kavuni": {
        "500g": 40,
        "1kg": 80
    },

    "Keerai Batter": {
        "500g": 40,
        "1kg": 80
    },

    "Kambu Yasnam": {
        "500g": 40,
        "1kg": 80
    },

    "Ragi Batter": {
        "500g": 40,
        "1kg": 80
    },

    "Karinagaruvai": {
        "500g": 40,
        "1kg": 80
    },

    "Pachai Payiru": {
        "500g": 40,
        "1kg": 80
    }

};


/* =========================================================
   ALLOWED STATUS
========================================================= */

const ALLOWED_STATUSES = [
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
];


/* =========================================================
   DATABASE SETUP
========================================================= */

async function initDatabase() {

    try {

        console.log("Checking PostgreSQL database...");


        /* -----------------------------------------------
           CREATE ORDERS TABLE
        ----------------------------------------------- */

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (

                id SERIAL PRIMARY KEY,

                customer_name TEXT,

                phone TEXT,

                address TEXT,

                items JSONB,

                total NUMERIC(10,2),

                delivery_date DATE,

                status TEXT DEFAULT 'Pending',

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP

            )
        `);


        /* -----------------------------------------------
           ADD COLUMNS IF OLD TABLE EXISTS
        ----------------------------------------------- */

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS customer_name TEXT
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS phone TEXT
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS address TEXT
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS items JSONB
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS total NUMERIC(10,2)
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS delivery_date DATE
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS status TEXT
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP
        `);


        /* -----------------------------------------------
           OLD LEGACY COLUMNS
        ----------------------------------------------- */

        await pool.query(`
            DO $$
            BEGIN

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'orders'
                    AND column_name = 'product'
                ) THEN
                    ALTER TABLE orders
                    ALTER COLUMN product DROP NOT NULL;
                END IF;


                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'orders'
                    AND column_name = 'size'
                ) THEN
                    ALTER TABLE orders
                    ALTER COLUMN size DROP NOT NULL;
                END IF;


                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'orders'
                    AND column_name = 'quantity'
                ) THEN
                    ALTER TABLE orders
                    ALTER COLUMN quantity DROP NOT NULL;
                END IF;


                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'orders'
                    AND column_name = 'price'
                ) THEN
                    ALTER TABLE orders
                    ALTER COLUMN price DROP NOT NULL;
                END IF;

            END $$;
        `);


        /* -----------------------------------------------
           FIX OLD NULL STATUS
        ----------------------------------------------- */

        await pool.query(`
            UPDATE orders
            SET status = 'Pending'
            WHERE status IS NULL
        `);


        console.log("PostgreSQL database ready.");

    } catch (error) {

        console.error(
            "Database initialization error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   CREATE ORDER
========================================================= */

app.post(
    "/api/orders",
    async (req, res) => {

        try {

            console.log(
                "ORDER REQUEST RECEIVED:",
                JSON.stringify(req.body, null, 2)
            );


            /* ---------------------------------------------
               ACCEPT MULTIPLE FIELD NAMES
               This fixes old/new script mismatch.
            --------------------------------------------- */

            const customerName = String(
                req.body.customerName ||
                req.body.customer_name ||
                req.body.name ||
                req.body.fullName ||
                ""
            ).trim();


            const phone = String(
                req.body.phone ||
                req.body.phoneNumber ||
                req.body.mobile ||
                ""
            ).trim();


            const address = String(
                req.body.address ||
                req.body.deliveryAddress ||
                ""
            ).trim();


            const deliveryDate = String(
                req.body.deliveryDate ||
                req.body.delivery_date ||
                ""
            ).trim();


            const items = req.body.items;


            /* ---------------------------------------------
               CUSTOMER VALIDATION
            --------------------------------------------- */

            if (!customerName) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Customer name is required."

                });
            }


            if (!phone) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone number is required."

                });
            }


            if (!address) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery address is required."

                });
            }


            if (!deliveryDate) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery date is required."

                });
            }


            /* ---------------------------------------------
               ITEMS VALIDATION
            --------------------------------------------- */

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


            /* ---------------------------------------------
               CALCULATE TOTAL
            --------------------------------------------- */

            let total = 0;

            const cleanItems = [];


            for (const item of items) {

                const product =
                    String(
                        item.product || ""
                    ).trim();


                const size =
                    String(
                        item.size || ""
                    ).trim();


                const quantity =
                    Number(
                        item.quantity
                    );


                if (!PRODUCT_PRICES[product]) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `Invalid product: ${product}`

                    });
                }


                if (
                    PRODUCT_PRICES[product][size]
                    === undefined
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `Invalid size for ${product}.`

                    });
                }


                if (
                    !Number.isInteger(quantity) ||
                    quantity <= 0 ||
                    quantity > 100
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid quantity."

                    });
                }


                const price =
                    PRODUCT_PRICES[product][size];


                const itemTotal =
                    quantity * price;


                total += itemTotal;


                cleanItems.push({

                    product:
                        product,

                    size:
                        size,

                    quantity:
                        quantity,

                    price:
                        price,

                    itemTotal:
                        itemTotal

                });

            }


            /* ---------------------------------------------
               SAVE ORDER
            --------------------------------------------- */

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
                        status,
                        created_at
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        CURRENT_TIMESTAMP
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
                        customerName,
                        phone,
                        address,
                        JSON.stringify(cleanItems),
                        total,
                        deliveryDate,
                        "Pending"
                    ]

                );


            const order =
                result.rows[0];


            /* ---------------------------------------------
               SUCCESS RESPONSE
            --------------------------------------------- */

            console.log(
                "ORDER SAVED:",
                JSON.stringify(order, null, 2)
            );


            return res.status(201).json({

                success: true,

                orderId:
                    order.id,

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

            });


        } catch (error) {

            console.error(
                "CREATE ORDER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Unable to place order."

            });

        }

    }
);


/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get(
    "/api/orders",
    async (req, res) => {

        try {

            const result =
                await pool.query(`

                    SELECT *

                    FROM orders

                    ORDER BY
                        created_at DESC

                `);


            return res.json(
                result.rows
            );


        } catch (error) {

            console.error(
                "GET ORDERS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load orders."

            });
        }
    }
);


/* =========================================================
   GET ONE ORDER
========================================================= */

app.get(
    "/api/orders/:id",
    async (req, res) => {

        try {

            const result =
                await pool.query(

                    `
                    SELECT *

                    FROM orders

                    WHERE id = $1
                    `,

                    [req.params.id]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."

                });
            }


            return res.json({

                success: true,

                order:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "GET ONE ORDER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
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

            const status =
                req.body.status;


            if (
                !ALLOWED_STATUSES.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order status."

                });
            }


            const result =
                await pool.query(

                    `
                    UPDATE orders

                    SET status = $1

                    WHERE id = $2

                    RETURNING *
                    `,

                    [
                        status,
                        req.params.id
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."

                });
            }


            return res.json({

                success: true,

                message:
                    "Order status updated.",

                order:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "UPDATE STATUS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
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

            const result =
                await pool.query(

                    `
                    DELETE FROM orders

                    WHERE id = $1

                    RETURNING id
                    `,

                    [req.params.id]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."

                });
            }


            return res.json({

                success: true,

                message:
                    "Order deleted successfully."

            });


        } catch (error) {

            console.error(
                "DELETE ORDER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to delete order."

            });
        }
    }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await pool.query(
                "SELECT 1"
            );


            return res.json({

                success: true,

                database:
                    "PostgreSQL",

                status:
                    "OK",

                service:
                    "Dhana Foods"

            });


        } catch (error) {

            return res.status(500).json({

                success: false,

                database:
                    "PostgreSQL",

                status:
                    "ERROR"

            });
        }
    }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        await initDatabase();


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Dhana Foods running on port ${PORT}`
                );

            }
        );


    } catch (error) {

        console.error(
            "SERVER STARTUP FAILED:",
            error
        );

        process.exit(1);
    }
}


startServer();