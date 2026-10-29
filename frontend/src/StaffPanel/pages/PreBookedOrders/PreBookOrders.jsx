



// import { foodItemApi, useGetAllFoodItemsQuery } from "../../redux/api/foodItemApi";
import { foodItemApi, useGetAllFoodItemsQuery } from "../../../redux/api/foodItemApi";
import { useGetAllTablesForPreBookingQuery } from "../../../redux/api/tableApi";


import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFieldArray, useForm } from "react-hook-form";



import { useRef } from "react";
import { useEffect } from "react";

import { toast } from "react-toastify";

import { useDispatch, useSelector } from "react-redux";

import { Minus, Plus, ShoppingCart, Table } from "lucide-react";




import { useAddPreBookOrderMutation, useGetAllCustomersQuery } from "../../../redux/api/Staff/orderApi";

import { io } from "socket.io-client";

import { useMemo } from "react";
import { useGetAllCategoriesQuery } from "../../../redux/api/itemApi";




// const socket = io("http://192.168.0.111:4000", {
//   transports: ["websocket"],
// });


export default function PreBookOrders() {
  const { userId } = useSelector((state) => state.user);
  const dispatch = useDispatch();
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
  const { data: customers } = useGetAllCustomersQuery();
  console.log(customers, "customers");
  const [customerSearch, setCustomerSearch] = useState("");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  // const[customerModal,setShowCustomerModal]=useState(false);
  //const[addParty, { isLoading }] = useAddPartyMutation();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);






  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const tableRef = useRef(null);
  console.log(isExistingCustomer, "isExistingCustomer");
  // const categoryRefs = useRef([]); // store refs for category dropdowns
  // const itemRefs = useRef([]);     // store refs for item dropdowns


  const navigate = useNavigate();
  // const { data: parties } = useGetAllPartiesQuery();

  // console.log(items, "items");

  //const [open, setOpen] = useState(false);
  //const[categoryOpen,setCategoryOpen] = useState(false);
  // const [showModal, setShowModal] = useState(false);
  //const[selected,setSelected] = useState([]);

  const [open, setOpen] = useState(false);
  // const [newCategory, setNewCategory] = useState("");
  const [showSummary, setShowSummary] = useState(false);


  const [addPreBookOrder, { isLoading: isAddPreBookOrderLoading }] = useAddPreBookOrderMutation();

  const { data: categories } = useGetAllCategoriesQuery()

  //const existingCategories=categories?.map((category) => category.Item_Category);
  const existingCategories = [...new Set(categories?.map(c => c.Item_Category))];

  const newCategories = ["All", ...existingCategories];

  // const lastUpdatedItemRef = useRef(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  //const [categorySearch, setCategorySearch] = useState("");

  const categoryOpenRef = useRef(null);
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryOpenRef.current && !categoryOpenRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [activeCategory, setActiveCategory] = useState('All');
  const lastCategoryRef = useRef(activeCategory);
  const { data: tables, isLoading } = useGetAllTablesForPreBookingQuery({});
  const [tableSearch, setTableSearch] = useState("");
  const [selectedTables, setSelectedTables] = useState([]);
  const [orderType, setOrderType] = useState("TAKEAWAY");
  //const { data: menuItems, isLoading: isMenuItemsLoading,isFetching } = useGetAllFoodItemsQuery({orderType: "DINE_IN"});;
  const { data: menuItems, isLoading: isMenuItemsLoading, isFetching } =
    useGetAllFoodItemsQuery({ orderType });
  const items = menuItems?.foodItems
  console.log(tables, isLoading, "tables", items, isMenuItemsLoading);
  // const { data: categories,  } = useGetAllCategoriesQuery()
  // console.log(categories, "categories");
  //onst existingCategories=categories?.map((category) => category.Item_Category);
  // const existingCategories = [...new Set(categories?.map(c => c.Item_Category))];
  const [searchTerm, setSearchTerm] = useState('');




  useEffect(() => {
    // Create the socket when this component mounts.
    const socket = io("http://192.168.0.111:4000", {
      transports: ["websocket"],
    });

    const handleSoftDeletedItem = (data) => {
      console.log("📢 Food status changed:", data);

      // Refetch food items through RTK Query.
      dispatch(
        foodItemApi.util.invalidateTags([
          { type: "Food-Item", id: "LIST" },
        ])
      );
    };

    socket.on("food_item_deleted", handleSoftDeletedItem);

    // Clean up when the component unmounts.
    return () => {
      socket.off("food_item_deleted", handleSoftDeletedItem);
      socket.disconnect();
    };
  }, [dispatch]);

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
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(e.target)
      ) {
        setOpen(false);

      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const {

    control,
    handleSubmit,
    setValue,
    watch,
    register,

    formState: { errors },
  } = useForm({
    defaultValues: {
      //   Tax_Type: "None",
      //   Tax_Amount: "0.00",
      Customer_Name: "",
      Customer_Phone: "",
      Customer_Address: "",
      Booking_Date: "",
      Booking_Hour: "",
      Booking_Minute: "",

      Booking_Period: "AM",

      Amount: "0.00",
      Sub_Total: "0.00",
      Advance_Payment: "0.00",
      Payment_Left: "0.00",
      items: []   // No pre-created empty row
    }


  });


  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });



  const formValues = watch();
  //const itemsValues = watch("items");   // watch all item rows
  //const totalPaid = watch("Total_Paid"); // watch Total_Paid
  //const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));


  console.log(items)
  const [cart, setCart] = useState({});



  const itemRowMap = useRef({});
  const updateTotals = () => {
    const itemsValues = watch("items") || [];

    let subTotal = 0;


    itemsValues.forEach(item => {
      const price = parseFloat(item.Item_Price) || 0;
      const qty = parseInt(item.Item_Quantity) || 0;


      subTotal += price * qty;

    });



    setValue("Sub_Total", subTotal.toFixed(2));

    setValue("Amount", subTotal.toFixed(2));
  };

  useEffect(() => {
    // Wait until the menu for the selected order type has loaded.
    if (isFetching || !items?.length) return;

    const currentItems = watch("items") || [];

    if (currentItems.length === 0) return;

    // Match existing cart rows with the newly fetched menu.
    const menuById = new Map(
      items.map((menuItem) => [
        String(menuItem.id ?? menuItem.Item_Id),
        menuItem,
      ])
    );

    let subTotal = 0;

    currentItems.forEach((orderItem, index) => {
      const menuItem = menuById.get(
        String(orderItem.id ?? orderItem.Item_Id)
      );

      const quantity = Number(orderItem.Item_Quantity) || 0;

      // Preserve the existing price if the item is absent from this menu.
      const price = menuItem
        ? Number(menuItem.Item_Price)
        : Number(orderItem.Item_Price) || 0;

      if (!Number.isFinite(price) || price < 0) return;

      const amount = price * quantity;
      subTotal += amount;

      setValue(`items.${index}.Item_Price`, price, {
        shouldDirty: true,
      });

      setValue(`items.${index}.Amount`, amount.toFixed(2), {
        shouldDirty: true,
      });
    });

    setValue("Sub_Total", subTotal.toFixed(2), {
      shouldDirty: true,
    });

    setValue("Amount", subTotal.toFixed(2), {
      shouldDirty: true,
    });
  }, [items, orderType, isFetching, setValue, watch]);


  const updateCart = (itemId, delta, _index, itemName, itemPrice) => {
    const price = Number(itemPrice);
    if (!price || price <= 0) return;

    // 🔥 MARK RECENT ONLY WHEN ADDING
    // if (delta > 0) {
    //   lastUpdatedItemRef.current = itemId;
    // }

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
    lastCategoryRef.current = activeCategory;

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
    return filtered;
  }, [items, activeCategory, searchTerm, cart]);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
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
  console.log(filteredItems, "filteredItems")

  const toMySQLTime = (hour, minute, period) => {
    let h = parseInt(hour, 10);
    let m = minute !== undefined && minute !== null && minute !== ""
      ? parseInt(minute, 10)
      : 0; // 🔥 default to 00

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  };
  const printPreBookReceipt = (invoiceDetails, bookingTimeForReceipt) => {
    //   const getCurrentDate = () =>
    //     new Date().toLocaleDateString("en-GB");

    //   const getCurrentTime = () =>
    //     new Date().toLocaleTimeString("en-US", {
    //       hour: "2-digit",
    //       minute: "2-digit",
    //       hour12: true,
    //     });
    // const total = invoiceDetails?.Final_Amount ?? 0;

    const html = `<!DOCTYPE html>
<html>
<head>
 
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
      font-weight: 700;
      color: #000;
      width: 58mm;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* 🔥 SAFE PRINTABLE WIDTH */
    .invoice {
      width: 46mm;
      margin: 0 auto;
      padding: 1mm;
    }
       .invoice-kitchen {
      width: 46mm;
      margin: 0 auto;
      padding: 1mm;
      margin-top: 10px;
    }


    .header-center,
    .header-middle {
      text-align: center;
      margin-bottom: 6px;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
    }

    .brand {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .line {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .line-solid {
      border-top: 1px solid #000;
      margin: 5px 0;
    }

   .info-row.date-time {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 700;
  width: 100%;
}

.info-row.date-time span {
  white-space: nowrap;   /* 🔥 prevents wrapping */
}

    .info-label {
      font-weight: 800;
    }

    /* ITEMS */
    .items-header,
    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      width: 100%;
    }

    .items-header {
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      font-weight: 800;
    }

    .item-row {
      border-bottom: 1px dashed #ccc;
      padding: 2px 0;
    }

    .col-no {
      width: 5mm;
    }

    .item-name {
      flex: 1;
      padding-right: 1mm;
      word-break: break-word;
    }

    .item-qty {
      width: 5mm;
      text-align: center;
    }

    .item-amount {
      width: 8mm;
      text-align: right;
    }

    /* SUMMARY */
    .summary {
      margin-top: 6px;
      font-size: 11px;
      width: 100%;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }

    .summary-row.total {
      font-size: 13px;
      font-weight: 900;
      border-top: 1px solid #000;
      border-bottom: 2px solid #000;
      padding: 4px 0;
      margin-top: 4px;
    }

    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #000;
      font-size: 10px;
      font-weight: 700;
    }

    @media print {
      @page {
        size: 58mm auto;
        margin: 0;
      }
    }
  </style>
</head>

<body>
  <div class="invoice">

    <div class="header-center">
      <div class="brand" style="font-weight:900;">HELLO GUYS</div>
      <div>Ph: +91 9903106989</div>
 
      <div style="font-size:9px">
        Address:Shakuntala Park, Kolkata 700061
      </div>
      
      <div style="font-size:9px">
        FSSAI No: 12826019000014
      </div>
     
    </div>

    ${invoiceDetails?.Customer_Name ? `
    <div class="info-row">
      <span class="info-label">Customer:</span>
      <span>${invoiceDetails.Customer_Name}</span>
    </div>` : ``}

    ${invoiceDetails?.Customer_Phone ? `
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span>${invoiceDetails.Customer_Phone}</span>
    </div>` : ``}

    <div class="line"></div>

 

  <div class="info-row date-time">
  <span><b>Booking Date:</b> ${invoiceDetails?.Booking_Date}</span>
  <span><b>Booking Time:</b> ${bookingTimeForReceipt}</span>
</div>



   

    <div class="line-solid"></div>

      ${invoiceDetails?.items?.length > 0
        ? `
    <div class="items-header">
      <div class="col-no">No</div>
      <div class="item-name">ITEM</div>
      <div class="item-qty">QTY</div>
      <div class="item-amount">AMT</div>
    </div>
    `
        : ``
      }

    ${(invoiceDetails?.items || []).map((it, i) => `
      <div class="item-row">
        <div class="col-no">${i + 1}</div>
        <div class="item-name">${it.Item_Name}</div>
        <div class="item-qty">${it.Item_Quantity}</div>
        <div class="item-amount">₹${Number(it.Amount).toFixed(2)}</div>
      </div>
    `).join("")}

    <div class="line-solid"></div>

    <div class="summary">
         ${invoiceDetails?.items?.length > 0 ? `
      <div class="summary-row">
        <span>Subtotal</span>
        <span>₹${Number(invoiceDetails?.Sub_Total).toFixed(2)}</span>
      </div> ` : ``}

        <div class="summary-row">
        <span>Advance</span>
        <span>₹${Number(invoiceDetails?.Advance_Payment).toFixed(2)}</span>
      </div>
  ${invoiceDetails?.items?.length > 0 &&
        Number(invoiceDetails?.Payment_Left) !== 0
        ? `
  <div class="summary-row">
    <span>
      ${Number(invoiceDetails.Payment_Left) < 0
          ? "Extra Paid"
          : "Payment Left"
        }
    </span>
    <span>
      ₹${Math.abs(Number(invoiceDetails.Payment_Left)).toFixed(2)}
    </span>
  </div>
`
        : ``
      }

    

    </div>

    <div class="footer">
      <b>THANK YOU!</b><br>
      Please Visit Again
    </div>
  </div> <!-- end of .invoice -->

  <!-- ================= KITCHEN COPY ================= -->
  
  

  </div>
</body>
</html>
`

    // 🔥 CREATE HIDDEN IFRAME
    // const iframe = document.createElement("iframe");
    // iframe.style.position = "fixed";
    // iframe.style.right = "0";
    // iframe.style.bottom = "0";
    // iframe.style.width = "0";
    // iframe.style.height = "0";
    // iframe.style.border = "0";

    // document.body.appendChild(iframe);

    // const doc = iframe.contentWindow.document;
    // doc.open();
    // doc.write(html);
    // doc.close();

    // // ✅ THIS WAS MISSING
    // iframe.onload = () => {
    //   iframe.contentWindow.focus();
    //   iframe.contentWindow.print();
    // };

    // // 🧹 CLEANUP AFTER PRINT
    // setTimeout(() => {
    //   document.body.removeChild(iframe);
    // }, 1000);
    //  const iframe = document.createElement("iframe");
    // iframe.style.position = "fixed";
    // iframe.style.right = "0";
    // iframe.style.bottom = "0";
    // iframe.style.width = "0";
    // iframe.style.height = "0";
    // iframe.style.border = "0";

    // document.body.appendChild(iframe);

    // const doc = iframe.contentWindow.document;
    // doc.open();
    // doc.write(html);
    // doc.close();

    // // ✅ THIS WAS MISSING
    // iframe.onload = () => {
    //   iframe.contentWindow.focus();
    //   iframe.contentWindow.print();
    // };

    // // 🧹 CLEANUP AFTER PRINT
    // setTimeout(() => {
    //   document.body.removeChild(iframe);
    // }, 1000);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    iframe.onload = () => {
      iframe.contentWindow.print();
    };

    setTimeout(() => document.body.removeChild(iframe), 1000);
    // const w = window.open("", "_blank", "width=320,height=600");
    // const w = window.open("", "_blank");
    //   if (!w) {
    //     alert("Please allow pop-ups to print the invoice.");
    //     return;
    //   }

    //   w.document.write(html);
    //   w.document.write(`
    //   <button onclick="window.print()" 
    //     style="position:fixed;top:10px;right:10px;padding:8px 12px;
    //            background:#ff0000;color:white;border:none;border-radius:4px;
    //            font-size:14px;cursor:pointer;z-index:9999;">
    //       Print
    //   </button>
    // `);
    //   w.document.close();

  };

  const onSubmit = async (data) => {
    console.log("Form Data:", data);

    /* ---------------- BOOKING VALIDATION ---------------- */
    if (!data.Booking_Date) {
      toast.error("Please select a date before saving.");
      return;
    }

    if (!data.Booking_Hour) {
      toast.error("Please select a time before saving.");
      return;
    }

    if (!data.Booking_Period) {
      toast.error("Please select AM/PM before saving.");
      return;
    }

    if (
      data.Booking_Minute &&
      (Number(data.Booking_Minute) < 0 || Number(data.Booking_Minute) > 59)
    ) {
      toast.error("Minute must be between 00 and 59.");
      return;
    }

    const bookingTime = toMySQLTime(
      data.Booking_Hour,
      data.Booking_Minute,
      data.Booking_Period
    );

    const bookingTimeForReceipt =
      `${data.Booking_Hour}:${data.Booking_Minute} ${data.Booking_Period}`;

    /* ---------------- ITEMS (OPTIONAL) ---------------- */
    const cleanedItems = (data.items || []).filter(
      (it) => it.Item_Name && it.Item_Name.trim() !== ""
    );

    // 👉 VALIDATE ONLY IF ITEMS EXIST
    if (cleanedItems.length > 0) {
      for (const item of cleanedItems) {
        if (!item.Item_Quantity || Number(item.Item_Quantity) <= 0) {
          toast.error(`Quantity for "${item.Item_Name}" must be greater than zero`);
          return;
        }
      }

      // Check duplicate item names
      const seen = new Set();
      for (const item of cleanedItems) {
        const name = item.Item_Name.trim().toLowerCase();
        if (seen.has(name)) {
          toast.error(`Duplicate item: ${item.Item_Name}`);
          return;
        }
        seen.add(name);
      }
    }

    /* ---------------- PREPARE ITEMS ---------------- */
    const itemsSafe = cleanedItems.map((item) => ({
      Item_Name: item.Item_Name,
      Item_Price: item.Item_Price,
      Item_Quantity: item.Item_Quantity,
      Amount: item.Amount,
    }));

    /* ---------------- FINAL PAYLOAD ---------------- */
    // const payload = {
    //   Customer_Name: data.Customer_Name || null,
    //   Customer_Phone: data.Customer_Phone || null,
    //   userId,
    //   Table_Names: data.Table_Names,
    //   Customer_Address: data.Customer_Address || "",
    //   Booking_Date: data.Booking_Date,
    //   Booking_Time: bookingTime,

    //   Sub_Total: data.Sub_Total || "0.00",
    //   Amount: data.Amount || "0.00",
    //   Advance_Payment: data.Advance_Payment || "0.00",
    //   Payment_Left: data.Payment_Left || "0.00",

    //   items: itemsSafe, // 👈 EMPTY ARRAY IS OK
    // };
    const payload = {
      Customer_Name: data.Customer_Name || null,
      Customer_Phone: data.Customer_Phone || null,
      userId,

      Order_Type: orderType === "DINE_IN" ? "dine-in" : "takeaway",

      Table_Names: orderType === "DINE_IN" ? selectedTables : [],

      Customer_Address: data.Customer_Address || "",
      Booking_Date: data.Booking_Date,
      Booking_Time: bookingTime,

      Sub_Total: data.Sub_Total || "0.00",
      Amount: data.Amount || "0.00",
      Advance_Payment: data.Advance_Payment || "0.00",
      Payment_Left: data.Payment_Left || "0.00",

      items: itemsSafe,
    };

    console.log("📦 Final JSON to send:", payload);

    try {
      const res = await addPreBookOrder(payload).unwrap();

      if (!res?.success) {
        toast.error(res.message || "Failed to pre book order.");
        return;
      }

      printPreBookReceipt(payload, bookingTimeForReceipt);

      toast.success("Pre Book Order added successfully!");
      setTimeout(() => {
        navigate("/staff/pre-book-order/all-pre-booked-orders");
      }, 100);

    } catch (error) {
      console.error("❌ Pre Book Order Submit Error:", error);
      toast.error(error?.data?.message || "Failed to pre book order.");
    }
  };



  const summaryItems = watch("items") || []

  // const customerName = watch("Customer_Name");
  // const customerPhone = watch("Customer_Phone");
  const watchedCustomerName = watch("Customer_Name");
  //const hasCustomer = Boolean(customerPhone); // phone is safest

  const subTotal = parseFloat(watch("Sub_Total") || 0.00);
  const advance = parseFloat(watch("Advance_Payment") || 0.00);
  const paymentLeft = subTotal - advance;
  console.log("paymentLeft")

  useEffect(() => {
    setValue("Payment_Left", paymentLeft < 0 ? paymentLeft : paymentLeft, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [subTotal, advance, setValue]);

  console.log(summaryItems, "summaryItems");
  // console.log("updateCart", cart);
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const renderSkeletons = (count, compact = false) =>
    [...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
        <div className={`${compact ? "h-28" : "h-32"} bg-gray-200`} />
        <div className="p-2 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      </div>
    ));

  const renderItemCard = (item, index, compact = false) => {
    const unavailable = item.is_available === 0;
    const inCart = Number(cart[item.id] || 0) > 0;

    return (
      <div
        key={item.id ?? index}
        onClick={() => {
          if (unavailable) return;
          updateCart(item.id, 1, index, item.Item_Name, item.Item_Price);
        }}
        className={`relative bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 ${unavailable
            ? "opacity-40 grayscale cursor-not-allowed"
            : "cursor-pointer hover:shadow-lg"
          } ${inCart ? "border-2 border-green-500" : ""}`}
      >
        {unavailable && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow z-10">
            Unavailable
          </div>
        )}

        <div
          className={`relative ${compact ? "h-28" : "h-32"} bg-gradient-to-br from-[#4CA1AF22] to-[#4CA1AF44]`}
        >
          {item?.Item_Image && (
            <img
              loading="lazy"
              src={`http://192.168.0.111:4000/uploads/food-item/${item.Item_Image}`}
              alt={item?.Item_Name}
              className="w-full h-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-2 right-2">
            <span className="bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#ff0000] shadow">
              {item.Item_Category}
            </span>
          </div>
        </div>

        <div className="p-2">
          <h5
            style={{ color: "red" }}
            className={`leading-tight ${compact ? "text-[15px] font-semibold mb-1" : "text-[20px] mb-2"}`}
          >
            {item?.Item_Name}
          </h5>

          <div className="flex justify-between items-center">
            <div>
              <div className={`${compact ? "text-sm" : "text-base"} font-semibold text-gray-800`}>
                ₹{Number(item?.Item_Price || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500">
                Tax: {TAX_RATES[item?.Tax_Type] ?? 0}%
              </div>
            </div>

            <div className="text-right">
              <div className={`${compact ? "text-xs" : "text-sm"} font-bold text-[#ff0000]`}>
                ₹{Number(item?.Amount || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryRows = () =>
    summaryItems.length > 0 ? (
      summaryItems.map((item, index) => {
        const qty = Number(cart[item.id] || 0);

        return (
          <div
            key={item.id ?? index}
            className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm text-gray-800 leading-tight flex-1 pr-2">
                {item?.Item_Name}
              </span>
              <span className="text-xs bg-red-100 text-[#ff0000] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                x {item?.Item_Quantity}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1 mb-2">
              <span>Amount</span>
              <span className="font-semibold text-gray-700">₹{item?.Amount}</span>
            </div>

            <div className="flex items-center justify-between bg-[#4CA1AF10] rounded-md p-1.5">
              <button
                type="button"
                disabled={qty === 0}
                onClick={() => updateCart(item.id, -1, index, item.Item_Name, item.Item_Price)}
                className={`w-7 h-7 flex items-center justify-center rounded-md shadow transition ${qty === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100 text-[#ff0000]"
                  }`}
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="text-base font-semibold text-gray-800 px-2">{qty}</span>

              <button
                type="button"
                onClick={() => updateCart(item.id, 1, index, item.Item_Name, item.Item_Price)}
                className="w-7 h-7 flex items-center justify-center rounded-md shadow transition bg-[#ff0000] text-white"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })
    ) : (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
        <ShoppingCart size={32} className="mb-2 opacity-30" />
        <p className="text-sm">No items added yet</p>
      </div>
    );

  return (
    <>




      {/* Main Content */}
      <div className="sb2-2-3 " style={{ marginTop: "48px" }} >
        <div className="row" style={{ margin: "0px" }}>
          <div className="col-md-12">
            <div style={{ padding: "20px", marginBottom: "20px", height: "100%" }}
              className="box-inn-sp">

              <div className="inn-title w-full px-2 py-3">

                <div className="flex flex-col mt-10 sm:flex-row justify-between items-start sm:items-center
                                 w-full sm:mt-0">

                  {/* LEFT HEADER */}
                  <div className="w-full flex justify-center items-center sm:w-auto">
                    <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Pre Book Order</h4>
                    {/* <p className="text-gray-500 mb-2 sm:mb-4">
        Add new sale details
      </p> */}
                  </div>

                  {/* RIGHT BUTTON SECTION */}
        
                  <div className="
       w-full flex justify-center items-center mb-2 sm:w-auto 
       flex flex-wrap sm:flex-nowrap 
        sm:justify-end 
       gap-3
     ">
                    <button
                      type="button"
                      onClick={() => navigate("/staff/pre-book-order/all-pre-booked-orders")}
                      className="text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "black" }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/staff/pre-book-order/all-pre-booked-orders")}
                      className="text-white py-2 px-4 rounded"
                      style={{ backgroundColor: "#ff0000" }}
                    >
                      All Pre Booked Orders
                    </button>
                  </div>

                </div>


                <div style={{ backgroundColor: "#f1f1f19d" }}
                  className="

  p-2  heading-wrapper
">

                  {/* <div style={{ marginTop: "0px" }}
                    className="  gap-2 flex flex-col w-full
  p-2  gap-6 sm:w-full sm:grid grid-cols-5 sm:flex-row"> */}

<div
  style={{ marginTop: "0px" }}
  className="
    grid grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-5
    w-full p-2 gap-6
  "
>

                    <div style={{ marginTop: "0px" }} className="input-field relative">
                      <span className="active">
                        Customer Phone <span className="text-red-500">*</span>
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



                                  setIsExistingCustomer(true);
                                  setCustomerDropdownOpen(false);
                                  //setCustomerDropdownOpen(false);
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

                    <div style={{ marginTop: "0px" }} className="input-field  ">
                      <span className="active">Customer Name</span>

                      <input
                        type="text"
                        id="Customer_Name"
                        placeholder="Customer Name"

                        value={watchedCustomerName || ""}
                        readOnly={isExistingCustomer} // 🔥 FIX

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
                    <div style={{ marginTop: "0px" }} className="input-field  ">
                      <span className="active">
                        Address
                      </span>


                      <textarea
                        type="text"
                        id="Customer_Address"


                        //value={watchedCustomerAddress || ""} 
                        //readOnly={isExistingCustomer} 
                        className="w-full outline-none border-b-1 border-gray-400 text-gray-900"
                        style={{ outline: "none", resize: "none" }}
                        {...register("Customer_Address")}
                      >
                      </textarea>



                    </div>
                    <div style={{ marginTop: "0px" }} className="input-field  ">
                      <span className="active">Date
                        <span className="text-red-500">*</span>

                      </span>

                      <input
                        type="date"
                        id="Booking_Date"


                        //value={watchedCustomerAddress || ""} 
                        //readOnly={isExistingCustomer} 
                        className="w-full outline-none border-b-1 border-gray-400 text-gray-900"
                        style={{ outline: "none", resize: "none" }}
                        {...register("Booking_Date")}
                        min={new Date().toISOString().split("T")[0]}   // 🔥 disables past dates

                      />


                    </div>

                    <div style={{ marginTop: "0px" }} className="input-field">
                      <span className="active">Time
                        <span className="text-red-500">*</span>
                      </span>

                      <div className="flex gap-2">
                        {/* Time */}
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="HH"
                          {...register("Booking_Hour")}

                          onInput={(e) => {
                            let value = e.target.value.replace(/\D/g, "").slice(0, 2);

                            if (value === "") {
                              e.target.value = "";
                              return;
                            }

                            const num = parseInt(value, 10);

                            // block > 12
                            if (!isNaN(num) && num > 12) {
                              e.target.value = "12";
                              return;
                            }

                            // allow 0 / 00 while typing
                            e.target.value = value;
                          }}
                          onBlur={(e) => {
                            let value = e.target.value;

                            if (value === "") return;

                            // 00 or 0 → 12
                            if (value === "0" || value === "00") {
                              e.target.value = "12";
                              return;
                            }

                            // pad single digit (5 → 05)
                            if (value.length === 1) {
                              e.target.value = value.padStart(2, "0");
                            }
                          }}
                          className="w-1/3 border-b outline-none"
                        />



                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="MM"
                          {...register("Booking_Minute")}
                          //       onInput={(e) => {
                          //     let value = e.target.value.replace(/\D/g, "").slice(0, 2);

                          //     if (value === "") {
                          //       e.target.value = "";
                          //       return;
                          //     }

                          //     let num = Number(value);

                          //     if (num < 0) num = 0;
                          //     if (num > 59) num = 59;

                          //     e.target.value = num;
                          //   }}
                          onInput={(e) => {
                            let value = e.target.value.replace(/\D/g, "").slice(0, 2);

                            if (value === "") {
                              e.target.value = "";
                              return;
                            }

                            let num = Number(value);

                            // 🔥 block > 59
                            if (!isNaN(num) && num > 59) {
                              e.target.value = "59";
                              return;
                            }

                            // allow 0 / 00 / 5 / 05 while typing
                            e.target.value = value;
                          }}
                          onBlur={(e) => {
                            let value = e.target.value;

                            if (value === "") return;

                            // 🔥 force 00 for zero
                            if (value === "0") {
                              e.target.value = "00";
                              return;
                            }

                            // pad single digit → 05
                            if (value.length === 1) {
                              e.target.value = value.padStart(2, "0");
                            }
                          }}
                          className="w-1/3 border-b outline-none"
                        />

                        {/* AM / PM */}
                        <select
                          {...register("Booking_Period")}
                          className="w-1/3 border-b outline-none"
                        >

                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>

                    </div>




                  </div>



                  {/* <div className="sm:visible"></div> */}
                  {/* <div className="w-full ">
      <input
        type="text"
        placeholder="Search ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
    </div> */}


                </div>

              </div>
              <div style={{ padding: "0", backgroundColor: "#f1f1f19d" }} className="tab-inn">
                <form onSubmit={handleSubmit(onSubmit)}>

                  {/* ─── TOP BAR: order type, tables, search ─── */}
                  {/* <div
                    className={`grid grid-cols-1 items-center gap-4 ${orderType === "DINE_IN" ? "sm:grid-cols-4" : "sm:grid-cols-2"
                      }`}
                  > */}
                 
<div
  className={`grid grid-cols-1 items-start gap-4 p-3 ${
    orderType === "DINE_IN"
      ? "md:grid-cols-2 xl:grid-cols-4"
      : "md:grid-cols-2"
  }`}
>


                    {/* <div className="p-3 mb-4"> */}
                    <div className=" min-w-0 mb-4">
                      <label className="block font-semibold mb-2">Order Type</label>
                       {/* <div className="flex gap-3"> */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderType("TAKEAWAY");
                            setSelectedTables([]);
                            setValue("Table_Names", []);
                          }}
                          className={`px-5 py-2 rounded-md border ${orderType === "TAKEAWAY"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700"
                            }`}
                        >
                          Takeaway
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderType("DINE_IN");
                            setSelectedTables([]);
                            setValue("Table_Names", []);
                          }}
                          className={`px-4 py-2 rounded-md border ${orderType === "DINE_IN"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700"
                            }`}
                        >
                          Dine-in
                        </button>


                      </div>
                    </div>

                    {orderType === "DINE_IN" && (
                      <div ref={tableRef} className="relative min-w-0 mt-4">
                        <div
                          className="flex flex-row border rounded-md bg-white cursor-pointer h-[3rem]"
                          onClick={() => setOpen((prev) => !prev)}
                        >
                          <input
                            type="text"
                            placeholder="Search tables..."
                            value={tableSearch}
                            onChange={(e) => {
                              setTableSearch(e.target.value);
                              setOpen(true);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(true);
                            }}
                            onBlur={() => setTimeout(() => setOpen(false), 150)}
                            className="w-full outline-none py-1 px-2 text-gray-900"
                            style={{  border: "none", height: "2rem",marginBottom:"0px" }}
                          />
                          <span className="absolute right-0 px-3 top-1/3 text-gray-700">▼</span>
                        </div>

                        {open && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {tables?.tables
                              ?.filter((table) =>
                                table.Table_Name.toLowerCase().includes(tableSearch.toLowerCase())
                              )
                              .map((table, i) => {
                                const isSelected = selectedTables.includes(table.Table_Name);

                                return (
                                  <div
                                    key={i}
                                    onClick={() => {
                                      const updatedSelection = isSelected
                                        ? selectedTables.filter((t) => t !== table.Table_Name)
                                        : [...selectedTables, table.Table_Name];

                                      setSelectedTables(updatedSelection);
                                      setValue("Table_Names", updatedSelection, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      });
                                    }}
                                    className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                  >
                                    <span>{table.Table_Name}</span>
                                    {isSelected && <span className="text-blue-600 font-bold">✔</span>}
                                  </div>
                                );
                              })}

                            {tables?.tables?.filter((table) =>
                              table.Table_Name.toLowerCase().includes(tableSearch.toLowerCase())
                            ).length === 0 && (
                                <p className="px-3 py-2 text-gray-500">No table found</p>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    {orderType === "DINE_IN" && (
    <div className="min-w-0 flex flex-wrap content-start items-start gap-2 mt-4">
      {selectedTables.length > 0 ? (
        selectedTables.map((name, idx) => (
          <span
            key={idx}
            className="max-w-full break-words px-3 py-1 bg-blue-200 text-blue-900 rounded-md text-sm flex items-center gap-2"
          >
            <span>{name}</span>
            <button
              type="button"
              className="text-red-600 font-bold shrink-0"
              onClick={() => {
                const updated = selectedTables.filter((t) => t !== name);
                setSelectedTables(updated);
                setValue("Table_Names", updated);
              }}
            >
              ×
            </button>
          </span>
        ))
      ) : (
        <p className="text-gray-500">No tables selected</p>
      )}
    </div>
  )}

                    <div className="w-full">
                      <input
                        type="text"
                        placeholder="Search ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* ═════════ MOBILE FLOATING BUTTONS ═════════ */}
                  <div className="flex lg:hidden fixed bottom-4 left-0 right-0 z-40 justify-between px-4 pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDrawer(true)}
                      className="pointer-events-auto flex items-center gap-1 bg-white border border-gray-200 text-[#ff0000] font-bold px-4 py-2 rounded-full shadow-lg text-sm"
                    >
                      ☰ Categories
                    </button>

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

                  {/* ═════════ MOBILE CATEGORY DRAWER ═════════ */}
                  {showCategoryDrawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowCategoryDrawer(false)}
                      />
                      <div className="relative w-64 bg-white h-[calc(100%-6rem)] mt-24 flex flex-col shadow-2xl z-10">
                        {/* <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl z-10"> */}
                        <div className="px-4 py-3 bg-[#ff0000] flex justify-between items-center">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide">Categories</h4>
                          <button
                            type="button"
                            onClick={() => setShowCategoryDrawer(false)}
                            className="text-white text-xl font-bold"
                          >
                            ✖
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                          {newCategories.map((cat, index) => (
                            <button
                              type="button"
                              key={index}
                              onClick={() => {
                                setActiveCategory(cat);
                                setShowCategoryDrawer(false);
                              }}
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

                  {/* ═════════ MOBILE ORDER DRAWER ═════════ */}
                  {showOrderDrawer && (
                    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowOrderDrawer(false)}
                      />
                      <div
                        className="relative bg-white rounded-t-2xl shadow-2xl z-10 flex flex-col"
                        style={{ maxHeight: "80vh" }}
                      >
                        <div className="flex justify-center pt-3 pb-1">
                          <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

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
                            <button
                              type="button"
                              onClick={() => setShowOrderDrawer(false)}
                              className="text-white text-xl font-bold"
                            >
                              ✖
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">{renderSummaryRows()}</div>

                        <div className="border-t px-4 py-3 space-y-2 bg-white">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-[#ff0000] text-lg">₹{watch("Amount")}</span>
                          </div>

                          <button
                            type="button"
                            disabled={isAddPreBookOrderLoading}
                            onClick={() => {
                              setShowOrderDrawer(false);
                              setShowSummary(true);
                            }}
                            className="w-full py-2.5 flex items-center justify-center gap-3 rounded-lg text-white font-bold shadow text-sm"
                            style={{ backgroundColor: "black" }}
                          >
                            <span className="relative inline-flex">
                              <ShoppingCart size={18} className="text-white" />

                              {totalItems > 0 && (
                                <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 bg-white text-[#ff0000] text-[10px] font-bold flex items-center justify-center rounded-full shadow">
                                  {totalItems}
                                </span>
                              )}
                            </span>

                            {isAddPreBookOrderLoading ? "Saving..." : "Save & Book"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═════════ DESKTOP: 3 COLUMNS ═════════ */}
                  <div className="hidden lg:flex h-[calc(100vh-120px)] min-h-[560px] bg-gradient-to-br from-orange-50 via-white to-red-50">
                    {/* LEFT: categories */}
                    <aside className="w-[180px] lg:w-[200px] h-full flex-shrink-0 bg-white shadow-md flex flex-col overflow-y-auto border-r">
                      <div className="px-3 py-3 border-b bg-[#ff0000]">
                        <h4 className="text-white font-bold text-sm tracking-wide uppercase">Categories</h4>
                      </div>

                      <div className="flex flex-col overflow-y-auto flex-1 min-h-0 py-2 gap-1 px-2">
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

                    {/* MIDDLE: items */}
                    <main className="flex-1 overflow-y-auto px-3 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {isMenuItemsLoading || isFetching ? (
                          renderSkeletons(12)
                        ) : filteredItems.length > 0 ? (
                          filteredItems.map((item, index) => renderItemCard(item, index))
                        ) : (
                          <p className="text-gray-500 text-center col-span-full">No items found</p>
                        )}
                      </div>
                    </main>

                    {/* RIGHT: order summary */}
                    <aside className="w-[280px] lg:w-[300px] flex-shrink-0 bg-white shadow-md flex flex-col border-l overflow-y-auto">
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

                      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
                        {renderSummaryRows()}
                      </div>

                      <div className="border-t bg-white px-4 py-3 space-y-3 flex-shrink-0">
                        <div className="flex justify-between items-center text-base font-bold text-gray-900">
                          <span>Total</span>
                          <span className="text-[#ff0000] text-lg">₹{watch("Amount")}</span>
                        </div>

                        <button
                          type="button"
                          disabled={isAddPreBookOrderLoading}
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
                          {isAddPreBookOrderLoading ? "Saving..." : "Save & Book"}
                        </button>
                      </div>
                    </aside>
                  </div>

                  {/* ═════════ MOBILE: ITEMS ONLY ═════════ */}
                  <div className="lg:hidden bg-gradient-to-br from-orange-50 via-white to-red-50 pb-24">
                    <div className="px-3 py-4 grid grid-cols-2 gap-3">
                      {isMenuItemsLoading || isFetching ? (
                        renderSkeletons(6, true)
                      ) : filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => renderItemCard(item, index, true))
                      ) : (
                        <p className="text-gray-500 text-center col-span-full">No items found</p>
                      )}
                    </div>
                  </div>

                  {/* ═════════ BILL SUMMARY SHEET (advance + submit) ═════════ */}
                  {showSummary && (
                    <button
                      type="button"
                      onClick={() => setShowSummary(false)}
                      className="fixed inset-0 bg-black/40 z-40"
                    />
                  )}

                  <div
                    className={`fixed left-0 bottom-0 w-full bg-white shadow-2xl rounded-t-2xl z-50 transform transition-transform duration-300 p-4 ${showSummary ? "translate-y-0" : "translate-y-full"
                      }`}
                  >
                    <div className="w-full flex justify-center py-2">
                      <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    <div className="px-4 pb-3 border-b">
                      <div className="flex justify-between items-center">
                        <div className="flex justify-center items-center mx-auto">
                          <h2 className="text-lg font-bold text-gray-700">Bill Summary</h2>
                        </div>
                        <button
                          type="button"
                          style={{ backgroundColor: "transparent", fontSize: "30px" }}
                          className="text-gray-500 text-2xl font-bold"
                          onClick={() => setShowSummary(false)}
                        >
                          ✖
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: "45vh" }}>
                      {summaryItems.map((item, index) => (
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

                      <div className="border-b pb-2 mb-2"></div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="hidden sm:block"></div>
                        <div className="hidden sm:block"></div>
                        <div className="flex gap-4 justify-center items-center">
                          <span className="active whitespace-nowrap">Advance payment</span>
                          <input
                            type="number"
                            id="Advance_Payment"
                            className="w-full outline-none border-b-1 border-gray-400 text-gray-900"
                            style={{ outline: "none", resize: "none", marginBottom: "0px" }}
                            {...register("Advance_Payment")}
                          />
                          {errors?.Advance_Payment && (
                            <p className="text-red-500 text-xs mt-1">{errors.Advance_Payment.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="hidden sm:block"></div>
                        <div className="hidden sm:block"></div>
                        <div className="flex gap-4 justify-center items-center">
                          <span className="active whitespace-nowrap">
                            {paymentLeft < 0 ? "Extra Paid" : "Payment Left"}
                          </span>
                          <input
                            type="number"
                            readOnly
                            id="Payment_Left"
                            value={Math.abs(paymentLeft).toFixed(2)}
                            className="w-full outline-none border-b border-gray-400 text-gray-900"
                            style={{ outline: "none", marginBottom: "0px" }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-center mt-4">
                        <button
                          type="submit"
                          disabled={isAddPreBookOrderLoading}
                          style={{ backgroundColor: "#ff0000" }}
                          className="w-16 h-10 flex items-center justify-center rounded-md text-white shadow"
                        >
                          {isAddPreBookOrderLoading ? "Saving..." : "OK"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

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






