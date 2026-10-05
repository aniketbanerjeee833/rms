

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingCart, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  useScanTableMutation,
  useGetSessionQuery,
  usePlaceCustomerOrderMutation,
} from "../../redux/api/customerOrderApi";
import { useGetAllFoodItemsQuery } from "../../redux/api/foodItemApi";
import { useGetAllCategoriesQuery } from "../../redux/api/itemApi";

// put VITE_API_URL=http://192.168.0.101:4000 in frontend/.env and restart Vite
const API_URL = "http://192.168.0.101:4000";

export default function CustomerQRMenuView() {
  const { qr_slug } = useParams();

  // =====================================================
  // SCAN: find or create the table's session
  // =====================================================
  const [scanTable] = useScanTableMutation();
  const [token, setToken] = useState(null);
  const [scanError, setScanError] = useState("");
  const scanned = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (scanned.current) return;
    scanned.current = true;

    scanTable(qr_slug)
      .unwrap()
      .then((res) => setToken(res.token))
      .catch((e) =>
        setScanError(e?.data?.message || "Invalid QR code. Please ask staff.")
      );
  }, [qr_slug, scanTable]);
//LATER
// useEffect(() => {
//   if (scanned.current) return;

//   scanned.current = true;

//   if (!navigator.geolocation) {
//     setScanError("Location is not supported by this browser.");
//     return;
//   }

//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       const { latitude, longitude, accuracy } = position.coords;

//       console.log("📍 Location:", {
//         latitude,
//         longitude,
//         accuracy,
//       });

//       scanTable({
//         qr_slug,
//         location: {
//           lat: latitude,
//           lng: longitude,
//           accuracy,
//         },
//       })
//         .unwrap()
//         .then((res) => {
//           setToken(res.token);
//         })
//         .catch((e) => {
//           console.log("❌ Scan error:", e);

//           setScanError(
//             e?.data?.message ||
//               "Unable to verify your location. Please try again."
//           );
//         });
//     },
//     (error) => {
//       console.log("❌ Geolocation error:", error);

//       let message = "Unable to get your location.";

//       if (error.code === 1) {
//         message =
//           "Location permission is denied. Please allow location access for this website.";
//       } else if (error.code === 2) {
//         message =
//           "Your location could not be determined. Please turn on GPS/location services and try again.";
//       } else if (error.code === 3) {
//         message =
//           "Location request timed out. Please try again.";
//       }

//       setScanError(message);
//     },
//     {
//       enableHighAccuracy: true,
//       timeout: 15000,
//       maximumAge: 30000,
//     }
//   );
// }, [qr_slug, scanTable]);

  // =====================================================
  // SESSION (polled so everyone at the table stays in sync)
  // =====================================================
  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useGetSessionQuery(token, {
    skip: !token,
    pollingInterval: 4000,
  });

  const sessionClosed = sessionError?.status === 410;
  const [searchTerm, setSearchTerm] = useState("");

  // =====================================================
  // MENU
  // =====================================================
  const { data: menuItems, isLoading: isMenuLoading } = useGetAllFoodItemsQuery({
    orderType: "DINE_IN",
    search: searchTerm,
  });
  const { data: categories } = useGetAllCategoriesQuery();
  const items = menuItems?.foodItems || [];

  // =====================================================
  // CART (editable only until Place Order)
  // =====================================================
  const [cart, setCart] = useState({}); // { Item_Id: qty }
  const [cartLoaded, setCartLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);

  const [placeCustomerOrder, { isLoading: isPlacingOrder }] =
    usePlaceCustomerOrderMutation();

  const submittingRef = useRef(false);

  // restore the unsent cart for this session after a refresh
  useEffect(() => {
    if (!token) return;
    try {
      setCart(JSON.parse(localStorage.getItem(`cart_${token}`) || "{}"));
    } catch {
      /* ignore corrupted data */
    }
    setCartLoaded(true);
  }, [token]);

  // save the cart on every change (only after the restore has run)
  useEffect(() => {
    if (!token || !cartLoaded) return;
    localStorage.setItem(`cart_${token}`, JSON.stringify(cart));
  }, [cart, token, cartLoaded]);

  // session finished (PAID): drop the saved cart
  useEffect(() => {
    if (token && sessionClosed) {
      localStorage.removeItem(`cart_${token}`);
    }
  }, [sessionClosed, token]);

  // =====================================================
  // CATEGORIES + FILTER
  // =====================================================
  const existingCategories = [
    ...new Set((categories || []).map((c) => c.Item_Category)),
  ];
  const categoryList = ["All", ...existingCategories];

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const categoryMatch =
        activeCategory === "All" || item.Item_Category === activeCategory;
      const searchMatch = !term || item.Item_Name?.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });

    // Only sort when a specific category is selected
    if (activeCategory !== "All") {
      filtered.sort(
        (a, b) => Number(a.Item_Price || 0) - Number(b.Item_Price || 0)
      );
    }

    return filtered;
  }, [items, activeCategory, searchTerm]);

  // =====================================================
  // CART HELPERS
  // =====================================================
  const updateCart = (itemId, delta) => {
    setCart((prev) => {
      const newQty = Number(prev[itemId] || 0) + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: Math.min(newQty, 20) };
    });
  };

  const cartItems = useMemo(
    () =>
      items
        .filter((item) => cart[item.Item_Id])
        .map((item) => ({
          ...item,
          quantity: cart[item.Item_Id],
          amount: Number(item.Item_Price || 0) * Number(cart[item.Item_Id] || 0),
        })),
    [items, cart]
  );

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.amount, 0);

  // already sent to the kitchen (from the server, read-only)
  const placedItems = session?.items || [];
  const placedCount = placedItems.reduce((s, i) => s + Number(i.Quantity), 0);
  const placedTotal = Number(session?.total || 0);

  // is the fixed bottom bar showing?
  const hasBottomBar = totalItems > 0 || placedCount > 0;

  // =====================================================
  // PLACE ORDER
  // =====================================================
  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;
    if (!token) return toast.error("Table session not found.");
    if (cartItems.length === 0) return toast.error("Please add items first.");

    submittingRef.current = true;
    try {
      const response = await placeCustomerOrder({
        token,
        items: cartItems.map((item) => ({
          Item_Id: item.Item_Id,
          Quantity: item.quantity,
        })),
      }).unwrap();

      if (!response?.success) {
        toast.error(response?.message || "Unable to place order.");
        return;
      }

      toast.success("Order placed successfully!");
      setCart({}); // drawer stays open so the order shows under "Sent to kitchen"
    } catch (error) {
      toast.error(error?.data?.message || "Failed to place order.");
    } finally {
      submittingRef.current = false;
    }
  };

  // =====================================================
  // STATES: error / completed / loading
  // =====================================================
  if (scanError) {
    return <div className="p-8 text-center">{scanError}</div>;
  }

if (sessionClosed) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        {/* Green success icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-9 w-9"
            >
              <path d="M5 12l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-800">
          Order Completed
        </h3>

        <p className="mt-2 max-w-sm mx-auto text-gray-500">
          Thank you for your order!
        </p>

        <p className="mt-1 text-sm text-gray-400">
          Please scan the QR code on your table to order again.
        </p>
      </div>
    </div>
  );
}
  if (!token || isSessionLoading || isMenuLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p>Loading menu...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* STICKY TOP: header + category bar in ONE wrapper (no hardcoded top offset) */}
      <div
        className="sticky top-0 z-30 bg-white shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <header>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg font-bold">Restaurant Menu</h1>
              {session?.Table_Name && (
                <p className="text-sm text-gray-500">{session.Table_Name}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowOrderDrawer(true)}
              className="relative p-2"
            >
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 border rounded-lg bg-gray-100 px-3">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none py-2"
              />
            </div>
          </div>
        </header>

        {/* CATEGORY BAR */}
        <div className="border-t overflow-x-auto">
          <div className="flex gap-2 px-4 py-3">
            {categoryList.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                  activeCategory === category
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOD GRID: extra bottom padding so the last row clears the fixed bar */}
      {/* <main
        className="px-4 pt-4"
        style={{
          paddingBottom: hasBottomBar
            ? "calc(7rem + env(safe-area-inset-bottom, 0px))"
            : "calc(2rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => {
            const unavailable = item.is_available === 0;
            const quantity = cart[item.Item_Id] || 0;

            return (
              <div
                key={item.Item_Id}
                className={`bg-white rounded-xl overflow-hidden shadow flex flex-col h-full ${
                  unavailable ? "opacity-50" : ""
                }`}
              >
                {/* fixed-ratio box; object-contain shows the WHOLE image (no cropping) 
                <div className="aspect-[4/3] w-full bg-gray-100 flex items-center justify-center">
                  {item.Item_Image && (
                    <img
                      src={`${API_URL}/uploads/food-item/${item.Item_Image}`}
                      alt={item.Item_Name}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

               
                <div className="p-3 flex flex-col flex-1">
                 
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                    {item.Item_Name}
                  </h3>
                  <p className="text-gray-700 font-bold mt-1">
                    ₹{Number(item.Item_Price || 0).toFixed(2)}
                  </p>

                  {unavailable ? (
                    <p className="text-red-500 text-xs mt-auto pt-2">Unavailable</p>
                  ) : (
                   
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <button
                        type="button"
                        disabled={quantity === 0}
                        onClick={() => updateCart(item.Item_Id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCart(item.Item_Id, 1)}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main> */}
      <main
  className="px-4 pt-4"
  style={{
    paddingBottom: hasBottomBar
      ? "calc(7rem + env(safe-area-inset-bottom, 0px))"
      : "calc(2rem + env(safe-area-inset-bottom, 0px))",
  }}
>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {filteredItems.map((item) => {
      const unavailable = item.is_available === 0;
      const quantity = cart[item.Item_Id] || 0;

      return (
        <div
          key={item.Item_Id}
          className={`bg-white rounded-xl overflow-hidden shadow flex flex-col h-full ${
            unavailable ? "opacity-50" : ""
          }`}
        >
          {/* ================= IMAGE ================= */}
          {/* Fixed height/ratio for every card.
              object-contain ensures the COMPLETE image is visible.
              No cropping. */}
          <div className="aspect-[4/3] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {item.Item_Image ? (
              <img
                src={`${API_URL}/uploads/food-item/${item.Item_Image}`}
                alt={item.Item_Name}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">
                No image
              </span>
            )}
          </div>

          {/* ================= CARD BODY ================= */}
          <div className="p-3 flex flex-col flex-1 min-w-0">
  {/* ITEM NAME */}
  <h4
    className="
      font-semibold
      text-sm
      leading-snug
      line-clamp-2
      min-h-[2.5rem]
      break-words
      overflow-hidden
    "
  >
    {item.Item_Name}
  </h4>

  {/* PRICE */}
  <p className="text-gray-700 font-bold mt-1">
    ₹{Number(item.Item_Price || 0).toFixed(2)}
  </p>

  {/* QUANTITY */}
  {unavailable ? (
    <p className="text-red-500 text-xs mt-auto pt-3">
      Unavailable
    </p>
  ) : (
    <div className="flex items-center justify-between mt-auto pt-3">
      {/* MINUS */}
      <button
        type="button"
        disabled={quantity === 0}
        onClick={() => updateCart(item.Item_Id, -1)}
        className="
          w-8 h-8
          rounded-full
          bg-gray-100
          flex
          items-center
          justify-center
          transition
          disabled:opacity-40
          disabled:cursor-not-allowed
        "
      >
        <Minus size={16} />
      </button>

      {/* QUANTITY */}
      <span className="font-semibold text-sm">
        {quantity}
      </span>

      {/* PLUS */}
      <button
        type="button"
        onClick={() => updateCart(item.Item_Id, 1)}
        className="
          w-8 h-8
          rounded-full
          bg-red-500
          text-white
          flex
          items-center
          justify-center
          transition
          active:scale-95
        "
      >
        <Plus size={16} />
      </button>
    </div>
  )}
</div>
        </div>
      );
    })}
  </div>
</main>

      {/* BOTTOM BAR: placed order + current cart */}
      {hasBottomBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg px-3 pt-3 flex gap-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {placedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowOrderDrawer(true)}
              className="flex-1 border border-red-500 text-red-500 rounded-lg py-3 font-bold"
            >
              My Order ({placedCount}) · ₹{placedTotal.toFixed(2)}
            </button>
          )}
          {totalItems > 0 && (
            <button
              type="button"
              onClick={() => setShowOrderDrawer(true)}
              className="flex-1 bg-red-500 text-white rounded-lg py-3 font-bold"
            >
              Cart ({totalItems}) · ₹{cartTotal.toFixed(2)}
            </button>
          )}
        </div>
      )}

      {/* ORDER DRAWER */}
      {showOrderDrawer && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowOrderDrawer(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85dvh] flex flex-col">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-bold">Your Order</h2>
              <button type="button" onClick={() => setShowOrderDrawer(false)}>
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* SENT TO KITCHEN (read-only, no +/-) */}
              {placedItems.length > 0 && (
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-bold mb-2">Sent to kitchen</h3>
                  {placedItems.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {i.Item_Name} × {i.Quantity}
                      </span>
                      <span>₹{Number(i.Amount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total so far</span>
                    <span>₹{placedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* NEW CART (editable) */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold">New items</h3>

                {cartItems.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    Add items from the menu to place another order.
                  </p>
                )}

                {cartItems.map((item) => (
                  <div
                    key={item.Item_Id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{item.Item_Name}</p>
                      <p className="text-sm text-gray-500">
                        ₹{item.Item_Price} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCart(item.Item_Id, -1)}
                        className="w-7 h-7 bg-gray-100 rounded"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCart(item.Item_Id, 1)}
                        className="w-7 h-7 bg-red-500 text-white rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="border-t p-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>New items total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>

              <button
                type="button"
                disabled={isPlacingOrder || cartItems.length === 0}
                onClick={handlePlaceOrder}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}