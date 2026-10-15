
import { foodItemApi, useGetAllFoodItemsQuery } from "../../redux/api/foodItemApi";
// import { useGetAllTablesQuery } from "../../redux/api/tableApi";


import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFieldArray, useForm } from "react-hook-form";



import { useRef } from "react";
import { useEffect } from "react";





import { Minus, Plus, ShoppingCart } from "lucide-react";





import {
  orderApi, useCheckItemElligibleForKOTPrintMutation,

  useGenerateSmsForTakeawayMutation, useGetAllCustomersQuery,
  useGetNextTakeawayInvoiceIdQuery,
  useTakeawayAddOrdersAndGenerateInvoicesMutation
} from "../../redux/api/Staff/orderApi";

import { useMemo } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { kitchenStaffApi } from "../../redux/api/KitchenStaff/kitchenStaffApi";
import { useGetAllCategoriesQuery } from "../../redux/api/itemApi"
import { io } from "socket.io-client";
import { useGetAllCouponsQuery } from "../../redux/api/couponApi";
import {
  checkCleanterReady,
  printViaCleanter,
  isMobileDevice,
  PAPER_WIDTH,
} from "../../utils/cleanter";

export default function OrdersTakeAway() {
  

  const TAX_RATES = {
    "None": 0,
    "GST0": 0,
    "GST0.25": 0.25,
    "GST3": 3,
    "GST5": 5,
    "GST12": 12,
    "GST18": 18,
    "GST28": 28,
    "GST40": 40,

    "IGST0": 0,
    "IGST0.25": 0.25,
    "IGST3": 3,
    "IGST5": 5,
    "IGST12": 12,
    "IGST18": 18,
    "IGST28": 28,
    "IGST40": 40,
  };
  const isSubmittingRef = useRef(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  //const categoryRefs = useRef([]); // store refs for category dropdowns
  //const itemRefs = useRef([]);     // store refs for item dropdowns
  const [showSummary, setShowSummary] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  // const [ordertakeawayModalOpen, setOrdertakeawayModalOpen] = useState(false);
  const { data: categories } = useGetAllCategoriesQuery()
  const { user } = useSelector((state) => state.user);
  //const existingCategories=categories?.map((category) => category.Item_Category);
  const existingCategories = [...new Set(categories?.map(c => c.Item_Category))];
  const [searchTerm, setSearchTerm] = useState('');
  const newCategories = ["All", ...existingCategories];

  const navigate = useNavigate();

  //const [categoryOpen, setCategoryOpen] = useState(false);
  // const [categorySearch, setCategorySearch] = useState("");
  const dropdownRef = useRef(null);
  
  const { data: customers } = useGetAllCustomersQuery();
  console.log(customers, "customers");
  const [customerSearch, setCustomerSearch] = useState("");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  // const[customerModal,setShowCustomerModal]=useState(false);
  //const[addParty, { isLoading }] = useAddPartyMutation();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);






  // const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  console.log(isExistingCustomer, "isExistingCustomer");


  const dispatch = useDispatch();
  const [takeawayAddOrdersAndGenerateInvoices, { isLoading: isTakeawayAddOrdersAndGenerateInvoicesLoading }
  ] = useTakeawayAddOrdersAndGenerateInvoicesMutation();

  const [generateSmsForTakeaway, { isLoading: isGenerateSmsLoading }] =
    useGenerateSmsForTakeawayMutation();
  const [activeCategory, setActiveCategory] = useState('All');
  const lastCategoryRef = useRef(activeCategory);
  // const { data: tables, isLoading } = useGetAllTablesQuery({});
  //const { data: menuItems, isLoading: isMenuItemsLoading, refetch: refetchMenuItems, isFetching } = useGetAllFoodItemsQuery({});
  const { data: menuItems, isLoading: isMenuItemsLoading, refetch: refetchMenuItems, isFetching } = useGetAllFoodItemsQuery({orderType: "TAKEAWAY"});
  const items = menuItems?.foodItems
  //console.log(tables, isLoading, "tables", menuItems, isMenuItemsLoading);
  // const[customerModal,setShowCustomerModal]=useState(false);
  const [elligibleForKotPrint] = useCheckItemElligibleForKOTPrintMutation();
  const lastUpdatedItemRef = useRef(null);
  const { data: nextTakeawayInvoiceNumber } = useGetNextTakeawayInvoiceIdQuery();
  const nextTakeawayInvoiceId = nextTakeawayInvoiceNumber?.next_takeaway_invoice_id;
  //console.log(nextTakeawayInvoiceId,"nextTakeawayInvoiceId",nextTakeawayInvoiceNumber);
  const { data: coupon } = useGetAllCouponsQuery();
 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setCustomerDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  const {

    control,
    handleSubmit,
    setValue,
    watch,
    register,
    reset,

    formState: { errors },
  } = useForm({
    defaultValues: {
      //   Tax_Type: "None",
      //   Tax_Amount: "0.00",
      Customer_Name: "",
      Customer_Phone: "",
      Amount: "0.00",
      Sub_Total: "0.00",
      Coupon_Code: "",
      Coupon_Discount_Type: "",
      Coupon_Discount_Value: "",
      items: []   // No pre-created empty row
    }


  });


  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });




  const formValues = watch();





  const [cart, setCart] = useState({});


  const updateCart = (itemId, delta, _index, itemName, itemPrice) => {
    const price = Number(itemPrice);
    if (!price || price <= 0) return;

    // 🔥 MARK RECENT ONLY WHEN ADDING
    if (delta > 0) {
      lastUpdatedItemRef.current = itemId;
    }

    setCart((prev) => {
      const currentQty = Number(prev[itemId] || 0);
      const newQty = currentQty + delta;
      let rowIndex = itemRowMap.current[itemId];

      /* ---------------- REMOVE ITEM ---------------- */
      if (newQty <= 0) {
        if (rowIndex !== undefined) {
          remove(rowIndex);

          // rebuild mapping
          const newMap = {};
          watch("items")?.filter(Boolean).forEach((it, idx) => {
            newMap[it.id] = idx;
          });
          itemRowMap.current = newMap;
        }

        const updated = { ...prev };
        delete updated[itemId];

        setTimeout(updateTotals, 0);
        return updated;
      }

      /* ---------------- ADD / UPDATE ---------------- */
      if (rowIndex === undefined) {
        rowIndex = fields.length;
        itemRowMap.current[itemId] = rowIndex;

        append({
          id: itemId,
          Item_Name: itemName,
          Item_Price: price,
          Item_Quantity: newQty,
          Amount: (price * newQty).toFixed(2),
        });
      } else {
        setValue(`items.${rowIndex}.Item_Quantity`, newQty);
        setValue(
          `items.${rowIndex}.Amount`,
          (price * newQty).toFixed(2)
        );
      }

      setTimeout(updateTotals, 0);
      return { ...prev, [itemId]: newQty };
    });
  };



  const filteredItems = useMemo(() => {
    if (!items) return [];

    const term = searchTerm.trim().toLowerCase();
    const categoryChanged = lastCategoryRef.current !== activeCategory;

    const filtered = items.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        item.Item_Category === activeCategory;

      // 🔥 Ignore search when category JUST changed
      const matchesSearch = categoryChanged
        ? true
        : !term || item.Item_Name?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    // update category ref AFTER filtering
    //lastCategoryRef.current = activeCategory;
    return filtered;
    // return [...filtered].sort((a, b) => {
    //   const aId = a.id;
    //   const bId = b.id;

    //   const aInCart = cart[aId] ? 1 : 0;
    //   const bInCart = cart[bId] ? 1 : 0;

    //   // 🔥 MOST RECENT ITEM ALWAYS ON TOP
    //   if (aId === lastUpdatedItemRef.current) return -1;
    //   if (bId === lastUpdatedItemRef.current) return 1;

    //   // 🔥 CART ITEMS ABOVE NON-CART ITEMS
    //   if (aInCart !== bInCart) return bInCart - aInCart;

    //   return 0;
    // });
  }, [items, activeCategory, searchTerm, cart]);
  useEffect(() => {
    if (
      activeCategory !== "All" &&
      filteredItems.length === 0
    ) {
      setTimeout(() => {
        setActiveCategory("All");
      }, 1000);
      // setActiveCategory("All");
    }
  }, [filteredItems, activeCategory]);

  console.log(filteredItems, "filteredItems");
  // const filteredItems = useMemo(() => {
  //   if (!items) return [];

  //   const term = searchTerm.trim().toLowerCase();

  //   if (!term) return items; // 🔥 show all when search empty

  //   return items.filter(item =>
  //     item.Item_Name?.toLowerCase().includes(term)
  //   );
  // }, [items, searchTerm]);

  const itemRowMap = useRef({});
 

  const updateTotals = () => {
  const itemsValues = watch("items") || [];

  let subTotal = 0;

  itemsValues.forEach((item) => {
    const price = parseFloat(item.Item_Price) || 0;
    const qty = parseInt(item.Item_Quantity) || 0;

    subTotal += price * qty;
  });

  setValue("Sub_Total", subTotal.toFixed(2));

  // -----------------------------
  // MANUAL DISCOUNT
  // -----------------------------
  const discountType = watch("Discount_Type");

  const discountValue = Number(
    watch("Discount") || 0
  );

  let manualDiscount = 0;

  if (discountType === "percentage") {
    manualDiscount =
      (subTotal * discountValue) / 100;
  } else {
    manualDiscount = discountValue;
  }

  // -----------------------------
  // COUPON DISCOUNT
  // -----------------------------
  let couponDiscount = 0;

  if (selectedCoupon) {
    if (selectedCoupon.discount_type === "PERCENT") {
      couponDiscount =
        (subTotal *
          parseFloat(selectedCoupon.discount_value)) /
        100;
    } else {
      couponDiscount = parseFloat(
        selectedCoupon.discount_value
      );
    }
  }

  // -----------------------------
  // TOTAL DISCOUNT
  // -----------------------------
  let totalDiscount =
    manualDiscount + couponDiscount;

  // safety
  if (totalDiscount > subTotal) {
    totalDiscount = subTotal;
  }

  // -----------------------------
  // FINAL AMOUNT
  // -----------------------------
  const finalAmount =
    subTotal - totalDiscount;

  setValue("Amount", finalAmount.toFixed(2));
};

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const summaryItems = watch("items") || []


  useEffect(() => {
     const socket = io("http://192.168.0.111:4000", {
  transports: ["websocket"],
});

    const refreshFoodItems = (data) => {
      console.log("📢 Food item changed:", data);
      dispatch(
        foodItemApi.util.invalidateTags([{ type: "Food-Item", id: "LIST" }]),
      );
    };

    socket.on("food_item_availability_changed", refreshFoodItems);
    socket.on("food_item_deleted", refreshFoodItems);

    return () => {
      socket.off("food_item_availability_changed", refreshFoodItems);
      socket.off("food_item_deleted", refreshFoodItems);
      socket.disconnect();
    };
  }, [dispatch]);
  
  console.log(summaryItems, "summaryItems");
  
  // const finalAmount = Number((subTotal - discountAmount).toFixed(2));
  const subTotal = Number(watch("Sub_Total") || 0);

const discountType = watch("Discount_Type");

const discountValue = Number(watch("Discount") || 0);

// -----------------------------
// MANUAL DISCOUNT
// -----------------------------
let manualDiscount = 0;

if (discountType === "percentage") {
  manualDiscount =
    (subTotal * discountValue) / 100;
} else {
  manualDiscount = discountValue;
}

// -----------------------------
// COUPON DISCOUNT
// -----------------------------
let couponDiscount = 0;

if (selectedCoupon) {
  if (selectedCoupon.discount_type === "PERCENT") {
    couponDiscount =
      (subTotal *
        Number(selectedCoupon.discount_value)) /
      100;
  } else {
    couponDiscount = Number(
      selectedCoupon.discount_value
    );
  }
}

// -----------------------------
// TOTAL DISCOUNT
// -----------------------------
let totalDiscount =manualDiscount + couponDiscount;

// safety
if (totalDiscount > subTotal) {
  totalDiscount = subTotal;
}

// round
totalDiscount = Number(
  totalDiscount.toFixed(2)
);

// -----------------------------
// FINAL AMOUNT
// -----------------------------
const finalAmount = Number(
  (subTotal - totalDiscount).toFixed(2)
);

  // const discountType = watch("Discount_Type", "amount");

  // console.log("updateCart", cart);
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);

  const handleApplyCoupon = (couponItem) => {
  const subTotal = parseFloat(watch("Sub_Total")) || 0;

  // REMOVE coupon if same clicked again
  if (selectedCoupon?.id === couponItem.id) {
    setSelectedCoupon(null);

    setValue("Coupon_Id", null);
    setValue("Coupon_Code", null);
    setValue("Coupon_Discount_Type", null);
    setValue("Coupon_Discount_Value", null);

    // restore original amount
    setValue("Amount", subTotal.toFixed(2));

    return;
  }

  // APPLY NEW coupon
  setSelectedCoupon(couponItem);

  let discountAmount = 0;

  if (couponItem.discount_type === "PERCENT") {
    discountAmount =
      (subTotal * parseFloat(couponItem.discount_value)) / 100;
  } else {
    discountAmount = parseFloat(couponItem.discount_value);
  }

  const finalAmount = subTotal - discountAmount;

  setValue("Coupon_Id", couponItem.id);

  setValue("Coupon_Code", couponItem.code);

  setValue(
    "Coupon_Discount_Type",
    couponItem.discount_type === "PERCENT"
      ? "percentage"
      : "amount"
  );

  setValue(
    "Coupon_Discount_Value",
    couponItem.discount_value
  );

  setValue("Amount", finalAmount.toFixed(2));
};
  
  const resetOrderForm = () => {
    remove();                 
    reset({
      Customer_Name: "",
      Customer_Phone: "",
      Discount: "0",
      Discount_Type: "percentage",
      Payment_Type: "Cash",
      Sub_Total: "0.00",
      Amount: "0.00",
      items: [],
      
    });

    setCart({});               // clear cart
    itemRowMap.current = {};   // clear map
    lastUpdatedItemRef.current = null;
    setShowSummary(false);
    setSelectedCoupon(null);
  };
  const resetCustomerUI = () => {
    setCustomerSearch("");        // 🔥 clears phone input
    setIsExistingCustomer(false);
    setCustomerDropdownOpen(false);
    setSelectedCoupon(null);
  };
  const handleGenerateInvoice = async (data) => {
    if (!data.items || data.items.length === 0) {
      toast.error("Please add at least one item before saving.");
      return;
    }
    if (isSubmittingRef.current) return;

    const cleanedItems = data.items.filter(
      (it) => it.Item_Name && it.Item_Name.trim() !== "",
    );

    for (const item of cleanedItems) {
      if (!item.Item_Quantity || Number(item.Item_Quantity) <= 0) {
        toast.error(
          `Quantity for "${item.Item_Name}" must be greater than zero`,
        );
        return;
      }
    }

    isSubmittingRef.current = true;

    try {
      // 1. On phones, check Cleanter BEFORE creating the order
      const useCleanter = isMobileDevice();

      if (useCleanter) {
        try {
          await checkCleanterReady();
        } catch (error) {
          toast.error(`${error.message} No order was submitted.`, {
            autoClose: 10000,
          });
          return;
        }
      }

      // 2. Create the order
      const payload = {
        userId: user?.User_Id,
        items: cleanedItems,
        Sub_Total: data.Sub_Total,
        Final_Amount: data.Amount,
        Customer_Name: data.Customer_Name,
        Customer_Phone: data.Customer_Phone,
        Discount: data.Discount,
        Discount_Type: data.Discount_Type,
        Payment_Type: data.Payment_Type,
        Coupon_Id: selectedCoupon?.id,
        Coupon_Code: selectedCoupon?.code,
        Coupon_Discount_Type: selectedCoupon?.discount_type,
        Coupon_Discount_Value: selectedCoupon?.discount_value,
      };

      const response =
        await takeawayAddOrdersAndGenerateInvoices(payload).unwrap();
      const { invoice, items } = response;

      // 3. Print (its own try/catch, because the order is already saved)
      if (useCleanter) {
        try {
          await printInvoiceViaCleanter(invoice, { items });
          toast.success("Takeaway Order Added & Invoice Printed!");
        } catch (printError) {
          toast.error(
            `Order saved, but printing failed (${printError.message}). Do not submit the order again.`,
          );
        }
      } else {
        printInvoiceWindow(invoice, { items }); // PC: browser print dialog
        toast.success("Takeaway Order Added & Invoice Printed!");
      }

      // 4. Reset
      resetOrderForm();
      resetCustomerUI();
      dispatch(kitchenStaffApi.util.invalidateTags(["Kitchen-Staff"]));
      dispatch(orderApi.util.invalidateTags(["Order"]));
      dispatch(foodItemApi.util.invalidateTags(["Daily-Food-Item-Stock"]));
      refetchMenuItems();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to submit order.");
    } finally {
      isSubmittingRef.current = false;
    }
  };
  // const handleGenerateInvoice = async (data) => {
  //   if (!data.items || data.items.length === 0) {
  //     toast.error("Please add at least one item before saving.");
  //     return;
  //   }
  //   if (isSubmittingRef.current) return; //  block multiple clicks

  //   isSubmittingRef.current = true;
  //   const cleanedItems = data.items.filter(
  //     (it) => it.Item_Name && it.Item_Name.trim() !== ""
  //   );

  //   for (const item of cleanedItems) {
  //     if (!item.Item_Quantity || Number(item.Item_Quantity) <= 0) {
  //       toast.error(`Quantity for "${item.Item_Name}" must be greater than zero`);
  //       return;
  //     }
  //   }

  //   try {
  //     const payload = {
  //       userId: user?.User_Id,
  //       items: cleanedItems,
  //       Sub_Total: data.Sub_Total,
  //       Final_Amount: data.Amount,
  //       Customer_Name: data.Customer_Name,
  //       Customer_Phone: data.Customer_Phone,
  //       Discount: data.Discount,
  //       Discount_Type: data.Discount_Type,
  //       Payment_Type: data.Payment_Type,
  //        Coupon_Id: selectedCoupon?.id,

  //       Coupon_Code: selectedCoupon?.code,

  //       Coupon_Discount_Type:selectedCoupon?.discount_type,

  //       Coupon_Discount_Value:selectedCoupon?.discount_value
  //     };

  //     const response = await takeawayAddOrdersAndGenerateInvoices(payload).unwrap();

  //     const { invoice, items } = response;
  //     console.log(response, "response");
  //     //  PRINT
  //     printInvoiceWindow(invoice, { items });

  //     toast.success("Takeaway Order Added & Invoice Printed!");

  //     //  RESET EVERYTHING (IMPORTANT)
  //     resetOrderForm();
  //     resetCustomerUI();

  //     // optional
  //     setShowSummary(false);

  //     dispatch(kitchenStaffApi.util.invalidateTags(["Kitchen-Staff"]));
  //     dispatch(orderApi.util.invalidateTags(["Order"]));
  //     dispatch(foodItemApi.util.invalidateTags(["Daily-Food-Item-Stock"]));
  //     refetchMenuItems();
  //     isSubmittingRef.current = false;
  //     //  NO NAVIGATE
  //     // stay on same page with blank form

  //   } catch (err) {
  //     console.error(err);
  //     toast.error(err?.data?.message || "Failed to submit order.");

  //   } finally {
  //     isSubmittingRef.current = false; // reset flag
  //   }
  // };

  //const isSharingRef = useRef(false);
  const handleShareSMS = async (data) => {
    //if (isSharingRef.current) return; // 🚫 block multiple clicks

    //isSharingRef.current = true;
    try {
      const payload = {
        userId: user?.User_Id,
        items: data?.items,
        Sub_Total: data?.Sub_Total,
        // Amount: data?.Sub_Total,
        Final_Amount: data?.Amount,
        Customer_Name: data.Customer_Name,
        Customer_Phone: data.Customer_Phone,
        Discount: data.Discount,
        Discount_Type: data.Discount_Type,
        Payment_Type: data.Payment_Type,
        Coupon_Id: selectedCoupon?.id,

        Coupon_Code: selectedCoupon?.code,

        Coupon_Discount_Type:selectedCoupon?.discount_type,

        Coupon_Discount_Value:selectedCoupon?.discount_value
        // Customer_Name: invoiceDetails?.Customer_Name,
        // Customer_Phone: invoiceDetails?.Customer_Phone,
        // Discount_Type: invoiceDetails?.Discount_Type,
        // Discount: invoiceDetails?.Discount,
        // Service_Charge: invoiceDetails?.Service_Charge,
        // Payment_Type: invoiceDetails?.Payment_Type,
        // Final_Amount: invoiceDetails?.Final_Amount,
      };
      console.log(payload, "payload");

      const response = await generateSmsForTakeaway({

        payload,
      }).unwrap();

      toast.success("📩 Bill sent via SMS successfully");
      console.log(response, "response");
      //    if (response?.success === true) {
      //   toast.success("📩 Bill sent via SMS successfully");
      // }
      resetOrderForm();
      resetCustomerUI();
      dispatch(kitchenStaffApi.util.invalidateTags(["Kitchen-Staff"]));
      //isSharingRef.current = false; // reset flag

      // navigate("/staff/orders/all-orders");
    } catch (err) {
      console.error(err);
      toast.warning(
        "⚠️ SMS request processed.it may take time.",
        { autoClose: 5000 }
      );
      // toast.error(err?.data?.message || "Failed to send SMS");
    }
  };
//   const printInvoiceWindow = (invoiceDetails, data) => {
//     const getCurrentDate = () =>
//       new Date().toLocaleDateString("en-GB");

//     const getCurrentTime = () =>
//       new Date().toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });
//     const total = invoiceDetails?.Final_Amount ?? 0;


//     const html = `<!DOCTYPE html>
// <html>
// <head>
//   <title>Invoice - ${invoiceDetails?.Invoice_Number ?? ""}</title>
//   <meta charset="UTF-8">
//   <style>
//     * {
//       margin: 0;
//       padding: 0;
//       box-sizing: border-box;
//     }

//     body {
//       font-family: 'Courier New', Courier, monospace;
//       font-size: 11px;
//       line-height: 1.3;
//       font-weight: 700;
//       color: #000;
//       width: 58mm;
//       margin: 0;
//       padding: 0;
//       -webkit-print-color-adjust: exact;
//       print-color-adjust: exact;
//     }

//     /* 🔥 SAFE PRINTABLE WIDTH */
//     .invoice {
//       width: 46mm;
//       margin: 0 auto;
//       padding: 1mm;
//     }
//        .invoice-kitchen {
//       width: 46mm;
//       margin: 0 auto;
//       padding: 1mm;
//       margin-top: 10px;
//     }


//     .header-center,
//     .header-middle {
//       text-align: center;
//       margin-bottom: 6px;
//       border-bottom: 1px dashed #000;
//       padding-bottom: 6px;
//     }

//     .brand {
//       font-size: 15px;
//       font-weight: 800;
//       letter-spacing: 1px;
//     }

//     .line {
//       border-top: 1px dashed #000;
//       margin: 5px 0;
//     }

//     .line-solid {
//       border-top: 1px solid #000;
//       margin: 5px 0;
//     }

//    .info-row.date-time {
//   display: flex;
//   justify-content: space-between;
//   font-size: 9px;
//   font-weight: 700;
//   width: 100%;
// }

// .info-row.date-time span {
//   white-space: nowrap;   /* 🔥 prevents wrapping */
// }

//     .info-label {
//       font-weight: 800;
//     }

//     /* ITEMS */
//     .items-header,
//     .item-row {
//       display: flex;
//       justify-content: space-between;
//       font-size: 10px;
//       width: 100%;
//     }

//     .items-header {
//       border-bottom: 1px solid #000;
//       padding-bottom: 3px;
//       font-weight: 800;
//     }

//     .item-row {
//       border-bottom: 1px dashed #ccc;
//       padding: 2px 0;
//     }

//     .col-no {
//       width: 5mm;
//     }

//     .item-name {
//       flex: 1;
//       padding-right: 1mm;
//       word-break: break-word;
//     }

//     .item-qty {
//       width: 5mm;
//       text-align: center;
//     }

//     .item-amount {
//       width: 8mm;
//       text-align: right;
//     }

//     /* SUMMARY */
//     .summary {
//       margin-top: 6px;
//       font-size: 11px;
//       width: 100%;
//     }

//     .summary-row {
//       display: flex;
//       justify-content: space-between;
//       margin: 2px 0;
//     }

//     .summary-row.total {
//       font-size: 13px;
//       font-weight: 900;
//       border-top: 1px solid #000;
//       border-bottom: 2px solid #000;
//       padding: 4px 0;
//       margin-top: 4px;
//     }

//     .footer {
//       text-align: center;
//       margin-top: 8px;
//       padding-top: 6px;
//       border-top: 1px dashed #000;
//       font-size: 10px;
//       font-weight: 700;
//     }

//     @media print {
//       @page {
//         size: 58mm auto;
//         margin: 0;
//       }
//         .no-print {
//               display: none !important;
//             }
//     }
//   </style>
// </head>

// <body>
//   <div class="invoice">

//     <div class="header-center">
//       <div class="brand" style="font-weight:900;">HELLO GUYS</div>
//       <div>Ph: +91 9903106989</div>
 
//       <div style="font-size:9px">
//         Address:Shakuntala Park, Kolkata 700061
//       </div>
     
//     </div>

//     ${invoiceDetails?.Customer_Name ? `
//     <div class="info-row">
//       <span class="info-label">Customer:</span>
//       <span>${invoiceDetails.Customer_Name}</span>
//     </div>` : ``}

//     ${invoiceDetails?.Customer_Phone ? `
//     <div class="info-row">
//       <span class="info-label">Phone:</span>
//       <span>${invoiceDetails.Customer_Phone}</span>
//     </div>` : ``}

//     <div class="line"></div>

//     <div class="header-middle"><b>TAKEAWAY</b></div>

//  <div class="info-row date-time">
//   <span><b>Date:</b> ${getCurrentDate()}</span>
//   <span><b>Time:</b> ${getCurrentTime()}</span>
// </div>


//     <div class="info-row">
//       <span><b>Invoice:</b> ${invoiceDetails?.Invoice_Number ?? "-"}</span>
//     </div>

//     <div class="line-solid"></div>

//     <div class="items-header">
//       <div class="col-no">No</div>
//       <div class="item-name">ITEM</div>
//       <div class="item-qty">QTY</div>
//       <div class="item-amount">AMT</div>
//     </div>

//     ${(data?.items || []).map((it, i) => `
//       <div class="item-row">
//         <div class="col-no">${i + 1}</div>
//         <div class="item-name">${it.Item_Name}</div>
//         <div class="item-qty">${it.Item_Quantity}</div>
//         <div class="item-amount">₹${Number(it.Amount).toFixed(2)}</div>
//       </div>
//     `).join("")}

//     <div class="line-solid"></div>

//     <div class="summary">
//       <div class="summary-row">
//         <span>Subtotal</span>
//         <span>₹${Number(invoiceDetails?.Sub_Total).toFixed(2)}</span>
//       </div>

//       ${invoiceDetails?.Discount ? `
//       <div class="summary-row">
//         <span>Discount</span>
//         <span>
//           ${invoiceDetails.Discount_Type === "percentage"
//           ? invoiceDetails.Discount + "%"
//           : "₹" + invoiceDetails.Discount}
//         </span>
//       </div>` : ``}
//       ${invoiceDetails?.Coupon_Code ? `
//       <div class="summary-row">
//         <span>Coupon Discount</span>
//         <span>
//           ${invoiceDetails.Coupon_Discount_Type === "PERCENT"
//           ? invoiceDetails.Coupon_Discount_Value + "%"
//           : "₹" + invoiceDetails.Coupon_Discount_Value}
//         </span>
//       </div>` : ``}

//       <div class="summary-row total">
//         <span>TOTAL</span>
//         <span>₹${Number(total).toFixed(2)}</span>
//       </div>
//     </div>

//     <div class="footer">
//       <b>THANK YOU!</b><br>
//       Please Visit Again
//     </div>
//   </div> <!-- end of .invoice -->

//   <!-- ================= KITCHEN COPY ================= -->
  
  

//   </div>
// </body>
// </html>
// `

//     // 🔥 CREATE HIDDEN IFRAME
//     // const iframe = document.createElement("iframe");
//     // iframe.style.position = "fixed";
//     // iframe.style.right = "0";
//     // iframe.style.bottom = "0";
//     // iframe.style.width = "0";
//     // iframe.style.height = "0";
//     // iframe.style.border = "0";

//     // document.body.appendChild(iframe);

//     // const doc = iframe.contentWindow.document;
//     // doc.open();
//     // doc.write(html);
//     // doc.close();

//     // // ✅ THIS WAS MISSING
//     // iframe.onload = () => {
//     //   iframe.contentWindow.focus();
//     //   iframe.contentWindow.print();
//     // };

//     // // 🧹 CLEANUP AFTER PRINT
//     // setTimeout(() => {
//     //   document.body.removeChild(iframe);
//     // }, 1000);
//     //  const iframe = document.createElement("iframe");
//     // iframe.style.position = "fixed";
//     // iframe.style.right = "0";
//     // iframe.style.bottom = "0";
//     // iframe.style.width = "0";
//     // iframe.style.height = "0";
//     // iframe.style.border = "0";

//     // document.body.appendChild(iframe);

//     // const doc = iframe.contentWindow.document;
//     // doc.open();
//     // doc.write(html);
//     // doc.close();

//     // // ✅ THIS WAS MISSING
//     // iframe.onload = () => {
//     //   iframe.contentWindow.focus();
//     //   iframe.contentWindow.print();
//     // };

//     // // 🧹 CLEANUP AFTER PRINT
//     // setTimeout(() => {
//     //   document.body.removeChild(iframe);
//     // }, 1000);
//     const iframe = document.createElement("iframe");
//     iframe.style.display = "none";
//     document.body.appendChild(iframe);

//     iframe.contentDocument.open();
//     iframe.contentDocument.write(html);
//     iframe.contentDocument.close();

//     iframe.onload = () => {
//       iframe.contentWindow.print();
//     };

//     setTimeout(() => document.body.removeChild(iframe), 1000);
//     // const isAndroid = /Android/i.test(navigator.userAgent);
//     //   const isWindows = /Windows/i.test(navigator.userAgent);

//     //   /* ================= ANDROID (RawBT Bluetooth) ================= */
//     //   if (isAndroid) {
//     //     const encoded = encodeURIComponent(html);
//     //     window.location.href = `rawbt://print?text=${encoded}`;
//     //     return;
//     //   }

//     //   /* ================= WINDOWS (USB Printer) ================= */
//     //   if (isWindows) {
//     //     const iframe = document.createElement("iframe");
//     //     iframe.style.display = "none";
//     //     document.body.appendChild(iframe);

//     //     iframe.contentDocument.open();
//     //     iframe.contentDocument.write(html);
//     //     iframe.contentDocument.close();

//     //     iframe.onload = () => {
//     //       iframe.contentWindow.print();
//     //     };

//     //     setTimeout(() => document.body.removeChild(iframe), 1000);
//     //     return;
//     //   }
//     // const w = window.open("", "_blank", "width=320,height=600");
//     // const w = window.open("", "_blank");
//     //   if (!w) {
//     //     alert("Please allow pop-ups to print the invoice.");
//     //     return;
//     //   }

//     //   w.document.write(html);
//     //   w.document.write(`
//     //   <button onclick="window.print()" 
//     //     style="position:fixed;top:10px;right:10px;padding:8px 12px;
//     //            background:#ff0000;color:white;border:none;border-radius:4px;
//     //            font-size:14px;cursor:pointer;z-index:9999;">
//     //       Print
//     //   </button>
//     // `);
//     // const w = window.open("", "_blank");
//     //   if (!w) {
//     //     alert("Please allow pop-ups to print the invoice.");
//     //     return;
//     //   }

//     //   w.document.write(html);
//     //   w.document.write(`
//     //   <button onclick="window.print()" 
//     //     class="no-print"
//     //     style="position:fixed;top:10px;right:10px;padding:8px 12px;
//     //            background:#ff0000;color:white;border:none;border-radius:4px;
//     //            font-size:14px;cursor:pointer;z-index:9999;">
//     //       Print
//     //   </button>
//     // `);
//     //w.document.close();

//   };
   const printInvoiceWindow = (invoiceDetails, data) => {
      const escapeHTML = (value) =>
        String(value ?? "").replace(
          /[&<>"']/g,
          (char) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[char],
        );
  
      const getCurrentDate = () => new Date().toLocaleDateString("en-GB");
  
      const getCurrentTime = () =>
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
  
      const itemsHTML = (data?.items || [])
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}. ${escapeHTML(item?.Item_Name)}</td>
              <td class="center">${Number(item?.Item_Quantity || 0)}</td>
              <td class="right">₹${Number(item?.Amount || 0).toFixed(2)}</td>
            </tr>
          `,
        )
        .join("");
  
      const discountHTML = invoiceDetails?.Discount
        ? `<div class="row">
             <span>Discount</span>
             <span>${
               invoiceDetails.Discount_Type === "percentage"
                 ? `${escapeHTML(invoiceDetails.Discount)}%`
                 : `₹${escapeHTML(invoiceDetails.Discount)}`
             }</span>
           </div>`
        : "";
  
      const couponHTML = invoiceDetails?.Coupon_Code
        ? `<div class="row">
             <span>Coupon (${escapeHTML(invoiceDetails.Coupon_Code)})</span>
             <span>${
               invoiceDetails.Coupon_Discount_Type === "PERCENT"
                 ? `${escapeHTML(invoiceDetails.Coupon_Discount_Value)}%`
                 : `₹${escapeHTML(invoiceDetails.Coupon_Discount_Value)}`
             }</span>
           </div>`
        : "";
  
      const html = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Takeaway Invoice</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { box-sizing: border-box; }
            body {
              width: ${PAPER_WIDTH}mm;
              margin: 0 auto;
              font-family: "Courier New", monospace;
              font-size: 11px;
              font-weight: bold;
              color: #000;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .brand { font-size: 16px; font-weight: bold; }
            .line {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 4px;
              margin: 4px 0;
            }
            .row span:first-child { overflow-wrap: anywhere; }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            th, td { padding: 4px 1px; }
            th { border-bottom: 1px solid #000; }
            .total { font-size: 13px; }
            @media print {
              body { width: ${PAPER_WIDTH}mm; }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="brand">HELLO GUYS</div>
            <div>Ph: +91 9903106989</div>
            <div>Shakuntala Park, Kolkata 700061</div>
          </div>
  
          <div class="line"></div>
          <div class="center">TAKEAWAY</div>
          <div class="row">
            <span>Date: ${getCurrentDate()}</span>
            <span>${getCurrentTime()}</span>
          </div>
          <div class="row">
            <span>Invoice:</span>
            <span>${escapeHTML(invoiceDetails?.Invoice_Number ?? "-")}</span>
          </div>
  
          ${
            invoiceDetails?.Customer_Name
              ? `<div class="row"><span>Customer:</span><span>${escapeHTML(invoiceDetails.Customer_Name)}</span></div>`
              : ""
          }
          ${
            invoiceDetails?.Customer_Phone
              ? `<div class="row"><span>Phone:</span><span>${escapeHTML(invoiceDetails.Customer_Phone)}</span></div>`
              : ""
          }
  
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left">ITEM</th>
                <th>QTY</th>
                <th style="text-align:right">AMT</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
  
          <div class="line"></div>
          <div class="row">
            <span>Subtotal</span>
            <span>₹${Number(invoiceDetails?.Sub_Total || 0).toFixed(2)}</span>
          </div>
          ${discountHTML}
          ${couponHTML}
          <div class="line"></div>
          <div class="row total">
            <span>TOTAL</span>
            <span>₹${Number(invoiceDetails?.Final_Amount || 0).toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <div class="center">THANK YOU!</div>
          <div class="center">Please Visit Again</div>
        </body>
        </html>`;
  
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.width = "1px";
      printFrame.style.height = "1px";
      printFrame.style.left = "-10000px";
      printFrame.style.bottom = "0";
      printFrame.style.border = "0";
  
      document.body.appendChild(printFrame);
  
      const frameWindow = printFrame.contentWindow;
      const frameDocument = frameWindow.document;
  
      let printStarted = false;
  
      const cleanup = () => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      };
  
      frameWindow.onafterprint = () => {
        setTimeout(cleanup, 500);
      };
  
      frameDocument.open();
      frameDocument.write(html);
      frameDocument.close();
  
      const startPrint = () => {
        if (printStarted) return;
        printStarted = true;
  
        frameWindow.focus();
        frameWindow.print();
  
        // Fallback cleanup in case afterprint does not fire.
        setTimeout(cleanup, 60000);
      };
  
      setTimeout(startPrint, 300);
    };
  
  useEffect(() => {
    setValue("Amount", finalAmount.toFixed(2));
  }, [finalAmount, setValue]);
//cleanter connection for printing through website

  const printInvoiceViaCleanter = async (invoiceDetails, data) => {
    try {
      const getCurrentDate = () => new Date().toLocaleDateString("en-GB");

      const getCurrentTime = () =>
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

      const content = [];

      // ==========================================
      // HEADER
      // ==========================================

      content.push({
        type: "text",
        text: "HELLO GUYS",
        align: "center",
        bold: true,
        size: "large",
      });

      content.push({
        type: "text",
        text: "Ph: +91 9903106989",
        align: "center",
      });

      content.push({
        type: "text",
        text: "Address: Shakuntala Park, Kolkata 700061",
        align: "center",
      });

      content.push({
        type: "divider",
      });

      // ==========================================
      // CUSTOMER
      // ==========================================

      if (invoiceDetails?.Customer_Name) {
        content.push({
          type: "row",
          left: "Customer:",
          right: invoiceDetails.Customer_Name,
        });
      }

      if (invoiceDetails?.Customer_Phone) {
        content.push({
          type: "row",
          left: "Phone:",
          right: invoiceDetails.Customer_Phone,
        });
      }

      content.push({
        type: "divider",
      });

      // ==========================================
      // ORDER TYPE
      // ==========================================

      content.push({
        type: "text",
        text: "TAKEAWAY",
        align: "center",
        bold: true,
      });

      content.push({
        type: "row",
        left: `Date: ${getCurrentDate()}`,
        right: getCurrentTime(),
      });

      content.push({
        type: "row",
        left: "Invoice:",
        right: invoiceDetails?.Invoice_Number ?? "-",
      });

      content.push({
        type: "divider",
      });

      // ==========================================
      // ITEMS HEADER
      // ==========================================

      content.push({
        type: "row",
        left: "ITEM / QTY",
        right: "AMT",
        bold: true,
      });

      // ==========================================
      // ITEMS
      // ==========================================

      (data?.items || []).forEach((item) => {
        const itemName = item?.Item_Name || "";
        const quantity = Number(item?.Item_Quantity || 0);
        const amount = Number(item?.Amount || 0).toFixed(2);

        content.push({
          type: "row",
          left: `${itemName} x${quantity}`,
          right: `Rs.${amount}`,
        });
      });

      content.push({
        type: "divider",
      });

      // ==========================================
      // SUMMARY
      // ==========================================

      content.push({
        type: "row",
        left: "Subtotal",
        right: `Rs.${Number(invoiceDetails?.Sub_Total || 0).toFixed(2)}`,
      });

      // ==========================================
      // MANUAL DISCOUNT
      // ==========================================

      if (invoiceDetails?.Discount) {
        content.push({
          type: "row",
          left: "Discount",
          right:
            invoiceDetails.Discount_Type === "percentage"
              ? `${invoiceDetails.Discount}%`
              : `Rs.${invoiceDetails.Discount}`,
        });
      }

      // ==========================================
      // COUPON DISCOUNT
      // ==========================================

      if (invoiceDetails?.Coupon_Code) {
        content.push({
          type: "row",
          left: "Coupon Discount",
          right:
            invoiceDetails.Coupon_Discount_Type === "PERCENT"
              ? `${invoiceDetails.Coupon_Discount_Value}%`
              : `Rs.${invoiceDetails.Coupon_Discount_Value}`,
        });
      }

      // ==========================================
      // TOTAL
      // ==========================================

      content.push({
        type: "divider",
      });

      content.push({
        type: "row",
        left: "TOTAL",
        right: `Rs.${Number(invoiceDetails?.Final_Amount || 0).toFixed(2)}`,
        bold: true,
      });

      // ==========================================
      // FOOTER
      // ==========================================

      content.push({
        type: "divider",
      });

      content.push({
        type: "text",
        text: "THANK YOU!",
        align: "center",
        bold: true,
      });

      content.push({
        type: "text",
        text: "Please Visit Again",
        align: "center",
      });

      content.push({
        type: "feed",
        lines: 3,
      });

      // ==========================================
      // SEND TO CLEANter
      // ==========================================

      await printViaCleanter(content);
    } catch (error) {
      console.error("Cleanter invoice print error:", error);
      throw error;
    }
  };
  //PRINT KOT using Cleanter
    const printKOTViaCleanter = async (kitchens) => {
      try {
        const getCurrentDate = () => new Date().toLocaleDateString("en-GB");
  
        const getCurrentTime = () =>
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
  
        const content = [];
  
        Object.entries(kitchens).forEach(([kitchenName, items], kitchenIndex) => {
          // Divider between kitchens
          if (kitchenIndex > 0) {
            content.push({
              type: "divider",
            });
          }
  
          // =========================
          // HEADER
          // =========================
  
          content.push({
            type: "text",
            text: "TAKEAWAY",
            align: "center",
            bold: true,
          });
  
          content.push({
            type: "text",
            text: kitchenName,
            align: "center",
            bold: true,
            size: "large",
          });
  
          content.push({
            type: "divider",
          });
  
          // =========================
          // DATE / TIME
          // =========================
  
          content.push({
            type: "row",
            left: `Date: ${getCurrentDate()}`,
            right: getCurrentTime(),
          });
  
          content.push({
            type: "divider",
          });
  
          // =========================
          // ITEMS HEADER
          // =========================
  
          content.push({
            type: "row",
            left: "NO.  ITEM",
            right: "QTY",
            bold: true,
          });
  
          // =========================
          // ITEMS
          // =========================
  
          items.forEach((item, index) => {
            content.push({
              type: "row",
              left: `${index + 1}. ${item?.Item_Name || ""}`,
              right: `${item?.Item_Quantity || 0}`,
            });
          });
        });
  
        // Extra paper before cutting
        content.push({
          type: "feed",
          lines: 3,
        });
  
        // =========================
        // SEND TO CLEANter
        // =========================
  
        await printViaCleanter(content);
  
        toast.success("KOT printed successfully!");
      } catch (error) {
        console.error("Cleanter KOT print error:", error);
  
        toast.error(`Could not print KOT: ${error.message}`);
  
        throw error;
      }
    };
  
  const printKOTInvoice = (kitchens) => {
    const getCurrentDate = () =>
      new Date().toLocaleDateString("en-GB");

    const getCurrentTime = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    //const kotId = generateReadableKOTId();
    const kitchenSections = Object.entries(kitchens)
      .map(([kitchenName, items], index) => `
      ${index > 0 ? `<div class="line"></div>` : ``}

      <div class="invoice-kitchen">
        <div class="header-center">
        <div class="brand">TAKEAWAY</div>
        
      
            <div class="brand">${kitchenName}</div>
        
        </div>

        <div class="info-row date-time">
          <span><b>Date:</b> ${getCurrentDate()}</span>
          <span><b>Time:</b> ${getCurrentTime()}</span>
        </div>

        <div class="line-solid"></div>

        <div class="items-header">
          <div class="col-no">No</div>
          <div class="item-name">ITEM</div>
          <div class="item-qty">QTY</div>
        </div>

        ${items.map((it, i) => `
          <div class="item-row">
            <div class="col-no">${i + 1}</div>
            <div class="item-name">${it.Item_Name}</div>
            <div class="item-qty">${it.Item_Quantity}</div>
          </div>
        `).join("")}
      </div>
    `)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: 'Courier New', monospace;
    font-size: 16px;
    font-weight: 700;
    width: 58mm;
    margin: 0;
  }
  .invoice { width: 48mm; padding: 2mm; }
  .invoice-kitchen { margin-top: 8px; }
  .header-center {
    text-align: center;
    border-bottom: 1px dashed #000;
    margin-bottom: 6px;
    padding-bottom: 6px;
  }
  .brand { font-size: 20px; font-weight: 800; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .line-solid { border-top: 1px solid #000; margin: 5px 0; }
  .items-header, .item-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
  }
  .items-header { border-bottom: 1px solid #000; font-weight: 800; gap: 4px; padding-bottom: 4px; }
  .col-no { width: 5mm; }
  .item-name { flex: 1; }
  .item-qty { width: 6mm; text-align: center; }
  .info-row.date-time {
    display: flex;
    
    justify-content: space-between;
    font-size: 12px;
  }
  
  @page { size: 48mm auto; margin: 0; }
            /* PRINT STYLES */
          @media print {
            body {
              width: 58mm;
              margin: 0;
              padding: 0;
            }
            
            .invoice {
              width: 58mm;
              padding: 8px;
            }
            
            @page {
              size: 58mm auto;
              margin: 0;
            }
            
            .no-print {
              display: none !important;
            }
          }
</style>
</head>
 <div  style="font-size:20px; margin-top:10px;margin-left:10px",white-space:nowrap>
 Invoice:${nextTakeawayInvoiceId}</div>
 <div class="invoice">
    
    ${kitchenSections}
  </div>
  
</body>
</html>`;

    // const win = window.open(
    //   "",
    //   "_blank",
    //   `width=${screen.width},height=${screen.height},left=0,top=0`
    // );
    // const win = window.open(
    //   "",
    //   "_blank",
    //   "width=800,height=600,left=0,top=0"
    // );
    // if (!win) return;

    // win.document.open();
    // win.document.write(html);
    // win.document.close();

    // win.onload = () => {
    //   setTimeout(() => {
    //     win.focus();
    //     win.print();
    //     win.close();
    //   }, 300);
    // };
    // const isAndroid = /Android/i.test(navigator.userAgent);
    //   const isWindows = /Windows/i.test(navigator.userAgent);

    //   /* ================= ANDROID (RawBT Bluetooth) ================= */
    //   if (isAndroid) {
    //     const encoded = encodeURIComponent(html);
    //     window.location.href = `rawbt://print?text=${encoded}`;
    //     return;
    //   }

    //   /* ================= WINDOWS (USB Printer) ================= */
    //   if (isWindows) {
    //     const iframe = document.createElement("iframe");
    //     iframe.style.display = "none";
    //     document.body.appendChild(iframe);

    //     iframe.contentDocument.open();
    //     iframe.contentDocument.write(html);
    //     iframe.contentDocument.close();

    //     iframe.onload = () => {
    //       iframe.contentWindow.print();
    //     };

    //     setTimeout(() => document.body.removeChild(iframe), 1000);
    //     return;
    //   }

    // const iframe = document.createElement("iframe");
    // iframe.style.display = "none";
    // document.body.appendChild(iframe);

    // iframe.contentDocument.open();
    // iframe.contentDocument.write(html);
    // iframe.contentDocument.close();

    // iframe.onload = () => {
    //   iframe.contentWindow.print();
    // };

    // setTimeout(() => document.body.removeChild(iframe), 1000);

    // const w = window.open("", "_blank");
    //   if (!w) {
    //     alert("Please allow pop-ups to print the invoice.");
    //     return;
    //   }

    //   w.document.write(html);
    //   w.document.write(`
    //   <button onclick="window.print()" 
    //     class="no-print"
    //     style="position:fixed;top:10px;right:10px;padding:8px 12px;
    //            background:#ff0000;color:white;border:none;border-radius:4px;
    //            font-size:14px;cursor:pointer;z-index:9999;">
    //       Print
    //   </button>
    // `);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();


    setTimeout(() => document.body.removeChild(iframe), 1000);
    //   w.document.write(`
    //   <button onclick="window.print()" 
    //     style="position:fixed;top:10px;right:10px;padding:8px 12px;
    //            background:#ff0000;color:white;border:none;border-radius:4px;
    //            font-size:14px;cursor:pointer;z-index:9999;">
    //       Print
    //   </button>
    // `);
    //w.document.close();

    // // ✅ OPEN NEW TAB
    // const win = window.open(
    //   "",
    //   "_blank",
    //   "width=400,height=600,left=0,top=0"
    // );

    // if (!win) {
    //   alert("Popup blocked! Please allow popups for printing.");
    //   return;
    // }

    // win.document.open();
    // win.document.write(html);
    // win.document.close();
  };

  const handlePrintKOT = async () => {
     if (!summaryItems || summaryItems.length === 0) {
       toast.error("Please add at least one item before printing KOT.");
       return;
     }
 
     const cleanedItems = summaryItems.filter(
       (it) => it.Item_Name && it.Item_Name.trim() !== "",
     );
 
     for (const item of cleanedItems) {
       if (!item.Item_Quantity || Number(item.Item_Quantity) <= 0) {
         toast.error(
           `Quantity for "${item.Item_Name}" must be greater than zero`,
         );
         return;
       }
     }
 
     let response;
     try {
       response = await elligibleForKotPrint(cleanedItems).unwrap();
       console.log("KOT eligible response:", response);
     } catch (err) {
       console.error(err);
       toast.error("Failed to check KOT eligibility");
       return;
     }
 
     if (
       response.success &&
       response?.elligibleItems &&
       Object.keys(response.elligibleItems).length > 0
     ) {
       if (isMobileDevice()) {
         try {
           await printKOTViaCleanter(response.elligibleItems);
         } catch {
           // the error toast was already shown inside printKOTViaCleanter
         }
       } else {
         printKOTInvoice(response.elligibleItems); // PC: browser print dialog
       }
     }
   };

  // const customerName = watch("Customer_Name");
  // const customerPhone = watch("Customer_Phone");
  const watchedCustomerName = watch("Customer_Name");
  return (
    <>


      <div className="sb2-2-2">
        <ul>
          <li>
            {/* <NavLink to="/">
                                 <i className="fa fa-home mr-2" aria-hidden="true"></i>
                                 Dashboard
                             </NavLink> */}
            {/* <NavLink style={{ display: "flex", flexDirection: "row" }}
              to="/home"

            >
              <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
          
              Dashboard
            </NavLink> */}
          </li>

        </ul>
      </div>

      {/* Main Content */}
      <div style={{ marginTop: "40px" }} className="sb2-2-3" >
        <div className="row" style={{ margin: "0px" }}>
          <div className="col-md-12">
            <div style={{ padding: "20px", marginBottom: "20px" }}
              className="box-inn-sp">

              <div className="inn-title w-full px-2 py-3">

                <div className="flex
                                  flex-col mt-10 sm:flex-row justify-between 
                                  items-start sm:items-center
                                  w-full sm:mt-0">

                  {/* LEFT HEADER */}
                  <div className="w-full flex justify-center items-center sm:w-auto">
                    <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Add Order Takeaway</h4>
                    {/* <p className="text-gray-500 mb-2 sm:mb-4">
         Add new sale details
       </p> */}
                  </div>

                  {/* RIGHT BUTTON SECTION */}
                  <div className="
       w-full flex justify-center items-center sm:w-auto 
       flex flex-wrap sm:flex-nowrap 
        sm:justify-end 
       gap-3
     ">
                    {/* <button
                      type="button"
                      onClick={() => navigate("/staff/orders/all-orders")}
                      className="text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "black" }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/staff/orders/all-orders")}
                      className="text-white py-2 px-4 rounded"
                      style={{ backgroundColor: "#ff0000" }}
                    >
                      All Orders
                    </button> */}

                    <button
                      type="button"
                      onClick={() => navigate("/order/all-orders")}
                      className="text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "black" }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/order/all-orders")}
                      className="text-white py-2 px-4 rounded"
                      style={{ backgroundColor: "#ff0000" }}
                    >
                      All Orders
                    </button>
                  </div>
                </div>
                {/* <input type="hidden" {...register("Customer_Phone", { required: true })} />
<input type="hidden" {...register("Customer_Name")} />
<input type="hidden" {...register("Customer_Address")} />
<input type="hidden" {...register("Customer_Date")} /> */}

                <div style={{ backgroundColor: "#f1f1f19d" }}
                  className="
  grid
  grid-rows-1 grid-cols-1
  md:grid-rows-1 md:grid-cols-3
  p-2 mt-2 gap-6 w-full heading-wrapper
">

                  <div style={{ marginTop: "0px" }}
                    className="row flex gap-2">

                    <div style={{ marginTop: "0px" }} className="input-field col s6 relative">
                      <span className="active">
                        Customer Phone
                      </span>

                      <input
                        ref={inputRef}
                        type="number"
                        id="Customer_Phone"
                        placeholder="Search by phone"
                        value={customerSearch}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);

                          setCustomerSearch(val);

                          setValue("Customer_Phone", val, { shouldValidate: true });

                          // typing ≠ existing selection
                          setIsExistingCustomer(false);
                          setCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                        className="w-full outline-none border-b-2 text-gray-900"
                      />


                      {customerDropdownOpen && (

                        <div
                          ref={dropdownRef}
                          className="
        absolute z-50 mt-1 w-full
        bg-white border border-gray-300 rounded-md shadow-lg
        max-h-48 overflow-y-auto
      "
                        >
                          {customers
                            ?.filter(
                              (c) =>
                                c.Customer_Phone.includes(customerSearch) ||
                                c.Customer_Name?.toLowerCase().includes(customerSearch.toLowerCase())
                            )
                            .map((c, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setCustomerSearch(c.Customer_Phone);

                                  setValue("Customer_Phone", c.Customer_Phone, {
                                    shouldValidate: true,
                                  });

                                  setValue(
                                    "Customer_Name",
                                    c.Customer_Name || null,
                                    { shouldValidate: true }
                                  );
                                  setValue("Customer_Address", c.Customer_Address, {
                                    shouldValidate: true,
                                  });
                                  setValue("Customer_Date", c.Special_Date, {
                                    shouldValidate: true,
                                  });


                                  setIsExistingCustomer(true);
                                  setCustomerDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                <span className="font-medium">
                                  {c.Customer_Name ?? ""}
                                </span>{" "}
                                <span className="text-gray-500">
                                  ({c.Customer_Phone})
                                </span>
                              </div>
                            ))}

                          {customers?.length === 0 && (
                            <p className="px-3 py-2 text-gray-500">No customers found</p>
                          )}
                        </div>
                      )}

                      {errors?.Customer_Phone && (
                        <p className="text-red-500 text-xs mt-1">
                          Phone number is required
                        </p>
                      )}
                    </div>

                    <div style={{ marginTop: "0px" }} className="input-field col s6 ">
                      <span className="active">Customer Name</span>

                      <input
                        type="text"
                        id="Customer_Name"
                        placeholder="Customer Name"
                        value={watchedCustomerName || ""}
                        readOnly={isExistingCustomer}
                        className="w-full outline-none border-b-2 text-gray-900"
                        onChange={(e) => {
                          setValue("Customer_Name", e.target.value || null, {
                            shouldValidate: true,
                          });
                        }}
                      />

                      {errors?.Customer_Name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.Customer_Name.message}
                        </p>
                      )}
                    </div>




                  </div>
                  <div className="invisible sm:visible"></div>


                  {/* <div className="sm:visible"></div> */}
                  <div className="w-full ">
                    <input
                      type="text"
                      placeholder="Search ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

              </div>
              <div style={{ padding: "0", backgroundColor: "#f1f1f19d" }} className="tab-inn">
                {/* <form onSubmit={handleSubmit(onSubmit)}> */}
                <form >



                  {/* ══════════════════════════════════════════════════════════
          MOBILE FAB BUTTONS — visible only on small screens
          Category drawer trigger (left) + Order summary (right)
      ══════════════════════════════════════════════════════════ */}
                  <div className="flex lg:hidden fixed bottom-4 left-0 right-0 z-40
       justify-between px-4 pointer-events-none">

                    {/* Category FAB */}
                    <button
                      type="button"
                      onClick={() => setShowCategoryDrawer(true)}
                      className="pointer-events-auto flex items-center gap-1 bg-white border border-gray-200 text-[#ff0000] font-bold px-4 py-2 rounded-full shadow-lg text-sm"
                    >
                      ☰ Categories
                    </button>

                    {/* Order FAB */}
                    <button
                      type="button"
                      onClick={() => setShowOrderDrawer(true)}
                      className="pointer-events-auto relative flex items-center gap-1 text-white font-bold px-4 py-2 rounded-full shadow-lg text-sm"
                      style={{ backgroundColor: "#ff0000" }}
                    >
                      🧾 Order
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-[#ff0000] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
                          {totalItems}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* ══════════════════════════════════════════════════════════
          MOBILE — Category Side Drawer (slides from left)
      ══════════════════════════════════════════════════════════ */}
                  {showCategoryDrawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex ">
                      {/* Backdrop */}
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowCategoryDrawer(false)}
                      />
                      {/* Drawer */}
                       <div className="relative w-64 bg-white h-[calc(100%-6rem)] mt-24 flex flex-col shadow-2xl z-10">
                      {/* <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl z-10"> */}
                        <div className="px-4 py-3 bg-[#ff0000] flex justify-between items-center">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide">Categories</h4>
                          <button type="button"
                            onClick={() => setShowCategoryDrawer(false)} className="text-white text-xl font-bold">✖</button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                          {newCategories.map((cat, index) => (
                            <button
                              type="button"
                              key={index}
                              onClick={() => { setActiveCategory(cat); setShowCategoryDrawer(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat
                                ? "bg-[#ff0000] text-white shadow-sm"
                                : "bg-gray-50 hover:bg-red-50 text-gray-700 border border-gray-100"
                                }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════════
          MOBILE — Order Summary Bottom Drawer (slides from bottom)
      ══════════════════════════════════════════════════════════ */}
                  {showOrderDrawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end  overflow-y-auto ">
                      {/* Backdrop */}
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowOrderDrawer(false)}
                      />
                      {/* Drawer */}
                      <div className="relative bg-white rounded-t-2xl shadow-2xl z-10 flex flex-col" style={{ maxHeight: "80vh" }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                          <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="px-4 py-3 bg-[#ff0000] flex justify-between items-center">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide">Order Summary</h4>
                          <div className="flex items-center gap-3">
                            <span className="relative">
                              <ShoppingCart size={20} className="text-white" />
                              {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-[#ff0000] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                  {totalItems}
                                </span>
                              )}
                            </span>
                            <button type="button" onClick={() => setShowOrderDrawer(false)} className="text-white text-xl font-bold">✖</button>
                          </div>
                        </div>
                        {/* Scrollable items */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                          {summaryItems && summaryItems.length > 0 ? (
                            summaryItems.map((item, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-sm text-gray-800 flex-1 pr-2">{item?.Item_Name}</span>
                                  <span className="text-xs bg-red-100 text-[#ff0000] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">x {item?.Item_Quantity}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Amount</span>
                                  <span className="font-semibold text-gray-700">₹{item?.Amount}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#4CA1AF10] rounded-md p-1.5">
                                  <button
                                    type="button"
                                    disabled={Number(cart[item.id] || 0) === 0}
                                    onClick={() => updateCart(item.id, -1, index, item.Item_Name, item.Item_Price)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-md shadow transition ${Number(cart[item.id] || 0) === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-[#ff0000]"}`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-base font-semibold text-gray-800 px-2">
                                    {cart[item.id] || 0}</span>
                                  <button
                                    style={{ backgroundColor: "#ff0000" }}
                                    type="button"
                                    // disabled={unavailable}
                                    onClick={() => updateCart(item.id, 1, index,
                                      item.Item_Name, item.Item_Price)}
                                    className={`w-7 h-7 flex items-center 
                            justify-center rounded-md shadow transition
                             ${Number(cart[item.id] || 0) === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#ff0000] text-white hover:bg-[#3a8c98]"}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                              <ShoppingCart size={32} className="mb-2 opacity-30" />
                              <p className="text-sm">No items added yet</p>
                            </div>
                          )}
                        </div>
                        {/* Footer */}
                        <div className="border-t px-4 py-3 space-y-2 bg-white">
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 sm:col-span-2 ">
                              {/* Label */}
                              <span className="text-sm font-medium whitespace-nowrap">
                                Discount
                              </span>

                              {/* Input */}
                              <input
                                type="text"
                                placeholder={discountType === "percentage" ? "0 %" : "0.00"}
                                className="w-24 border-b-2 outline-none text-gray-900 text-sm"
                                {...register("Discount")}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/[^0-9.]/g, "");

                                  // allow only one dot
                                  const parts = val.split(".");
                                  if (parts.length > 2) {
                                    val = parts[0] + "." + parts.slice(1).join("");
                                  }

                                  // limit decimals
                                  if (val.includes(".")) {
                                    const [int, dec] = val.split(".");
                                    val = int + "." + dec.slice(0, 2);
                                  }

                                  // percentage cap
                                  if (discountType === "percentage" && Number(val) > 100) {
                                    val = "100";
                                  }

                                  setValue("Discount", val, { shouldValidate: true });
                                }}
                              />

                              {/* Type */}
                              <select
                                className="w-24 border rounded-md px-1 py-1 text-sm"
                                {...register("Discount_Type")}
                                defaultValue="percentage"
                                onChange={(e) => {
                                  setValue("Discount_Type", e.target.value);
                                  setValue("Discount", "0.00");
                                }}
                              >
                                <option value="amount">Amt</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>
                            {/* <div className="flex justify-between items-center text-base font-bold text-gray-900">
                              <span style={{ color: "green" }}>Coupon</span>

                            </div>
                            <div className="flex flex-wrap gap-2">
                            {coupon?.data?.filter(item => item.is_active === 1)?.map(item => {
                              const isSelected = selectedCoupon?.id === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleApplyCoupon(item)}
                                  type="button"
                                  className={`
                                    w-[48%] px-2 py-1 rounded-lg text-sm font-semibold border
                                    transition-all duration-200 shadow-sm flex items-center gap-1
                                    ${isSelected
                                      ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                      : "text-green-900 bg-green-100 border-green-300 hover:bg-green-200"
                                    }
        `}
                                >
                                  {isSelected && <span className="font-bold text-white">✓</span>}
                                  {item.code} •{" "}
                                  {item.discount_type === "PERCENT"
                                    ? `${item.discount_value}% OFF`
                                    : `₹${item.discount_value} OFF`}
                                </button>
                              );
                            })}
                          </div>

                        
                          {selectedCoupon && (
                            <div className="mt-3">
                              <p className="text-xs text-black mb-1">Applied coupon</p>
                              <span
                                onClick={() => handleApplyCoupon(selectedCoupon)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer
                 bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 transition-all"
                              >
                                {selectedCoupon.code} •{" "}
                                {selectedCoupon.discount_type === "PERCENT"
                                  ? `${selectedCoupon.discount_value}% OFF`
                                  : `₹${selectedCoupon.discount_value} OFF`}
                                <span className="text-red-400  text-lg font-bold leading-none ml-1">×</span>
                              </span>
                            </div>
                          )} */}
                          {coupon?.data?.some(item => item.is_active === 1) && (
  <>
    <div className="flex justify-between items-center text-base font-bold text-gray-900">
      <span style={{ color: "green" }}>Coupon</span>
    </div>

    <div className="flex flex-wrap gap-2">
      {coupon?.data
        ?.filter(item => item.is_active === 1)
        ?.map(item => {
          const isSelected = selectedCoupon?.id === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleApplyCoupon(item)}
              type="button"
              className={`
                w-[48%] px-2 py-1 rounded-lg text-sm font-semibold border
                transition-all duration-200 shadow-sm flex items-center gap-1
                ${
                  isSelected
                    ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                    : "text-green-900 bg-green-100 border-green-300 hover:bg-green-200"
                }
              `}
            >
              {isSelected && <span className="font-bold text-white">✓</span>}

              {item.code} •{" "}
              {item.discount_type === "PERCENT"
                ? `${item.discount_value}% OFF`
                : `₹${item.discount_value} OFF`}
            </button>
          );
        })}
    </div>

    {selectedCoupon && (
      <div className="mt-3">
        <p className="text-xs text-black mb-1">Applied coupon</p>

        <span
          onClick={() => handleApplyCoupon(selectedCoupon)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer
            bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 transition-all"
        >
          {selectedCoupon.code} •{" "}
          {selectedCoupon.discount_type === "PERCENT"
            ? `${selectedCoupon.discount_value}% OFF`
            : `₹${selectedCoupon.discount_value} OFF`}

          <span className="text-red-400 text-lg font-bold leading-none ml-1">
            ×
          </span>
        </span>
      </div>
    )}
  </>
)}

                          <div className="flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-[#ff0000] text-lg">₹{watch("Amount")}</span>
                          </div>
                            <div
                              className="flex items-center gap-3 sm:col-span-2 ">
                              <span className="text-sm font-medium whitespace-nowrap">Payment Type</span>
                              {/* <span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}
                              <select
                                id="Payment Mode"
                                {...register("Payment_Type")}

                                // onChange={(e)=>setInvoiceDetails({...invoiceDetails,
                                //   Payment_Type: e.target.value
                                // })}

                                // value={invoiceDetails?.Payment_Type}
                                className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2"
                              >


                                <option value="Cash">Cash</option>

                                <option value="Online">Online</option>
                                <option value="Online">Upi</option>


                              </select>


                            </div>
                            <div className="flex gap-2 ">
                              {/* <button
                            type="button"
                            onClick={() => setShowSummary(true)}
                            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 rounded-lg text-white font-bold shadow transition hover:opacity-90"
                            style={{ backgroundColor: "black" }}
                          >
                            <span className="relative">
                              <ShoppingCart size={20} className="text-white" />
                              {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-[#ff0000] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                  {totalItems}
                                </span>
                              )}
                            </span>
                            View
                            
                          </button> */}

                            </div>
                            <div className=" flex flex-col gap-2 ">

                              <button
                                type="button"
                                onClick={() => handlePrintKOT()}
                                className="relative w-full py-2 px-4 md:w-auto 
                                                      flex items-center justify-center gap-3 
                                                      sm:whitespace-nowrap
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                                style={{ backgroundColor: "#ffa600" }}
                              >
                                Print KOT
                              </button>
                              <button
                                type="button"
                                onClick={handleSubmit(handleGenerateInvoice)}
                                disabled={
                                  isTakeawayAddOrdersAndGenerateInvoicesLoading || isSubmittingRef.current
                                }
                                className="relative w-full py-2 px-4 md:w-auto 
                                                      flex items-center justify-center gap-3 
                                                      sm:whitespace-nowrap
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                                style={{ backgroundColor: "#ff0000" }}
                              >
                                {/* Print Bill */}
                                {isTakeawayAddOrdersAndGenerateInvoicesLoading ? "Printing..." : "Print Bill"}
                              </button>



                              <button
                                type="button"
                                onClick={handleSubmit(handleShareSMS)}
                                disabled={isGenerateSmsLoading}
                                className="relative w-full py-2 px-4 md:w-auto 
                                                      flex items-center justify-center gap-3 
                                                      
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                                style={{ backgroundColor: "#ff0000" }}
                              >
                                {isGenerateSmsLoading ? "Sharing..." : "Share"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════════
          DESKTOP — 3-column layout (sm and above)
      ══════════════════════════════════════════════════════════ */}
                  <div className="hidden lg:flex h-[calc(100vh-120px)] 
      overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50">

                    {/* LEFT — Categories */}
                    <aside className="w-[180px] lg:w-[200px] flex-shrink-0 bg-white 
                    shadow-md flex flex-col overflow-y-auto border-r">
                      <div className="px-3 py-3 border-b bg-[#ff0000]">
                        <h4 className="text-white font-bold text-sm tracking-wide uppercase">Categories</h4>
                      </div>
                      <div className="flex flex-col overflow-y-auto flex-1 py-2 gap-1 px-2">
                        {newCategories.map((cat, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setActiveCategory(cat)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat
                              ? "bg-[#ff0000] text-white shadow-sm"
                              : "bg-gray-50 hover:bg-red-50 text-gray-700 border border-gray-100"
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </aside>

                    {/* MIDDLE — Items grid */}
                    <main className="flex-1 overflow-y-auto px-3 py-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(isMenuItemsLoading || isFetching) ? (
                          [...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                              <div className="h-32 bg-gray-200" />
                              <div className="p-2 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                <div className="h-8 bg-gray-200 rounded" />
                              </div>
                            </div>
                          ))
                        ) : filteredItems && filteredItems.length > 0 ? (
                          filteredItems?.map((item, index) => {
                            const unavailable = item.is_available === 0;
                            return (
                              <div

                                key={item.id ?? index}
                                className={`group relative 
                      bg-white rounded-xl overflow-hidden shadow-md 
                      transition-all duration-300 ${unavailable ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                                  }
                              ${summaryItems?.some(it => it.Item_Name === item.Item_Name)
                                    ? "border-2 border-green-500"
                                    : ""
                                  }
                    `
                                }
                                onClick={() => {
                                  if (unavailable) return; // 🚫 STOP HERE
                                  updateCart(item.id, 1, index, item.Item_Name, item.Item_Price);
                                }}
                              //onClick={()=> updateCart(item.id, 1, index, item.Item_Name, item.Item_Price)}
                              >
                                {unavailable && (
                                  <div className="absolute top-2 left-2 bg-red-600 
                      text-white text-[10px] px-2 py-1 rounded shadow">
                                    Unavailable
                                  </div>
                                )}
                                <div className="relative h-32 bg-gradient-to-br from-[#4CA1AF22] to-[#4CA1AF44]">
                                  {item?.Item_Image && (
                                    <img loading="lazy" src={`http://192.168.0.111:4000/uploads/food-item/${item.Item_Image}`} alt={item?.Item_Name} className="w-full h-full object-cover opacity-90" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                  <div className="absolute top-2 right-2">
                                    <span className="bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#ff0000] shadow">{item.Item_Category}</span>
                                  </div>
                                </div>
                                <div className="p-2">
                                  <div className="flex mb-2">
                                    <h5 style={{ color: "red" }} className="text-[20px] leading-tight">{item?.Item_Name}</h5>
                                  </div>
                                  <div className="flex justify-between items-center mb-2">
                                    <div>
                                      <div className="text-base font-semibold text-gray-800">₹{Number(item?.Item_Price || 0).toFixed(2)}</div>
                                      <div className="text-[10px] text-gray-500">Tax: {TAX_RATES[item?.Tax_Type]}%</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-[#ff0000]">₹{Number(item?.Amount || 0).toFixed(2)}</div>
                                      <div className="text-[10px] text-gray-500">Total</div>
                                    </div>
                                  </div>
                                  {/* <div className="flex items-center justify-between bg-[#4CA1AF10] rounded-md p-1.5">
                        <button
                          type="button"
                          disabled={unavailable || Number(cart[item.id] || 0) === 0}
                          onClick={() => !unavailable && 
                          updateCart(item.id, -1, index, item.Item_Name, item.Item_Price)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md shadow transition ${unavailable ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-[#ff0000]"}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-base font-semibold text-gray-800 px-2">{cart[item.id] || 0}</span>
                        <button
                          style={{ backgroundColor: "#ff0000" }}
                          type="button"
                          disabled={unavailable}
                          onClick={() => !unavailable && updateCart(item.id, 1, index, item.Item_Name, item.Item_Price)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md shadow transition ${unavailable ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#ff0000] text-white hover:bg-[#3a8c98]"}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div> */}
                                  <div className="flex mt-2 items-center gap-2">
                                    <span style={{ color: "#ff0000" }} className="text-base font-semibold">Quantity:</span>
                                    <span className="text-[16px]">{item?.Current_Quantity}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center col-span-full">No items found</p>
                        )}
                      </div>
                    </main>

                    {/* RIGHT — Order Summary (fixed height, scrollable list) */}
                    <aside className="w-[280px] lg:w-[300px] overflow-y-auto
        flex-shrink-0 bg-white shadow-md flex flex-col border-l">
                      {/* Header */}
                      <div className="px-4 py-3 bg-[#ff0000] flex items-center justify-between flex-shrink-0">
                        <h4 className="text-white font-bold text-sm tracking-wide uppercase">Order Summary</h4>
                        <span className="relative">
                          <ShoppingCart size={20} className="text-white" />
                          {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-white text-[#ff0000] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow">
                              {totalItems}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* ✅ Scrollable item list — grows and scrolls */}
                      <div
                        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0 
         ">
                        {summaryItems && summaryItems.length > 0 ? (
                          summaryItems.map((item, index) => (
                            <div key={index} className="bg-gray-50  rounded-lg px-3 
                py-2 border border-gray-100">
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm text-gray-800 leading-tight flex-1 pr-2">{item?.Item_Name}</span>
                                <span className="text-xs bg-red-100 text-[#ff0000] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">x {item?.Item_Quantity}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Amount</span>
                                <span className="font-semibold text-gray-700">₹{item?.Amount}</span>
                              </div>
                              <div className="flex items-center justify-between bg-[#4CA1AF10] rounded-md p-1.5">
                                <button
                                  type="button"
                                  disabled={Number(cart[item.id] || 0) === 0}
                                  onClick={() => updateCart(item.id, -1, index, item.Item_Name, item.Item_Price)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-md shadow transition ${Number(cart[item.id] || 0) === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-[#ff0000]"}`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-base font-semibold text-gray-800 px-2">
                                  {cart[item.id] || 0}</span>
                                <button
                                  style={{ backgroundColor: "#ff0000" }}
                                  type="button"
                                  // disabled={unavailable}
                                  onClick={() => updateCart(item.id, 1, index,
                                    item.Item_Name, item.Item_Price)}
                                  className={`w-7 h-7 flex items-center 
                            justify-center rounded-md shadow transition
                             ${Number(cart[item.id] || 0) === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#ff0000] text-white hover:bg-[#3a8c98]"}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ShoppingCart size={36} className="mb-2 opacity-30" />
                            <p className="text-sm">No items added yet</p>
                          </div>
                        )}
                      </div>

                      {/*  Pinned footer — never scrolls away */}
                      <div className="border-t bg-white px-4 py-3 space-y-3 flex-shrink-0">

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 sm:col-span-2 ">
                            {/* Label */}
                            <span className="text-sm font-medium whitespace-nowrap">
                              Discount
                            </span>

                            {/* Input */}
                            <input
                              type="text"
                              placeholder={discountType === "percentage" ? "0 %" : "0.00"}
                              className="w-24 border-b-2 outline-none text-gray-900 text-sm"
                              {...register("Discount")}
                              onChange={(e) => {
                                let val = e.target.value.replace(/[^0-9.]/g, "");

                                // allow only one dot
                                const parts = val.split(".");
                                if (parts.length > 2) {
                                  val = parts[0] + "." + parts.slice(1).join("");
                                }

                                // limit decimals
                                if (val.includes(".")) {
                                  const [int, dec] = val.split(".");
                                  val = int + "." + dec.slice(0, 2);
                                }

                                // percentage cap
                                if (discountType === "percentage" && Number(val) > 100) {
                                  val = "100";
                                }

                                setValue("Discount", val, { shouldValidate: true });
                              }}
                            />

                            {/* Type */}
                            <select
                              className="w-24 border rounded-md px-1 py-1 text-sm"
                              {...register("Discount_Type")}
                              defaultValue="percentage"
                              onChange={(e) => {
                                setValue("Discount_Type", e.target.value);
                                setValue("Discount", "0.00");
                              }}
                            >
                              <option value="amount">Amt</option>
                              <option value="percentage">%</option>
                            </select>
                          </div>
                          {/* <div className="flex justify-between items-center text-base font-bold text-gray-900">
                            <span style={{ color: "green" }}>Coupon</span>

                          </div>
                          <div className="flex flex-wrap gap-2">
                            {coupon?.data?.filter(item => item.is_active === 1)?.map(item => {
                              const isSelected = selectedCoupon?.id === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleApplyCoupon(item)}
                                  type="button"
                                  className={`
          w-[48%] px-2 py-1 rounded-lg text-sm font-semibold border
          transition-all duration-200 shadow-sm flex items-center gap-1
          ${isSelected
                                      ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                      : "text-green-900 bg-green-100 border-green-300 hover:bg-green-200"
                                    }
        `}
                                >
                                  {isSelected && <span className="font-bold text-white">✓</span>}
                                  {item.code} •{" "}
                                  {item.discount_type === "PERCENT"
                                    ? `${item.discount_value}% OFF`
                                    : `₹${item.discount_value} OFF`}
                                </button>
                              );
                            })}
                          </div>

                         
                          {selectedCoupon && (
                            <div className="mt-3">
                              <p className="text-xs text-black mb-1">Applied coupon</p>
                              <span
                                onClick={() => handleApplyCoupon(selectedCoupon)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer
                 bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 transition-all"
                              >
                                {selectedCoupon.code} •{" "}
                                {selectedCoupon.discount_type === "PERCENT"
                                  ? `${selectedCoupon.discount_value}% OFF`
                                  : `₹${selectedCoupon.discount_value} OFF`}
                                <span className="text-red-400 font-bold text-lg leading-none ml-1">×</span>
                              </span>
                            </div>
                          )} */}
                          {coupon?.data?.filter(item => Number(item.is_active) === 1).length > 0 && (
  <>
    <div className="flex justify-between items-center text-base font-bold text-gray-900">
      <span style={{ color: "green" }}>Coupon</span>
    </div>

    <div className="flex flex-wrap gap-2">
      {coupon?.data
        ?.filter(item => Number(item.is_active) === 1)
        .map(item => {
          const isSelected = selectedCoupon?.id === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleApplyCoupon(item)}
              type="button"
              className={`
                w-[48%] px-2 py-1 rounded-lg text-sm font-semibold border
                transition-all duration-200 shadow-sm flex items-center gap-1
                ${
                  isSelected
                    ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                    : "text-green-900 bg-green-100 border-green-300 hover:bg-green-200"
                }
              `}
            >
              {isSelected && (
                <span className="font-bold text-white">✓</span>
              )}

              {item.code} •{" "}
              {item.discount_type === "PERCENT"
                ? `${item.discount_value}% OFF`
                : `₹${item.discount_value} OFF`}
            </button>
          );
        })}
    </div>

    {selectedCoupon && (
      <div className="mt-3">
        <p className="text-xs text-black mb-1">Applied coupon</p>

        <span
          onClick={() => handleApplyCoupon(selectedCoupon)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer
            bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 transition-all"
        >
          {selectedCoupon.code} •{" "}
          {selectedCoupon.discount_type === "PERCENT"
            ? `${selectedCoupon.discount_value}% OFF`
            : `₹${selectedCoupon.discount_value} OFF`}

          <span className="text-red-400 text-lg font-bold leading-none ml-1">
            ×
          </span>
        </span>
      </div>
    )}
  </>
)}

                          {/* Selected chips shown below */}
                          {/* {selectedCoupon && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span
                                onClick={() => handleApplyCoupon(selectedCoupon)}
                                className="
        inline-flex items-center gap-1 px-3 py-1 rounded-full
        text-xs font-semibold cursor-pointer
        bg-red-50 text-red-600 border border-red-300
        hover:bg-red-100 transition-all
      "
                              >
                                {selectedCoupon.code} •{" "}
                                {selectedCoupon.discount_type === "PERCENT"
                                  ? `${selectedCoupon.discount_value}% OFF`
                                  : `₹${selectedCoupon.discount_value} OFF`}

                                <span className="text-red-500 font-bold text-sm leading-none">
                                  ×
                                </span>
                              </span>
                            </div>
                          )} */}
                          <div className="flex justify-between items-center text-base font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-[#ff0000] text-lg">₹{watch("Amount")}</span>
                          </div>
                          <div
                            className="flex items-center gap-3 sm:col-span-2 ">
                            <span className="text-sm font-medium whitespace-nowrap">Payment Type</span>
                            {/* <span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}
                            <select
                              id="Payment Mode"
                              {...register("Payment_Type")}

                              // onChange={(e)=>setInvoiceDetails({...invoiceDetails,
                              //   Payment_Type: e.target.value
                              // })}

                              // value={invoiceDetails?.Payment_Type}
                              className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2"
                            >


                              <option value="Cash">Cash</option>

                              <option value="Online">Online</option>
                              <option value="Online">Upi</option>


                            </select>


                          </div>
                          <div className="flex gap-2 lg:flex-col ">
                            {/* <button
                            type="button"
                            onClick={() => setShowSummary(true)}
                            className="w-full py-2.5 px-4 flex items-center 
                            justify-center gap-2 rounded-lg text-white font-bold
                             shadow transition hover:opacity-90"
                            style={{ backgroundColor: "black" }}
                          >
                            <span className="relative">
                              <ShoppingCart size={20} className="text-white" />
                              {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-[#ff0000] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                  {totalItems}
                                </span>
                              )}
                            </span>
                            View
                            {/* <ShoppingCart size={18} /> Save &amp; Hold 
                          </button> */}

                            <button
                              type="button"
                              onClick={() => handlePrintKOT()}
                              className="relative w-full py-2 px-4 
                                                      flex items-center justify-center gap-3 
                                                      sm:whitespace-nowrap
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                              style={{ backgroundColor: "#ffa600" }}
                            >
                              Print KOT
                            </button>
                          </div>
                          <div className="flex gap-2 lg:flex-col ">
                            <button
                              type="button"
                              disabled={
                                isTakeawayAddOrdersAndGenerateInvoicesLoading || isSubmittingRef.current
                              }
                              onClick={handleSubmit(handleGenerateInvoice)}
                              className="relative w-full py-2 px-4 
                                                      flex items-center justify-center gap-3 
                                                      sm:whitespace-nowrap
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                              style={{ backgroundColor: "#ff0000" }}
                            >
                              {/* Print Bill */}
                              {isTakeawayAddOrdersAndGenerateInvoicesLoading ? "Printing..." : "Print Bill"}

                            </button>



                            <button
                              type="button"
                              onClick={handleSubmit(handleShareSMS)}
                              className="relative w-full py-2 px-4 
                                                      flex items-center justify-center gap-3 
                                                      
                                                            text-white font-bold  rounded shadow sm:py-3 px-6"
                              style={{ backgroundColor: "#ff0000" }}
                            >
                              {isGenerateSmsLoading ? "Sharing..." : "Share"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>

                  {/* ══════════════════════════════════════════════════════════
          MOBILE — Items only (full width)
      ══════════════════════════════════════════════════════════ */}
                  <div className="lg:hidden bg-gradient-to-br from-orange-50 via-white to-red-50 pb-24">
                    <div className="px-3 py-4 grid grid-cols-2 gap-3">
                      {(isMenuItemsLoading || isFetching) ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                            <div className="h-28 bg-gray-200" />
                            <div className="p-2 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                              <div className="h-8 bg-gray-200 rounded" />
                            </div>
                          </div>
                        ))
                      ) : filteredItems && filteredItems.length > 0 ? (
                        filteredItems?.map((item, index) => {
                          const unavailable = item.is_available === 0;
                          return (
                            <div
                              key={item.id ?? index}
                              className={`relative bg-white rounded-xl overflow-hidden
                     shadow-md ${unavailable ? "opacity-40 grayscale cursor-not-allowed"
                                  : "cursor-pointer"}
                       ${summaryItems?.some(it => it.Item_Name === item.Item_Name)
                                  ? "border-2 border-green-500"
                                  : ""
                                }
                       `}
                              onClick={() => {
                                if (unavailable) return; // 🚫 STOP HERE
                                updateCart(item.id, 1, index, item.Item_Name, item.Item_Price);
                              }}
                            //onClick={()=> updateCart(item.id, 1, index, item.Item_Name, item.Item_Price)}
                            >
                              {unavailable && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow z-10">
                                  Unavailable
                                </div>
                              )}
                              <div className="relative h-28 bg-gradient-to-br from-[#4CA1AF22] to-[#4CA1AF44]">
                                {item?.Item_Image && (
                                  <img loading="lazy" src={`http://192.168.0.111:4000/uploads/food-item/${item.Item_Image}`} alt={item?.Item_Name} className="w-full h-full object-cover opacity-90" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute top-1 right-1">
                                  <span className="bg-white/90 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-[#ff0000] shadow">{item.Item_Category}</span>
                                </div>
                              </div>
                              <div className="p-2">
                                <h5 style={{ color: "red" }} className="text-[15px] leading-tight mb-1 font-semibold">{item?.Item_Name}</h5>
                                <div className="flex justify-between items-center mb-1.5">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">₹{Number(item?.Item_Price || 0).toFixed(2)}</div>
                                    <div className="text-[9px] text-gray-500">Tax: {TAX_RATES[item?.Tax_Type]}%</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-[#ff0000]">₹{Number(item?.Amount || 0).toFixed(2)}</div>
                                    <div className="text-[9px] text-gray-500">Total</div>
                                  </div>
                                </div>
                                {/* <div className="flex items-center justify-between bg-[#4CA1AF10] rounded-md p-1">
                      <button
                        type="button"
                        disabled={unavailable || Number(cart[item.id] || 0) === 0}
                        onClick={() => !unavailable && updateCart(item.id, -1, index, item.Item_Name, item.Item_Price)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md shadow transition ${unavailable ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-white text-[#ff0000]"}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold text-gray-800">{cart[item.id] || 0}</span>
                      <button
                        style={{ backgroundColor: "#ff0000" }}
                        type="button"
                        disabled={unavailable}
                        onClick={() => !unavailable && updateCart(item.id, 1, index, item.Item_Name, item.Item_Price)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md shadow transition ${unavailable ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#ff0000] text-white"}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div> */}
                                <div className="flex mt-1.5 items-center gap-1">
                                  <span style={{ color: "#ff0000" }} className="text-xs font-semibold">Qty:</span>
                                  <span className="text-xs">{item.Current_Quantity}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-center col-span-full">No items found</p>
                      )}
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════
          BILL SUMMARY MODAL — unchanged logic, works on all screens
      ══════════════════════════════════════════════════════════ */}
                  {showSummary && (
                    <button type="button" onClick={() => setShowSummary(false)} className="fixed inset-0 bg-black/40 z-40" />
                  )}
                  <div className={`fixed left-0 bottom-0 w-full bg-white shadow-2xl rounded-t-2xl z-50 transform transition-transform duration-300 p-4 ${showSummary ? "translate-y-0" : "translate-y-full"}`}>
                    <div className="w-full flex justify-center py-2">
                      <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="px-4 pb-3 border-b">
                      <div className="flex justify-between items-center">
                        <div className="flex justify-center items-center mx-auto">
                          <h2 className="text-lg font-bold text-gray-700">Bill Summary</h2>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                          <button type="button" style={{ backgroundColor: "transparent", fontSize: "30px" }} className="text-gray-500 text-2xl font-bold" onClick={() => setShowSummary(false)}>✖</button>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: "55vh" }}>
                      {summaryItems?.map((item, index) => (
                        <div key={index} className="border-b pb-2 mb-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">{item?.Item_Name}</span>
                            <span>x {item?.Item_Quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Amount</span>
                            <span>₹{item?.Amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>₹{watch("Amount")}</span>
                      </div>

                    </div>
                  </div>
                </form>
                {/* {ordertakeawayModalOpen &&
                  <OrderTakeawayModal
                    onClose={() => setOrdertakeawayModalOpen(false)}
                    data={formValues}
                    setOpen={setOrdertakeawayModalOpen}
                  />} */}

              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
   /*  screens between 1000px and 640px */
   @media (max-width: 1000px) and (min-width: 641px) {
 
     /* Keep sale-wrapper horizontal but avoid tight spacing */
     .sale-wrapper{
       flex-direction: row !important;
       gap: 10px !important;
     }
 
     /* Left section slightly wider */
     .sale-left {
       width: 45% !important;
     }
 
     /* Right section slightly narrower */
     .sale-right {
       width: 55% !important;
       margin-left: 0 !important;
       margin-right: 0 !important;
     }
 
     /* Inputs must not stretch too much */
     .sale-right > div > input {
       width: 80% !important;
     }
 
     /* Select dropdowns also */
     .state-of-supply-class > select {
       width: 80% !important;
     }
 
     /* Party, Invoice, GSTIN fields */
     .party-class,
     .invoice-number-class,
     .gstin-class,
     .invoice-date-class,
     .state-of-supply-class {
       width: 100% !important;
     }
   }
 
 @media (max-width: 640px) {
 
   /* Make Party + GSTIN stack vertically */
   .heading-wrapper {
     flex-direction: column !important;
     gap: 16px !important;
     width: 100% !important;
   }
 
   /* Fix Party container */
   .party-class {
     width: 100% !important;
   }
 
   /* Make Party input full width */
   .party-class input {
     width: 100% !important;
   }
 
   /* Dropdown fix so it does NOT go off-screen */
   // .party-class .absolute {
   //   width: 100% !important;
   //   left: 0 !important;
   // }
 
   /* GSTIN block full width */
   .gstin-class {
     width: 100% !important;
     justify-content: flex-start !important;
   }
 
   /* GSTIN input also full width */
   .gstin-class input {
     width: 80% !important;
   }
   .party-class input {
     width: 80% !important;
   }
 }
 
   /* below 640px */
   @media (max-width: 640px) {
 
   .party-class{
      width: 95% !important;
   }
     .invoice-number-class,
     .gstin-class,
     .invoice-date-class,
     .state-of-supply-class {
       width: 100% !important;
     }
 
     .state-of-supply-class > select {
       width: 100% !important;
     }
 
     .sale-wrapper {
       flex-direction: column !important;
       gap: 20px !important;
     }
 
     .sale-left {
       width: 100% !important;
     }
 
     .sale-right {
       width: 100% !important;
       margin-left: 0 !important;
       margin-right: 0 !important;
     }
 
     .sale-right > div {
       width: 100% !important;
     }
 
     .sale-right > div > input {
       width: 100% !important;
     }
 
     .sale-input {
       width: 100% !important;
     }
 
     .sale-checkbox-label {
       padding-left: 30px !important;
     }
   }
 `}
      </style>
    </>
  );
}

