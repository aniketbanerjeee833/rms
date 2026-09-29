import db from "../config/db.js";
// controllers/couponController.js





// ==========================
// ADD COUPON
// ==========================
const validTypes = ["PERCENT", "FLAT"];
const addCoupon = async (req, res, next) => {
    let connection;

    try {

        const {
            code,
            discount_type,
            discount_value,
            is_active
        } = req.body;
        if (!code || !discount_value) {
            // const error = new Error("All fields are required");
            // error.status = 400;
            // throw error;
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        if (!validTypes.includes(discount_type)) {

            return res.status(400).json({
                success: false,
                message: "Invalid discount type"
            });
        }


        connection = await db.getConnection();
        await connection.beginTransaction();


        // check existing coupon
        const [existingCoupon] = await connection.query(
            `
            SELECT id
            FROM coupons
            WHERE code = ?
            `,
            [code.toUpperCase()]
        );

        if (existingCoupon.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        await connection.execute(
            `
            INSERT INTO coupons (
                code,
                discount_type,
                discount_value,
                is_active
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                code.toUpperCase(),
                discount_type,
                discount_value,
                is_active ?? 1
            ]
        );
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Coupon added successfully"
        });

    } catch (error) {

        if (connection) await connection.rollback();
        next(error);

        // return res.status(500).json({
        //     success: false,
        //     message: "Internal server error",
        //     error: error.message
        // });

    } finally {

        if (connection) connection.release();

    }
};



// ==========================
// GET ALL COUPONS
// ==========================

const getAllCoupons = async (req, res, next) => {

    let connection;

    try {

        connection = await db.getConnection();

        const [coupons] = await connection.query(
            `
            SELECT *
            FROM coupons
            ORDER BY created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            total: coupons.length,
            data: coupons
        });

    } catch (error) {

        console.log(error);
        next(error);

        // return res.status(500).json({
        //     success: false,
        //     message: "Internal server error"
        // });

    } finally {

        if (connection) connection.release();

    }
};



// ==========================
// UPDATE COUPON
// ==========================

const updateCoupon = async (req, res, next) => {

    let connection;

    try {

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Coupon ID is required"
            });
        }

        const {
            code,
            discount_type,
            discount_value,
            is_active
        } = req.body;
        if (!code || !discount_value) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (!validTypes.includes(discount_type)) {

            return res.status(400).json({
                success: false,
                message: "Invalid discount type"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [coupon] = await connection.query(
            `
            SELECT *
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupon.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        // check existing coupon
        const [existingCoupon] = await connection.query(
            `
            SELECT id
            FROM coupons
            WHERE code = ? AND id != ?
            `,
            [code.toUpperCase(), id]
        );

        if (existingCoupon.length > 0) {

            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        await connection.execute(
            `
            UPDATE coupons
            SET
                code = ?,
                discount_type = ?,
                discount_value = ?,
                is_active = ?
            WHERE id = ?
            `,
            [
                code.toUpperCase(),
                discount_type,
                discount_value,
                is_active,
                id
            ]
        );
        await connection.commit();
        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully"
        });

    } catch (error) {

        if (connection) await connection.rollback();
        next(error);

        // return res.status(500).json({
        //     success: false,
        //     message: "Internal server error"
        // });

    } finally {

        if (connection) connection.release();

    }
};

// ==========================
// UPDATE COUPON
// ==========================

const toggleCouponStatus = async (req, res, next) => {

    let connection;

    try {

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Coupon ID is required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [coupon] = await connection.query(
            `
            SELECT id, is_active
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupon.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        await connection.execute(
            `
            UPDATE coupons
            SET is_active = IF(is_active = 1, 0, 1)
            WHERE id = ?
            `,
            [id]
        );
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Coupon status updated successfully"
        });

    } catch (error) {
       
        if (connection) await connection.rollback();
        next(error);
    } finally {

        if (connection) connection.release();
    }
}
        


// ==========================
// DELETE COUPON
// ==========================

const deleteCoupon = async (req, res,next) => {

    let connection;

    try {

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Coupon ID is required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [coupon] = await connection.query(
            `
            SELECT *
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupon.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        await connection.execute(
            `
            DELETE FROM coupons
            WHERE id = ?
            `,
            [id]
        );
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });

    } catch (error) {

        console.log(error);
        next(error);
        // return res.status(500).json({
        //     success: false,
        //     message: "Internal server error"
        // });

    } finally {

        if (connection) connection.release();

    }
};




export {
    addCoupon,
    getAllCoupons,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
};