
import express from "express";
import { getSession, placeCustomerOrder, scanTable } from "../controllers/customerOrderController.js";
const router = express.Router();

import rateLimit from "express-rate-limit";


const scanLimiter  = rateLimit({ windowMs: 60_000, max: 30 });
const orderLimiter = rateLimit({ windowMs: 60_000, max: 10 });

//router.post("/scan/:qr_slug",            scanLimiter, requireInsideRestaurant,scanTable);
//router.post("/scan/:qr_slug",            scanLimiter,requireInsideRestaurant,scanTable);
router.post("/scan/:qr_slug",            scanLimiter,scanTable);
router.get ("/session/:token",                         getSession);
router.post("/session/:token/orders",    orderLimiter, placeCustomerOrder);
//router.get ("/menu",                                   getPublicMenu); // see note below

export default router;