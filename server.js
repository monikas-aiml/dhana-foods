const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

const PORT = 10000;

const DB_PATH = path.join(
    __dirname,
    "dhanafoods.db"
);


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));


/* =====================================================
   DATABASE
===================================================== */

const db = new sqlite3.Database(
    DB_PATH,
    (error) => {

        if (error) {

            console.error(
                "Database connection error:",
                error
            );

        } else {

            console.log(
                "✅ Connected to SQLite database"
            );

        }

    }
);


/* =====================================================
   PRODUCT PRICES
===================================================== */

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


/* =====================================================
   ALLOWED STATUS
===================================================== */

const ALLOWED_STATUSES = [

    "Pending",

    "Preparing",

    "Out for Delivery",

    "Delivered",

    "Cancelled"

];


/* =====================================================
   CREATE / REPAIR DATABASE TABLE
===================================================== */

function setupDatabase() {

    db.run(
        `
        CREATE TABLE IF NOT EXISTS orders (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            customer_name TEXT NOT NULL,

            phone TEXT NOT NULL,

            address TEXT NOT NULL,

            items TEXT NOT NULL,

            total REAL NOT NULL,

            delivery_date TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT 'Pending',

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

        )
        `,
        (error) => {

            if (error) {

                console.error(
                    "❌ Table creation error:",
                    error
                );

                return;

            }


            console.log(
                "✅ Orders table ready"
            );


            repairDatabaseColumns();

        }
    );

}


/* =====================================================
   REPAIR OLD DATABASE COLUMNS
===================================================== */

function repairDatabaseColumns() {

    db.all(
        `PRAGMA table_info(orders)`,
        [],
        (error, columns) => {

            if (error) {

                console.error(
                    "❌ Unable to inspect database:",
                    error
                );

                return;

            }


            const existingColumns =
                columns.map(
                    column =>
                        column.name
                );


            const requiredColumns = {

                customer_name:
                    "TEXT",

                phone:
                    "TEXT",

                address:
                    "TEXT",

                items:
                    "TEXT",

                total:
                    "REAL",

                delivery_date:
                    "TEXT",

                status:
                    "TEXT DEFAULT 'Pending'",

                created_at:
                    "TEXT"

            };


            const missingColumns =
                Object.keys(
                    requiredColumns
                ).filter(
                    column =>
                        !existingColumns.includes(
                            column
                        )
                );


            if (
                missingColumns.length === 0
            ) {

                console.log(
                    "✅ Database schema is up to date"
                );

                return;

            }


            let completed = 0;


            missingColumns.forEach(
                column => {

                    const type =
                        requiredColumns[
                            column
                        ];


                    db.run(
                        `
                        ALTER TABLE orders
                        ADD COLUMN ${column} ${type}
                        `,
                        (alterError) => {

                            if (alterError) {

                                console.error(
                                    `❌ Could not add ${column}:`,
                                    alterError.message
                                );

                            } else {

                                console.log(
                                    `✅ Added missing column: ${column}`
                                );

                            }


                            completed++;


                            if (
                                completed ===
                                missingColumns.length
                            ) {

                                console.log(
                                    "✅ Database repair completed"
                                );

                            }

                        }
                    );

                }
            );

        }
    );

}


/* =====================================================
   CLEAN / VALIDATE ITEMS
===================================================== */

function cleanItems(
    incomingItems
) {

    if (
        !Array.isArray(
            incomingItems
        )
    ) {

        throw new Error(
            "Invalid order items."
        );

    }


    const cleanedItems = [];


    incomingItems.forEach(
        item => {

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


            if (
                quantity <= 0
            ) {

                return;

            }


            if (
                !PRODUCT_PRICES[
                    product
                ]
            ) {

                throw new Error(
                    `Invalid product: ${product}`
                );

            }


            if (
                !PRODUCT_PRICES[
                    product
                ][
                    size
                ]
            ) {

                throw new Error(
                    `Invalid size: ${product} - ${size}`
                );

            }


            const price =
                PRODUCT_PRICES[
                    product
                ][
                    size
                ];


            cleanedItems.push({

                product:
                    product,

                size:
                    size,

                quantity:
                    quantity,

                price:
                    price

            });

        }
    );


    if (
        cleanedItems.length === 0
    ) {

        throw new Error(
            "Please select at least one batter."
        );

    }


    return cleanedItems;

}


/* =====================================================
   CALCULATE TOTAL
===================================================== */

function calculateTotal(
    items
) {

    return items.reduce(
        (
            total,
            item
        ) => {

            return total +
                (
                    item.quantity *
                    item.price
                );

        },
        0
    );

}


/* =====================================================
   CREATE ORDER
===================================================== */

app.post(
    "/api/orders",
    (req, res) => {

        try {

            const {

                customerName,

                phone,

                address,

                deliveryDate,

                items

            } = req.body;


            if (
                !customerName ||
                !phone ||
                !address ||
                !deliveryDate
            ) {

                return res.status(400).json({

                    message:
                        "Please fill all customer details."

                });

            }


            const cleanedItems =
                cleanItems(
                    items
                );


            const total =
                calculateTotal(
                    cleanedItems
                );


            const itemsJSON =
                JSON.stringify(
                    cleanedItems
                );


            /*
               IMPORTANT:
               This INSERT uses only the
               new SQLite columns.
            */

            const sql = `

                INSERT INTO orders (

                    customer_name,

                    phone,

                    address,

                    items,

                    total,

                    delivery_date,

                    status,

                    created_at

                )

                VALUES (

                    ?,

                    ?,

                    ?,

                    ?,

                    ?,

                    ?,

                    'Pending',

                    datetime('now','localtime')

                )

            `;


            db.run(
                sql,
                [

                    customerName.trim(),

                    phone.trim(),

                    address.trim(),

                    itemsJSON,

                    total,

                    deliveryDate

                ],
                function(error) {

                    if (error) {

                        console.error(
                            "❌ Order insert error:",
                            error
                        );


                        return res.status(
                            500
                        ).json({

                            message:
                                error.message

                        });

                    }


                    console.log(
                        `✅ Order #${this.lastID} created`
                    );


                    res.status(201).json({

                        success:
                            true,

                        message:
                            "Order placed successfully.",

                        orderId:
                            this.lastID,

                        total:
                            total,

                        items:
                            cleanedItems

                    });

                }
            );


        } catch (error) {

            console.error(
                "❌ Order validation error:",
                error
            );


            res.status(400).json({

                message:
                    error.message

            });

        }

    }
);


/* =====================================================
   GET ALL ORDERS
===================================================== */

app.get(
    "/api/orders",
    (req, res) => {

        db.all(
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

            ORDER BY id DESC
            `,
            [],
            (error, rows) => {

                if (error) {

                    console.error(
                        "❌ Get orders error:",
                        error
                    );


                    return res.status(
                        500
                    ).json({

                        message:
                            error.message

                    });

                }


                const orders =
                    rows.map(
                        row => {

                            let items = [];


                            try {

                                items =
                                    JSON.parse(
                                        row.items ||
                                        "[]"
                                    );

                            } catch (
                                parseError
                            ) {

                                items = [];

                            }


                            return {

                                id:
                                    row.id,

                                customer_name:
                                    row.customer_name,

                                phone:
                                    row.phone,

                                address:
                                    row.address,

                                items:
                                    items,

                                total:
                                    Number(
                                        row.total
                                    ) || 0,

                                delivery_date:
                                    row.delivery_date,

                                status:
                                    row.status ||
                                    "Pending",

                                created_at:
                                    row.created_at

                            };

                        }
                    );


                res.json(
                    orders
                );

            }
        );

    }
);


/* =====================================================
   GET SINGLE ORDER
===================================================== */

app.get(
    "/api/orders/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id)
        ) {

            return res.status(400).json({

                message:
                    "Invalid order ID."

            });

        }


        db.get(
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

            WHERE id = ?
            `,
            [id],
            (error, row) => {

                if (error) {

                    return res.status(
                        500
                    ).json({

                        message:
                            error.message

                    });

                }


                if (!row) {

                    return res.status(
                        404
                    ).json({

                        message:
                            "Order not found."

                    });

                }


                let items = [];


                try {

                    items =
                        JSON.parse(
                            row.items ||
                            "[]"
                        );

                } catch (
                    parseError
                ) {

                    items = [];

                }


                res.json({

                    id:
                        row.id,

                    customer_name:
                        row.customer_name,

                    phone:
                        row.phone,

                    address:
                        row.address,

                    items:
                        items,

                    total:
                        Number(
                            row.total
                        ) || 0,

                    delivery_date:
                        row.delivery_date,

                    status:
                        row.status,

                    created_at:
                        row.created_at

                });

            }
        );

    }
);


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

app.put(
    "/api/orders/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const status =
            String(
                req.body.status ||
                ""
            ).trim();


        if (
            !Number.isInteger(id)
        ) {

            return res.status(400).json({

                message:
                    "Invalid order ID."

            });

        }


        if (
            !ALLOWED_STATUSES.includes(
                status
            )
        ) {

            return res.status(400).json({

                message:
                    "Invalid order status."

            });

        }


        db.run(
            `
            UPDATE orders

            SET status = ?

            WHERE id = ?
            `,
            [
                status,
                id
            ],
            function(error) {

                if (error) {

                    return res.status(
                        500
                    ).json({

                        message:
                            error.message

                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(
                        404
                    ).json({

                        message:
                            "Order not found."

                    });

                }


                res.json({

                    success:
                        true,

                    message:
                        "Order status updated.",

                    status:
                        status

                });

            }
        );

    }
);


/* =====================================================
   DELETE ORDER
===================================================== */

app.delete(
    "/api/orders/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id)
        ) {

            return res.status(400).json({

                message:
                    "Invalid order ID."

            });

        }


        db.run(
            `
            DELETE FROM orders

            WHERE id = ?
            `,
            [id],
            function(error) {

                if (error) {

                    return res.status(
                        500
                    ).json({

                        message:
                            error.message

                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(
                        404
                    ).json({

                        message:
                            "Order not found."

                    });

                }


                res.json({

                    success:
                        true,

                    message:
                        "Order deleted."

                });

            }
        );

    }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Dhana Foods server is running.",

            database:
                "SQLite",

            port:
                PORT

        });

    }
);


/* =====================================================
   START DATABASE THEN SERVER
===================================================== */

setupDatabase();


app.listen(
    PORT,
    () => {

        console.log(
            ""
        );

        console.log(
            "===================================="
        );

        console.log(
            "🥣 DHANA FOODS SERVER"
        );

        console.log(
            "===================================="
        );

        console.log(
            `✅ Server: http://localhost:${PORT}`
        );

        console.log(
            `✅ Admin:  http://localhost:${PORT}/admin.html`
        );

        console.log(
            `✅ Database: ${DB_PATH}`
        );

        console.log(
            "===================================="
        );

    }
);


/* =====================================================
   GRACEFUL SHUTDOWN
===================================================== */

process.on(
    "SIGINT",
    () => {

        console.log(
            "\nClosing database..."
        );


        db.close(
            () => {

                console.log(
                    "Database closed."
                );

                process.exit(0);

            }
        );

    }
);