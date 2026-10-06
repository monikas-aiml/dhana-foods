require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const path = require("path");


const app = express();


/* =========================================================
   PORT
========================================================= */

const PORT =
    process.env.PORT || 10000;


/* =========================================================
   POSTGRESQL
========================================================= */

if (!process.env.DATABASE_URL) {

    console.error(
        "ERROR: DATABASE_URL is not configured."
    );

}


const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl:
        process.env.DATABASE_URL
            ? {
                rejectUnauthorized: false
            }
            : false

});


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


/*
   Serve all website files
   from the same folder.
*/

app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =========================================================
   DHANA FOODS PRODUCT PRICES
========================================================= */

const PRODUCT_PRICES = {

    "Idli Batter": {

        "500g": 20,

        "1kg": 40

    },


    "Dosa Batter": {

        "500g": 20,

        "1kg": 40

    },


    "Adai Batter": {

        "500g": 40,

        "1kg": 80

    },


    "Mappilai Samba Batter": {

        "500g": 60,

        "1kg": 120

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
   PRODUCT NAME ALIASES
========================================================= */

const PRODUCT_ALIASES = {

    "idli batter":
        "Idli Batter",

    "dosa batter":
        "Dosa Batter",

    "adai batter":
        "Adai Batter",

    "mappilai samba":
        "Mappilai Samba Batter",

    "mappilai samba batter":
        "Mappilai Samba Batter",

    "appam batter":
        "Appam Batter",

    "millet batter":
        "Millet Batter",

    "poongar":
        "Poonghar Batter",

    "poongar batter":
        "Poonghar Batter",

    "poonghar":
        "Poonghar Batter",

    "poonghar batter":
        "Poonghar Batter",

    "karupu kavuni":
        "Karuppu Kavuni Batter",

    "karupu kavuni batter":
        "Karuppu Kavuni Batter",

    "karuppu kavuni":
        "Karuppu Kavuni Batter",

    "karuppu kavuni batter":
        "Karuppu Kavuni Batter",

    "keerai batter":
        "Keerai Batter",

    "kambu yasnam":
        "Kambu Yasnam Batter",

    "kambu yasnam batter":
        "Kambu Yasnam Batter",

    "ragi batter":
        "Ragi Batter",

    "karinagaruvai":
        "Karunguruvai Batter",

    "karinagaruvai batter":
        "Karunguruvai Batter",

    "karunaguvrai":
        "Karunguruvai Batter",

    "karunaguvrai batter":
        "Karunguruvai Batter",

    "karunguruvai":
        "Karunguruvai Batter",

    "karunguruvai batter":
        "Karunguruvai Batter",

    "pachai payiru":
        "Pachai Payiru Batter",

    "pachai payiru batter":
        "Pachai Payiru Batter"

};


/* =========================================================
   NORMALIZE PRODUCT NAME
========================================================= */

function normalizeProductName(
    product
) {

    const original =
        String(
            product || ""
        ).trim();


    const key =
        original.toLowerCase();


    return (
        PRODUCT_ALIASES[key] ||
        original
    );

}


/* =========================================================
   ALLOWED ORDER STATUS
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

        console.log(
            "Checking PostgreSQL database..."
        );


        /* =====================================================
           CREATE ORDERS TABLE
        ===================================================== */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS orders (

                id SERIAL PRIMARY KEY,

                customer_name TEXT,

                phone TEXT,

                address TEXT,

                items JSONB,

                total NUMERIC,

                delivery_date DATE,

                status TEXT DEFAULT 'Pending',

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP

            )

        `);


        /* =====================================================
           ADD REQUIRED COLUMNS IF OLD TABLE IS BEING USED
        ===================================================== */

        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                customer_name TEXT

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                phone TEXT

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                address TEXT

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                items JSONB

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                total NUMERIC

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                delivery_date DATE

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                status TEXT

        `);


        await pool.query(`

            ALTER TABLE orders

            ADD COLUMN IF NOT EXISTS
                created_at TIMESTAMP

        `);


        /* =====================================================
           MAKE LEGACY COLUMNS OPTIONAL

           Older database versions may contain:

           product
           size
           quantity
           price

           They are kept for old orders but are not required
           for the new order system.
        ===================================================== */

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

                    ALTER COLUMN product
                    DROP NOT NULL;

                END IF;


                IF EXISTS (

                    SELECT 1

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND table_name = 'orders'

                    AND column_name = 'size'

                ) THEN

                    ALTER TABLE orders

                    ALTER COLUMN size
                    DROP NOT NULL;

                END IF;


                IF EXISTS (

                    SELECT 1

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND table_name = 'orders'

                    AND column_name = 'quantity'

                ) THEN

                    ALTER TABLE orders

                    ALTER COLUMN quantity
                    DROP NOT NULL;

                END IF;


                IF EXISTS (

                    SELECT 1

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND table_name = 'orders'

                    AND column_name = 'price'

                ) THEN

                    ALTER TABLE orders

                    ALTER COLUMN price
                    DROP NOT NULL;

                END IF;


            END $$;

        `);


        /* =====================================================
           FIX NULL STATUS
        ===================================================== */

        await pool.query(`

            UPDATE orders

            SET status = 'Pending'

            WHERE status IS NULL

        `);


        /* =====================================================
           FIX NULL CREATED DATE
        ===================================================== */

        await pool.query(`

            UPDATE orders

            SET created_at =
                CURRENT_TIMESTAMP

            WHERE created_at IS NULL

        `);


        console.log(
            "PostgreSQL database ready."
        );


        console.log(
            "Orders table ready."
        );


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
                "New order received:"
            );


            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );


            const {

                customerName,

                phone,

                address,

                items,

                deliveryDate

            } = req.body;


            /* =================================================
               CUSTOMER NAME
            ================================================= */

            const cleanCustomerName =
                String(
                    customerName || ""
                ).trim();


            if (
                !cleanCustomerName
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Customer name is required."

                });

            }


            /* =================================================
               PHONE
            ================================================= */

            const cleanPhone =
                String(
                    phone || ""
                ).trim();


            if (
                !cleanPhone
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone number is required."

                });

            }


            /* =================================================
               ADDRESS
            ================================================= */

            const cleanAddress =
                String(
                    address || ""
                ).trim();


            if (
                !cleanAddress
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery address is required."

                });

            }


            /* =================================================
               DELIVERY DATE
            ================================================= */

            const cleanDeliveryDate =
                String(
                    deliveryDate || ""
                ).trim();


            if (
                !cleanDeliveryDate
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery date is required."

                });

            }


            /* =================================================
               CHECK DATE FORMAT
            ================================================= */

            const datePattern =
                /^\d{4}-\d{2}-\d{2}$/;


            if (
                !datePattern.test(
                    cleanDeliveryDate
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid delivery date."

                });

            }


            /* =================================================
               ITEMS
            ================================================= */

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


            /* =================================================
               CALCULATE TOTAL
            ================================================= */

            let total = 0;


            const cleanItems = [];


            for (
                const item of items
            ) {


                /* =============================================
                   PRODUCT
                ============================================= */

                const product =
                    normalizeProductName(
                        item.product
                    );


                /* =============================================
                   SIZE
                ============================================= */

                const size =
                    String(
                        item.size || ""
                    ).trim();


                /* =============================================
                   QUANTITY
                ============================================= */

                const quantity =
                    Number(
                        item.quantity
                    );


                /* =============================================
                   CHECK PRODUCT
                ============================================= */

                if (
                    !PRODUCT_PRICES[
                        product
                    ]
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `Invalid product: ${product}`

                    });

                }


                /* =============================================
                   CHECK SIZE
                ============================================= */

                if (
                    PRODUCT_PRICES[
                        product
                    ][size] === undefined
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `Invalid size for ${product}.`

                    });

                }


                /* =============================================
                   CHECK QUANTITY
                ============================================= */

                if (
                    !Number.isInteger(
                        quantity
                    ) ||
                    quantity <= 0 ||
                    quantity > 100
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid quantity."

                    });

                }


                /* =============================================
                   OFFICIAL PRICE

                   IMPORTANT:

                   Price comes from the server,
                   not from the browser.

                   This prevents incorrect prices.
                ============================================= */

                const price =
                    PRODUCT_PRICES[
                        product
                    ][size];


                /* =============================================
                   ITEM TOTAL
                ============================================= */

                const itemTotal =
                    quantity * price;


                total +=
                    itemTotal;


                /* =============================================
                   SAVE CLEAN ITEM
                ============================================= */

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


            /* =================================================
               INSERT INTO POSTGRESQL
            ================================================= */

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

                        cleanCustomerName,

                        cleanPhone,

                        cleanAddress,

                        JSON.stringify(
                            cleanItems
                        ),

                        total,

                        cleanDeliveryDate,

                        "Pending"

                    ]

                );


            /* =================================================
               GET SAVED ORDER
            ================================================= */

            const savedOrder =
                result.rows[0];


            console.log(
                "Order saved successfully."
            );


            console.log(
                "Order ID:",
                savedOrder.id
            );


            console.log(
                "Customer:",
                savedOrder.customer_name
            );


            console.log(
                "Delivery Date:",
                savedOrder.delivery_date
            );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.json({

                success: true,

                orderId:
                    savedOrder.id,

                total:
                    Number(
                        savedOrder.total
                    ),

                deliveryDate:
                    savedOrder.delivery_date,

                status:
                    savedOrder.status,

                createdAt:
                    savedOrder.created_at

            });


        } catch (error) {

            console.error(
                "Create order error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
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
                "Get orders error:",
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

            const {
                id
            } = req.params;


            const result =
                await pool.query(

                    `

                    SELECT *

                    FROM orders

                    WHERE id = $1

                    `,

                    [id]

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
                "Get order error:",
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

            const {
                id
            } = req.params;


            const {
                status
            } = req.body;


            /* =================================================
               CHECK STATUS
            ================================================= */

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


            /* =================================================
               UPDATE
            ================================================= */

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

                        id

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
                "Status update error:",
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

            const {
                id
            } = req.params;


            const result =
                await pool.query(

                    `

                    DELETE FROM orders

                    WHERE id = $1

                    RETURNING id

                    `,

                    [id]

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
                "Delete order error:",
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
                    "connected",

                server:
                    "running"

            });


        } catch (error) {

            console.error(
                "Health check error:",
                error
            );


            return res.status(500).json({

                success: false,

                database:
                    "disconnected",

                server:
                    "running"

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


                console.log(
                    `Website: http://localhost:${PORT}`
                );


                console.log(
                    `Admin: http://localhost:${PORT}/admin.html`
                );

            }

        );


    } catch (error) {

        console.error(
            "Server startup failed:",
            error
        );


        process.exit(1);

    }

}


/* =========================================================
   SHUTDOWN - SIGINT
========================================================= */

process.on(
    "SIGINT",
    async () => {

        console.log(
            "Shutting down server..."
        );


        await pool.end();


        process.exit(0);

    }
);


/* =========================================================
   SHUTDOWN - SIGTERM
========================================================= */

process.on(
    "SIGTERM",
    async () => {

        console.log(
            "Shutting down server..."
        );


        await pool.end();


        process.exit(0);

    }
);


/* =========================================================
   START
========================================================= */

startServer();