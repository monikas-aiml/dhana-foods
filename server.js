require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;


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

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.static(__dirname));


/* =========================================================
   DHANA FOODS PRODUCTS + PRICES
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
   PRODUCT NAME ALIASES
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


function normalizeProductKey(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, " ");

}


function normalizeProductName(value) {

    const original =
        String(value || "").trim();

    const key =
        normalizeProductKey(original);

    return (
        PRODUCT_ALIASES[key] ||
        original
    );

}


/* =========================================================
   VALID ORDER STATUSES
========================================================= */

const VALID_STATUSES = [
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered"
];


/* =========================================================
   DATABASE SETUP
========================================================= */

async function setupDatabase() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS orders (

            id SERIAL PRIMARY KEY,

            customer_name TEXT,

            phone TEXT,

            address TEXT,

            items JSONB NOT NULL,

            total NUMERIC(10,2) NOT NULL DEFAULT 0,

            delivery_date DATE,

            status TEXT NOT NULL DEFAULT 'Pending',

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()

        )

    `);

    console.log("✅ PostgreSQL database ready");

}


/* =========================================================
   CUSTOMER WEBSITE
========================================================= */

app.get("/", function(req, res) {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* =========================================================
   ADMIN WEBSITE
========================================================= */

app.get("/admin", function(req, res) {

    res.sendFile(
        path.join(
            __dirname,
            "admin.html"
        )
    );

});


/* =========================================================
   PRODUCTS API
========================================================= */

app.get(
    "/api/products",
    function(req, res) {

        res.json(PRODUCT_PRICES);

    }
);


/* =========================================================
   CREATE ORDER
========================================================= */

app.post(
    "/api/orders",
    async function(req, res) {

        try {

            const {
                customerName,
                phone,
                address,
                items,
                deliveryDate
            } = req.body;


            if (
                !customerName ||
                !String(customerName).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Customer name is required."

                });

            }


            if (
                !phone ||
                !String(phone).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Phone number is required."

                });

            }


            if (
                !address ||
                !String(address).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Delivery address is required."

                });

            }


            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please select at least one product."

                });

            }


            const cleanItems = [];

            let total = 0;


            for (const item of items) {

                const product =
                    normalizeProductName(
                        item.product
                    );

                const size =
                    String(
                        item.size || ""
                    ).trim();

                const quantity =
                    Number(item.quantity);


                /* PRODUCT */

                if (
                    !PRODUCT_PRICES[product]
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            `Invalid product: ${product}`

                    });

                }


                /* SIZE */

                if (
                    PRODUCT_PRICES[product][size]
                    === undefined
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            `Invalid size for ${product}.`

                    });

                }


                /* QUANTITY */

                if (
                    !Number.isInteger(quantity) ||
                    quantity <= 0 ||
                    quantity > 100
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid quantity."

                    });

                }


                /* SERVER-AUTHORITATIVE PRICE */

                const price =
                    PRODUCT_PRICES[product][size];


                const itemTotal =
                    price * quantity;


                total += itemTotal;


                cleanItems.push({

                    product: product,

                    size: size,

                    quantity: quantity,

                    price: price,

                    total: itemTotal

                });

            }


            /* =================================================
               SAVE ORDER
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
                        status
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        'Pending'
                    )

                    RETURNING *

                    `,

                    [
                        String(
                            customerName
                        ).trim(),

                        String(
                            phone
                        ).trim(),

                        String(
                            address
                        ).trim(),

                        JSON.stringify(
                            cleanItems
                        ),

                        total,

                        deliveryDate || null

                    ]

                );


            const order =
                result.rows[0];


            return res.status(201).json({

                success: true,

                order: {

                    id:
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

                }

            });


        } catch (error) {

            console.error(
                "❌ Create order error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Failed to place order."

            });

        }

    }
);


/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get(
    "/api/orders",
    async function(req, res) {

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
                        status,
                        created_at

                    FROM orders

                    ORDER BY id DESC

                `);


            const orders =
                result.rows.map(
                    function(order) {

                        return {

                            id:
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
                                Number(
                                    order.total
                                ),

                            deliveryDate:
                                order.delivery_date,

                            status:
                                order.status,

                            createdAt:
                                order.created_at

                        };

                    }
                );


            res.json(orders);


        } catch (error) {

            console.error(
                "❌ Get orders error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Failed to load orders."

            });

        }

    }
);


/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get(
    "/api/orders/:id",
    async function(req, res) {

        try {

            const id =
                Number(req.params.id);


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid order ID."

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


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Order not found."

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
                "❌ Get order error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Failed to load order."

            });

        }

    }
);


/* =========================================================
   UPDATE STATUS
========================================================= */

app.put(
    "/api/orders/:id",
    async function(req, res) {

        try {

            const id =
                Number(req.params.id);

            const status =
                String(
                    req.body.status || ""
                ).trim();


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid order ID."

                });

            }


            if (
                !VALID_STATUSES.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    error:
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
                        id
                    ]

                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Order not found."

                });

            }


            const order =
                result.rows[0];


            res.json({

                success: true,

                order: {

                    id:
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

                }

            });


        } catch (error) {

            console.error(
                "❌ Update status error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Failed to update status."

            });

        }

    }
);


/* =========================================================
   DELETE ORDER
========================================================= */

app.delete(
    "/api/orders/:id",
    async function(req, res) {

        try {

            const id =
                Number(req.params.id);


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid order ID."

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


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
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
                "❌ Delete order error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Failed to delete order."

            });

        }

    }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/health",
    async function(req, res) {

        try {

            await pool.query(
                "SELECT 1"
            );


            res.json({

                success: true,

                status: "OK",

                database:
                    "Connected",

                service:
                    "Dhana Foods"

            });


        } catch (error) {

            res.status(500).json({

                success: false,

                status: "ERROR",

                database:
                    "Disconnected"

            });

        }

    }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        await setupDatabase();


        app.listen(
            PORT,
            "0.0.0.0",
            function() {

                console.log(
                    `🚀 Dhana Foods running on port ${PORT}`
                );

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
    async function() {

        console.log(
            "SIGTERM received."
        );

        await pool.end();

        process.exit(0);

    }
);


process.on(
    "SIGINT",
    async function() {

        console.log(
            "SIGINT received."
        );

        await pool.end();

        process.exit(0);

    }
);