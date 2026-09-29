import express from "express";

import userAuth from "../middleware/userAuth.js";

import adminAuth from "../middleware/adminAuth.js";
import { addCoupon, getAllCoupons, toggleCouponStatus, updateCoupon } from "../controllers/couponController.js";

const router = express.Router();
router.post("/add",userAuth,adminAuth,addCoupon)
router.get("/get-all-coupons",userAuth,getAllCoupons)
router.patch("/update/:id",userAuth,adminAuth,updateCoupon)
router.patch("/toggle/status/:id",userAuth,adminAuth,toggleCouponStatus)
export default router;