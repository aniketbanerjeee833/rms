// // middleware/insideRestaurant.js

// const R_LAT = Number(process.env.RESTAURANT_LAT);
// const R_LNG = Number(process.env.RESTAURANT_LNG);
// const RADIUS_M = Number(process.env.RESTAURANT_RADIUS_M || 120);

// const distanceM = (lat1, lon1, lat2, lon2) => {
//   const R = 6371000;

//   const rad = (degrees) => (degrees * Math.PI) / 180;

//   const dLat = rad(lat2 - lat1);
//   const dLon = rad(lon2 - lon1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(rad(lat1)) *
//       Math.cos(rad(lat2)) *
//       Math.sin(dLon / 2) ** 2;

//   return 2 * R * Math.asin(Math.sqrt(a));
// };

// export const requireInsideRestaurant = (req, res, next) => {
//   // -----------------------------------------------------
//   // 1. Allow disabling geofence during development
//   // -----------------------------------------------------

//   if (process.env.ENFORCE_GEOFENCE !== "true") {
//     return next();
//   }

//   // -----------------------------------------------------
//   // 2. Validate restaurant configuration
//   // -----------------------------------------------------

//   if (
//     !Number.isFinite(R_LAT) ||
//     !Number.isFinite(R_LNG) ||
//     !Number.isFinite(RADIUS_M) ||
//     RADIUS_M <= 0
//   ) {
//     console.error("❌ Invalid restaurant geofence configuration");

//     return res.status(500).json({
//       success: false,
//       message: "Restaurant location is not configured correctly.",
//     });
//   }

//   // -----------------------------------------------------
//   // 3. Get customer location
//   // -----------------------------------------------------

//   const location = req.body?.location;

//   if (!location) {
//     return res.status(403).json({
//       success: false,
//       message: "Please allow location access to place an order.",
//     });
//   }

//   const lat = Number(location.lat);
//   const lng = Number(location.lng);
//   const accuracy = Number(location.accuracy);

//   // -----------------------------------------------------
//   // 4. Validate coordinates
//   // -----------------------------------------------------

//   if (
//     !Number.isFinite(lat) ||
//     !Number.isFinite(lng) ||
//     lat < -90 ||
//     lat > 90 ||
//     lng < -180 ||
//     lng > 180
//   ) {
//     return res.status(403).json({
//       success: false,
//       message: "Unable to verify your location.",
//     });
//   }

//   // -----------------------------------------------------
//   // 5. Validate GPS accuracy
//   // -----------------------------------------------------

//   if (!Number.isFinite(accuracy) || accuracy < 0) {
//     return res.status(403).json({
//       success: false,
//       message: "Unable to get an accurate location. Please try again.",
//     });
//   }

//   // -----------------------------------------------------
//   // 6. Prevent extremely inaccurate GPS readings
//   // -----------------------------------------------------

//   // If the phone says its accuracy is worse than 200m,
//   // don't trust the location.
//   if (accuracy > 200) {
//     return res.status(403).json({
//       success: false,
//       message:
//         "Your location is not accurate enough. Please turn on GPS/location services and try again.",
//     });
//   }

//   // -----------------------------------------------------
//   // 7. Calculate distance from restaurant
//   // -----------------------------------------------------

//   const distance = distanceM(
//     lat,
//     lng,
//     R_LAT,
//     R_LNG
//   );

//   // -----------------------------------------------------
//   // 8. Give reasonable GPS accuracy tolerance
//   // -----------------------------------------------------

//   const slack = Math.min(accuracy, 100);

//   const effectiveDistance = Math.max(
//     0,
//     distance - slack
//   );

//   // -----------------------------------------------------
//   // 9. Geofence check
//   // -----------------------------------------------------

//   if (effectiveDistance > RADIUS_M) {
//     console.warn(
//       `🚫 Geofence rejected: distance=${distance.toFixed(
//         1
//       )}m accuracy=${accuracy.toFixed(
//         1
//       )}m radius=${RADIUS_M}m`
//     );

//     return res.status(403).json({
//       success: false,
//       message:
//         "You appear to be outside the restaurant. Please order from your table.",
//     });
//   }

//   // -----------------------------------------------------
//   // 10. Location accepted
//   // -----------------------------------------------------

//   console.log(
//     `✅ Geofence accepted: distance=${distance.toFixed(
//       1
//     )}m accuracy=${accuracy.toFixed(
//       1
//     )}m`
//   );

//   next();
// };

// middleware/insideRestaurant.js

// =====================================================
// RESTAURANT GEOFENCE CONFIGURATION
// =====================================================

// const RESTAURANT_LAT = 22.xxxxx;
// const RESTAURANT_LNG = 88.xxxxx;

// const RESTAURANT_RADIUS_M = 120;

// // Set false while testing locally.
// // Set true in production.
// const ENFORCE_GEOFENCE = false;


// // =====================================================
// // DISTANCE CALCULATION
// // =====================================================

// const distanceM = (lat1, lon1, lat2, lon2) => {
//   const R = 6371000;

//   const rad = (degrees) => (degrees * Math.PI) / 180;

//   const dLat = rad(lat2 - lat1);
//   const dLon = rad(lon2 - lon1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(rad(lat1)) *
//       Math.cos(rad(lat2)) *
//       Math.sin(dLon / 2) ** 2;

//   return 2 * R * Math.asin(Math.sqrt(a));
// };


// // =====================================================
// // MIDDLEWARE
// // =====================================================

// export const requireInsideRestaurant = (req, res, next) => {

//   // ---------------------------------------------------
//   // 1. Development bypass
//   // ---------------------------------------------------

//   if (!ENFORCE_GEOFENCE) {
//     return next();
//   }


//   // ---------------------------------------------------
//   // 2. Get customer location
//   // ---------------------------------------------------

//   const location = req.body?.location;

//   if (!location) {
//     return res.status(403).json({
//       success: false,
//       message: "Please allow location access to order.",
//     });
//   }


//   // ---------------------------------------------------
//   // 3. Read coordinates
//   // ---------------------------------------------------

//   const lat = Number(location.lat);
//   const lng = Number(location.lng);
//   const accuracy = Number(location.accuracy);


//   // ---------------------------------------------------
//   // 4. Validate coordinates
//   // ---------------------------------------------------

//   if (
//     !Number.isFinite(lat) ||
//     !Number.isFinite(lng) ||
//     lat < -90 ||
//     lat > 90 ||
//     lng < -180 ||
//     lng > 180
//   ) {
//     return res.status(403).json({
//       success: false,
//       message: "Unable to verify your location.",
//     });
//   }


//   // ---------------------------------------------------
//   // 5. Validate GPS accuracy
//   // ---------------------------------------------------

//   if (!Number.isFinite(accuracy) || accuracy < 0) {
//     return res.status(403).json({
//       success: false,
//       message: "Unable to get an accurate location. Please try again.",
//     });
//   }


//   // ---------------------------------------------------
//   // 6. Reject very inaccurate GPS
//   // ---------------------------------------------------

//   if (accuracy > 200) {
//     return res.status(403).json({
//       success: false,
//       message:
//         "Your location is not accurate enough. Please turn on GPS/location services and try again.",
//     });
//   }


//   // ---------------------------------------------------
//   // 7. Calculate distance
//   // ---------------------------------------------------

//   const distance = distanceM(
//     lat,
//     lng,
//     RESTAURANT_LAT,
//     RESTAURANT_LNG
//   );


//   // ---------------------------------------------------
//   // 8. GPS accuracy tolerance
//   // ---------------------------------------------------

//   const slack = Math.min(accuracy, 100);

//   const effectiveDistance = Math.max(
//     0,
//     distance - slack
//   );


//   // ---------------------------------------------------
//   // 9. Geofence check
//   // ---------------------------------------------------

//   if (effectiveDistance > RESTAURANT_RADIUS_M) {

//     console.warn(
//       `🚫 Geofence rejected: distance=${distance.toFixed(
//         1
//       )}m accuracy=${accuracy.toFixed(
//         1
//       )}m radius=${RESTAURANT_RADIUS_M}m`
//     );

//     return res.status(403).json({
//       success: false,
//       message:
//         "You appear to be outside the restaurant. Please order from your table.",
//     });
//   }


//   // ---------------------------------------------------
//   // 10. Accepted
//   // ---------------------------------------------------

//   console.log(
//     `✅ Geofence accepted: distance=${distance.toFixed(
//       1
//     )}m accuracy=${accuracy.toFixed(
//       1
//     )}m`
//   );

//   next();
// };