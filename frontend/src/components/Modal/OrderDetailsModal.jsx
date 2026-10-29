import { useEffect, useRef, useState } from "react";
import {
  orderApi,
  useConfirmOrderBillPaidAndInvoiceGeneratedMutation,
  useGenerateSmsMutation,
  useGetAllCustomersQuery,
  useNextInvoiceNumberQuery,
} from "../../redux/api/Staff/orderApi";
import { toast } from "react-toastify";
import { tableApi } from "../../redux/api/tableApi";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { kitchenStaffApi } from "../../redux/api/KitchenStaff/kitchenStaffApi";
import { useForm } from "react-hook-form";
import { useGetAllCouponsQuery } from "../../redux/api/couponApi";


import {
  checkCleanterReady,
  printViaCleanter,
  isMobileDevice,
} from "../../utils/cleanter";

export default function OrderDetailsModal({ onClose, orderDetails, orderId }) {
  console.log(orderDetails, "orderDetails");
  const { data: customers } = useGetAllCustomersQuery();
  console.log(customers, "customers");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const { data: invoiceNumberData } = useNextInvoiceNumberQuery();
  const { data: coupon } = useGetAllCouponsQuery();

  const [customerDetails, setCustomerDetails] = useState({});
  console.log(invoiceNumberData, "invoiceNumberData");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const isConfirmingBillRef = useRef(false);
  useEffect(() => {
    setCustomerDetails({
      Customer_Name: orderDetails?.customerDetails?.Customer_Name || "",
      Customer_Phone: orderDetails?.customerDetails?.Customer_Phone || "",
    });
  }, [orderDetails]);
  const [
    confirmBillAndInvoiceGenerated,
    { isLoading: isConfirmingBillAndInvoiceGeneratedLoading },
  ] = useConfirmOrderBillPaidAndInvoiceGeneratedMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [generateSms, { isLoading: isGenerateSmsLoading }] =
    useGenerateSmsMutation();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const {
    setValue,

    watch,

    formState: { errors },
  } = useForm({});
  const [invoiceDetails, setInvoiceDetails] = useState({
    Sub_Total: orderDetails?.Sub_Total ?? "0.00",
    Amount: orderDetails?.Amount ?? "0.00",

    // New fields (empty initially)
    Customer_Name: customerDetails?.Customer_Name,
    Customer_Phone: customerDetails?.Customer_Phone,
    Service_Charge: "0.00",
    Service_Charge_Type: "amount",
    Discount: "0.00",
    Discount_Type: "percentage",
    Final_Amount: "0.00",
    Payment_Type: "cash",
    Coupon_Id: "",
    Coupon_Code: "",
    Coupon_Discount_Value: "0.00",
    Coupon_Discount_Type: "",
  });
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
    setInvoiceDetails((prev) => ({
      ...prev,
      Customer_Name: customerDetails?.Customer_Name || "",
      Customer_Phone: customerDetails?.Customer_Phone || "",
    }));
  }, [customerDetails]);
  const calculateGrandTotal = () => {
    const subtotal = parseFloat(invoiceDetails?.Sub_Total || 0);

    let service = parseFloat(invoiceDetails?.Service_Charge || 0);

    let manualDiscount = parseFloat(invoiceDetails?.Discount || 0);

    // -----------------------------
    // MANUAL DISCOUNT
    // -----------------------------
    if (invoiceDetails.Discount_Type === "percentage") {
      manualDiscount = (subtotal * manualDiscount) / 100;
    }

    // -----------------------------
    // SERVICE CHARGE
    // -----------------------------
    if (invoiceDetails.Service_Charge_Type === "percentage") {
      service = (subtotal * service) / 100;
    }

    // -----------------------------
    // COUPON DISCOUNT
    // -----------------------------
    let couponDiscount = 0;

    if (selectedCoupon) {
      if (selectedCoupon.discount_type === "PERCENT") {
        couponDiscount =
          (subtotal * parseFloat(selectedCoupon.discount_value)) / 100;
      } else {
        couponDiscount = parseFloat(selectedCoupon.discount_value);
      }
    }

    // -----------------------------
    // FINAL TOTAL
    // -----------------------------
    const finalAmount = subtotal + service - manualDiscount - couponDiscount;

    // save into state
    invoiceDetails.Final_Amount = finalAmount.toFixed(2);

    return finalAmount.toFixed(2);
  };

  const formValues = watch();

  console.log(formValues, "formValues");
  const watchedCustomerName = watch("Customer_Name");
  const watchedCustomerPhone = watch("Customer_Phone");
  const handleApplyCoupon = (couponItem) => {
    const subTotal = parseFloat(watch("Sub_Total")) || 0;

    // REMOVE coupon if same clicked again
    if (selectedCoupon?.id === couponItem.id) {
      setSelectedCoupon(null);

      setInvoiceDetails((prev) => ({
        ...prev,
        Coupon_Id: "",
        Coupon_Code: "",
        Coupon_Discount_Type: "",
        Coupon_Discount_Value: "",
      }));

      return;
    }

    // APPLY NEW coupon
    setSelectedCoupon(couponItem);

    let discountAmount = 0;

    if (couponItem.discount_type === "PERCENT") {
      discountAmount = (subTotal * parseFloat(couponItem.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(couponItem.discount_value);
    }

    const finalAmount = subTotal - discountAmount;
    setInvoiceDetails((prev) => ({
      ...prev,
      Coupon_Id: couponItem.id,
      Coupon_Code: couponItem.code,
      Coupon_Discount_Type:
        couponItem.discount_type === "PERCENT" ? "PERCENT" : "FLAT",
      Coupon_Discount_Value: couponItem.discount_value,
      Final_Amount: finalAmount,
    }));
  };

  const handleConfirmBillAndGenerateInvoice = async () => {
    if (isConfirmingBillRef.current) return;

    isConfirmingBillRef.current = true;

    try {
      // On mobile, check the printer BEFORE confirming payment.
      if (isMobileDevice()) {
        try {
          await checkCleanterReady();
        } catch (printerError) {
          console.error("Cleanter readiness check failed:", printerError);

          toast.error(
            `${printerError.message} No payment confirmation was submitted.`,
            { autoClose: 6000 },
          );

          return;
        }
      }

      // Preserve the existing API payload.
      const payload = {
        Customer_Name: watchedCustomerName || null,
        Customer_Phone: watchedCustomerPhone,
        Discount: invoiceDetails?.Discount,
        Discount_Type: invoiceDetails?.Discount_Type ?? "percentage",
        Service_Charge: invoiceDetails.Service_Charge,
        Service_Charge_Type: invoiceDetails?.Service_Charge_Type ?? "amount",
        Payment_Type: invoiceDetails?.Payment_Type,
        Final_Amount: invoiceDetails?.Final_Amount,
        Coupon_Id: invoiceDetails?.Coupon_Id,
        Coupon_Code: invoiceDetails?.Coupon_Code,
        Coupon_Discount_Type: invoiceDetails?.Coupon_Discount_Type,
        Coupon_Discount_Value: invoiceDetails?.Coupon_Discount_Value,
      };

      console.log(payload, "payload");

      // Confirm payment and generate the invoice.
      const response = await confirmBillAndInvoiceGenerated({
        orderId,
        payload,
      }).unwrap();

      const invoiceId = response.Invoice_Id;
      setInvoiceNumber(invoiceId);

      toast.success("Invoice Generated & Bill Paid!");

      // Print separately so a printer failure is not treated
      // as a payment/API failure.
      try {
        if (isMobileDevice()) {
          await printInvoiceViaCleanter(invoiceId);
        } else {
          // Keep the existing PC printing function unchanged.
          printInvoiceWindow(invoiceId);
        }
      } catch (printError) {
        console.error("Bill paid, but invoice printing failed:", printError);

        toast.error(
          `Bill is already paid and invoice ${invoiceId} is generated, but printing failed: ${printError.message}. Do not confirm payment again.`,
          { autoClose: 10000 },
        );
      }

      // Preserve the existing refresh and navigation behavior.
      dispatch(tableApi.util.invalidateTags(["Table"]));
      dispatch(kitchenStaffApi.util.invalidateTags(["Kitchen-Staff"]));
      dispatch(orderApi.util.invalidateTags(["Order"]));

      onClose();
      navigate("/staff/orders/add");
    } catch (error) {
      console.error("Error confirming bill and generating invoice:", error);

      toast.error(error?.data?.message || "Failed to generate invoice");
    } finally {
      isConfirmingBillRef.current = false;
    }
  };

  const handleShareSMS = async () => {
    try {
      const payload = {
        Customer_Name: watchedCustomerName,
        Customer_Phone: watchedCustomerPhone,
        Discount_Type: invoiceDetails?.Discount_Type,
        Discount: invoiceDetails?.Discount,
        Service_Charge: invoiceDetails?.Service_Charge,
        Payment_Type: invoiceDetails?.Payment_Type,
        Final_Amount: invoiceDetails?.Final_Amount,
        Coupon_Id: invoiceDetails?.Coupon_Id,
        Coupon_Code: invoiceDetails?.Coupon_Code,
        Coupon_Discount_Type: invoiceDetails?.Coupon_Discount_Type,
        Coupon_Discount_Value: invoiceDetails?.Coupon_Discount_Value,
      };
      console.log(payload, "payload");

      const response = await generateSms({
        Order_Id: orderId,
        payload,
      }).unwrap();

      toast.success("📩 Bill sent via SMS successfully");
      console.log(response, "response");
      dispatch(tableApi.util.invalidateTags(["Table"]));
      dispatch(kitchenStaffApi.util.invalidateTags(["Kitchen-Staff"]));
      onClose();
      navigate("/staff/orders/all-orders");
    } catch (err) {
      console.error(err);
      toast.warning("⚠️ SMS request processed.it may take time.", {
        autoClose: 5000,
      });
      // toast.error(err?.data?.message || "Failed to send SMS");
    }
  };

  console.log(invoiceDetails, "invoiceDetails", customerDetails);

  const getDiscountAmount = () => {
    const subTotal = Number(invoiceDetails.Sub_Total || 0);
    const discount = Number(invoiceDetails.Discount || 0);

    if (invoiceDetails.Discount_Type === "percentage") {
      return (subTotal * discount) / 100;
    }
    console.log(discount);

    return discount;
  };
  const getCouponDiscountAmount = () => {
    console.log(invoiceDetails, "invoiceDetails");
    const subTotal = Number(invoiceDetails.Sub_Total || 0);
    const discount = Number(invoiceDetails.Coupon_Discount_Value || 0);

    if (invoiceDetails.Coupon_Discount_Type === "PERCENT") {
      return (subTotal * discount) / 100;
    }
    console.log(discount);

    return discount;
  };

  const getServiceAmount = () => {
    const subTotal = Number(invoiceDetails.Sub_Total || 0);
    const service = Number(invoiceDetails.Service_Charge || 0);

    if (invoiceDetails.Service_Charge_Type === "percentage") {
      return (subTotal * service) / 100;
    }

    return service;
  };

  const printInvoiceViaCleanter = async (invoiceId) => {
    const getCurrentDate = () => new Date().toLocaleDateString("en-GB");

    const getCurrentTime = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const content = [];

    // RESTAURANT HEADER — same information as PC
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
      text: "Address:Shakuntala Park, Kolkata 700061",
      align: "center",
    });

    content.push({
        type: "text",
        text: "FSSAI No: 12826019000014",
        align: "center",
      });

    content.push({ type: "divider" });

    // CUSTOMER DETAILS — same display conditions as PC
    if (watchedCustomerName) {
      content.push({
        type: "row",
        left: "Customer:",
        right: watchedCustomerName,
      });
    }

    if (watchedCustomerPhone) {
      content.push({
        type: "row",
        left: "Phone:",
        right: watchedCustomerPhone,
      });
    }

    content.push({ type: "divider" });

    // TABLE DETAILS
    const tableNames = Array.isArray(orderDetails?.Table_Names)
      ? orderDetails.Table_Names.join(", ")
      : "-";

    content.push({
      type: "text",
      text: `TABLE: ${tableNames}`,
      align: "center",
      bold: true,
    });

    // DATE AND TIME
    content.push({
      type: "row",
      left: `Date: ${getCurrentDate()}`,
      right: `Time: ${getCurrentTime()}`,
    });

    // INVOICE NUMBER
    content.push({
      type: "row",
      left: "Invoice:",
      right: String(invoiceId || "-"),
    });

    content.push({ type: "divider" });

    // ITEMS — keep item details readable on the mobile receipt.
    content.push({
      type: "row",
      left: "No. ITEM / QTY",
      right: "AMT",
      bold: true,
    });

    (orderDetails?.items || []).forEach((item, index) => {
      content.push({
        type: "row",
        left: `${index + 1}. ${item.Item_Name ?? "-"} x${item.Item_Quantity ?? 1}`,
        right: `₹${Number(item.Amount ?? 0).toFixed(2)}`,
      });
    });

    content.push({ type: "divider" });

    // SUBTOTAL
    content.push({
      type: "row",
      left: "Subtotal",
      right: `₹${Number(invoiceDetails?.Sub_Total).toFixed(2)}`,
    });

    // MANUAL DISCOUNT — same condition and calculation as PC
    if (Number(invoiceDetails?.Discount) > 0) {
      content.push({
        type: "row",
        left: "Discount",
        right: `${
          invoiceDetails?.Discount_Type === "percentage"
            ? `${String(invoiceDetails.Discount).padStart(2, " ")}% `
            : ""
        }₹${getDiscountAmount().toFixed(2)}`,
      });
    }

    // COUPON DISCOUNT — same label logic and calculation as PC
    if (Number(invoiceDetails?.Coupon_Discount_Value) > 0) {
      content.push({
        type: "row",
        left: `Coupon Discount${
          invoiceDetails?.Coupon_Discount_Type === "PERCENT"
            ? ` ${invoiceDetails.Coupon_Discount_Value}%`
            : ` ₹${Number(invoiceDetails.Coupon_Discount_Value).toFixed(2)}`
        }`,
        right: `₹${getCouponDiscountAmount().toFixed(2)}`,
      });
    }

    // DINE-IN CHARGE — same condition and calculation as PC
    if (Number(invoiceDetails?.Service_Charge) > 0) {
      content.push({
        type: "row",
        left: "Dine-In Charge",
        right: `${
          invoiceDetails?.Service_Charge_Type === "percentage"
            ? `${String(invoiceDetails.Service_Charge).padStart(2, " ")}% `
            : ""
        }₹${getServiceAmount().toFixed(2)}`,
      });
    }

    content.push({ type: "divider" });

    // TOTAL — use the same final amount as PC
    content.push({
      type: "row",
      left: "TOTAL",
      right: `₹${Number(invoiceDetails?.Final_Amount ?? 0).toFixed(2)}`,
      bold: true,
      size: "large",
    });

    // FOOTER — same text as PC
    content.push({ type: "divider" });

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

    // Send the invoice to Cleanter.
    return await printViaCleanter(content);
  };

  const printInvoiceWindow = (invoiceId) => {
    const getCurrentDate = () => new Date().toLocaleDateString("en-GB");

    const getCurrentTime = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    const total = invoiceDetails?.Final_Amount ?? 0;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoiceDetails?.Invoice_Number ?? ""}</title>
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
      width: 48mm;
      margin: 0 auto;
      padding: 2mm;
    }
      .invoice-kitchen {
      width: 48mm;
      margin: 0 auto;
      padding: 2mm;
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
      padding-right: 2mm;
      word-break: break-word;
    }

    .item-qty {
      width: 6mm;
      text-align: center;
    }

    .item-amount {
      width: 10mm;
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
 
 .service-percentage {
 text-align: right;
white-space: nowrap;
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

    ${
      watchedCustomerName
        ? `
    <div class="info-row">
      <span class="info-label">Customer:</span>
      <span>${watchedCustomerName}</span>
    </div>`
        : ``
    }

    ${
      watchedCustomerPhone
        ? `
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span>${watchedCustomerPhone}</span>
    </div>`
        : ``
    }

    <div class="line"></div>

<div class="header-middle">
  <b>TABLE: ${
    Array.isArray(orderDetails?.Table_Names)
      ? orderDetails.Table_Names.join(", ")
      : "-"
  }</b>
</div>


 <div class="info-row date-time">
  <span><b>Date:</b> ${getCurrentDate()}</span>
  <span><b>Time:</b> ${getCurrentTime()}</span>
</div>


    <div class="info-row">
      <span><b>Invoice:</b> ${invoiceId || "-"}</span>
    </div>

    <div class="line-solid"></div>

    <div class="items-header">
      <div class="col-no">No</div>
      <div class="item-name">ITEM</div>
      <div class="item-qty">QTY</div>
      <div class="item-amount">AMT</div>
    </div>

    ${(orderDetails?.items || [])
      .map(
        (it, i) => `
      <div class="item-row">
        <div class="col-no">${i + 1}</div>
        <div class="item-name">${it.Item_Name}</div>
        <div class="item-qty">${it.Item_Quantity}</div>
        <div class="item-amount">₹${Number(it.Amount).toFixed(2)}</div>
      </div>
    `,
      )
      .join("")}

    <div class="line-solid"></div>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>₹${Number(invoiceDetails?.Sub_Total).toFixed(2)}</span>
      </div>

 ${
   Number(invoiceDetails?.Discount) > 0
     ? `
  <div class="summary-row">
    <span>Discount&nbsp;</span>
    <span>
      ${
        invoiceDetails?.Discount_Type === "percentage"
          ? `${String(invoiceDetails.Discount).padStart(2, " ")}% `
          : ""
      }₹${getDiscountAmount().toFixed(2)}
    </span>
  </div>`
     : ``
 }
  ${
    Number(invoiceDetails?.Coupon_Discount_Value) > 0
      ? `
  <div class="summary-row">
    <span>
      Coupon Discount
      ${
        invoiceDetails?.Coupon_Discount_Type === "PERCENT"
          ? ` ${invoiceDetails.Coupon_Discount_Value}%`
          : ` ₹${Number(invoiceDetails.Coupon_Discount_Value).toFixed(2)}`
      }
    </span>

    <span style="white-space: nowrap;">
      ₹${getCouponDiscountAmount().toFixed(2)}
    </span>
  </div>`
      : ``
  }

${
  Number(invoiceDetails?.Service_Charge) > 0
    ? `
  <div class="summary-row">
    <span>Dine-In Charge&nbsp;</span>
    <span class="service-percentage">
      ${
        invoiceDetails?.Service_Charge_Type === "percentage"
          ? `${String(invoiceDetails.Service_Charge).padStart(2, " ")}% `
          : ""
      }₹${getServiceAmount().toFixed(2)}
    </span>
  </div>`
    : ``
}
      <div class="summary-row total">
        <span>TOTAL</span>
        <span>₹${Number(total).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <b>THANK YOU!</b><br>
      Please Visit Again
    </div>
 
  </div>
</body>
</html>
`;
    // 🔥 CREATE HIDDEN IFRAME

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // ✅ THIS WAS MISSING
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    //  CLEANUP AFTER PRINT
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
  useEffect(() => {
    if (customerDetails?.Customer_Phone) {
      setCustomerSearch(customerDetails.Customer_Phone);

      setValue("Customer_Phone", customerDetails.Customer_Phone);
      setValue("Customer_Name", customerDetails.Customer_Name || null);

      setIsExistingCustomer(true); // important
    }
  }, [invoiceDetails, setValue]);
  const isInvoiceCustomerLocked = Boolean(customerDetails?.Customer_Phone);

  console.log(invoiceNumber, "invoiceNumber");
  return (
    <div
      style={{
        position: "fixed",
        marginTop: "4rem",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)", // dim background
        backdropFilter: "blur(4px)", // blur effect
        zIndex: 50,
        padding: "1rem", // ensures spacing on small screens
      }}
    >
      <div
        className="
    bg-white 
    w-full
    max-w-4xl rounded-lg 
    shadow-lg p-6

    max-h-[85vh]        /* 🔥 mobile height */
    overflow-y-auto     /* 🔥 enable scroll */

    sm:max-h-[90vh]    /* desktop unchanged */
    sm:overflow-visible /* desktop unchanged */
  "
      >
        <div className="flex justify-end items-center ">
          <h4 className="text-xl font-semibold text-gray-900"></h4>
          <button
            type="button"
            style={{
              backgroundColor: "transparent",
              height: "30px",
              width: "30px",
              fontSize: "20px",
            }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 "
          >
            ✕
          </button>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* REMOVE THE TAB BUTTONS - NO MORE TABS */}

          {/* ORDER DETAILS SECTION - Always Visible */}
          <div className="bg-white border rounded-lg p-2 ">
            <h3 className="text-xl text-center font-bold mb-2 text-gray-800">
              Order Details
            </h3>
            <div className="bg-gray-50 p-2">
              {/* Customer Row */}
              <div className="row flex gap-2 mb-4">
                {/* Customer Phone */}
                <div
                  style={{ marginTop: "0px" }}
                  className="input-field relative"
                >
                  <span className="active">Customer Phone</span>
                  <input
                    ref={inputRef}
                    type="number"
                    id="Customer_Phone"
                    placeholder="Search by phone"
                    value={customerSearch}
                    readOnly={isInvoiceCustomerLocked}
                    onChange={(e) => {
                      if (isInvoiceCustomerLocked) return;
                      let val = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setCustomerSearch(val);
                      setValue("Customer_Phone", val, { shouldValidate: true });
                      setIsExistingCustomer(false);
                      setCustomerDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (!isInvoiceCustomerLocked)
                        setCustomerDropdownOpen(true);
                    }}
                    className={`w-full outline-none border-b-2 text-gray-900 ${
                      isInvoiceCustomerLocked
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  />
                  {customerDropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                    >
                      {customers
                        ?.filter(
                          (c) =>
                            c.Customer_Phone.includes(customerSearch) ||
                            c.Customer_Name?.toLowerCase().includes(
                              customerSearch.toLowerCase(),
                            ),
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
                                { shouldValidate: true },
                              );
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
                        <p className="px-3 py-2 text-gray-500">
                          No customers found
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Name */}
                <div style={{ marginTop: "0px" }} className="input-field">
                  <span className="active">Customer Name</span>
                  <input
                    type="text"
                    id="Customer_Name"
                    placeholder="Customer Name"
                    readOnly={isInvoiceCustomerLocked || isExistingCustomer}
                    value={watchedCustomerName}
                    className={`w-full outline-none border-b-2 text-gray-900 ${
                      isInvoiceCustomerLocked || isExistingCustomer
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    onChange={(e) => {
                      if (isInvoiceCustomerLocked || isExistingCustomer) return;
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
              {/* end customer row */}

              {/* Fields Stack */}
              <div className="flex flex-col gap-4">
                {/* Discount */}
                <div
                  style={{ width: "100%", paddingBottom: "0px" }}
                  className="flex flex-col gap-1"
                >
                  <span className="active">Discount</span>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      style={{ marginBottom: "0px" }}
                      type="text"
                      id="Discount"
                      value={invoiceDetails.Discount}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = val.split(".");
                        if (parts.length > 2)
                          val = parts[0] + "." + parts.slice(1).join("");
                        if (val.includes(".")) {
                          const [int, dec] = val.split(".");
                          val = int + "." + dec.slice(0, 2);
                        }
                        if (
                          invoiceDetails.Discount_Type === "percentage" &&
                          parseFloat(val) > 100
                        )
                          val = "100";
                        setInvoiceDetails({ ...invoiceDetails, Discount: val });
                      }}
                      placeholder={
                        invoiceDetails.Discount_Type === "percentage"
                          ? "0 %"
                          : "0.00"
                      }
                      className="flex-grow border-b-2 outline-none pb-1 text-gray-900"
                    />
                    <select
                      className="border rounded-md px-1 py-1 text-sm w-28"
                      value={invoiceDetails.Discount_Type || "amount"}
                      onChange={(e) =>
                        setInvoiceDetails({
                          ...invoiceDetails,
                          Discount_Type: e.target.value,
                          Discount: "0.00",
                        })
                      }
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>

                {/* Coupons */}

                {coupon?.data?.filter((item) => Number(item.is_active) === 1)
                  .length > 0 && (
                  <div
                    style={{ width: "100%" }}
                    className="flex flex-col gap-2"
                  >
                    <span className="active">Coupons</span>

                    <div className="flex flex-wrap gap-2 w-full">
                      {coupon?.data
                        ?.filter((item) => Number(item.is_active) === 1)
                        ?.map((item) => {
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

                    {/* Applied coupon chip */}
                    {selectedCoupon && (
                      <div className="mt-1">
                        <p className="text-xs text-black mb-1">
                          Applied coupon
                        </p>

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
                  </div>
                )}

                {/* Dine-In Charge */}
                <div style={{ width: "100%" }} className="flex flex-col gap-1">
                  <span className="active">Dine-In Charge</span>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      id="Service_Charge"
                      value={invoiceDetails?.Service_Charge}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = val.split(".");
                        if (parts.length > 2)
                          val = parts[0] + "." + parts.slice(1).join("");
                        if (val.includes(".")) {
                          const [int, dec] = val.split(".");
                          val = int + "." + dec.slice(0, 2);
                        }
                        e.target.value = val;
                        setInvoiceDetails({
                          ...invoiceDetails,
                          Service_Charge: val,
                        });
                      }}
                      placeholder="0.00"
                      className="w-full outline-none border-b-2 text-gray-900"
                    />
                    <select
                      className="border rounded-md px-1 py-1 text-sm w-28"
                      value={invoiceDetails.Service_Charge_Type || "amount"}
                      onChange={(e) =>
                        setInvoiceDetails({
                          ...invoiceDetails,
                          Service_Charge_Type: e.target.value,
                          Service_Charge: "0.00",
                        })
                      }
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>

                {/* Payment Type */}
                <div style={{ width: "100%" }}>
                  <span className="active">Payment Type</span>
                  <select
                    id="Payment Mode"
                    onChange={(e) =>
                      setInvoiceDetails({
                        ...invoiceDetails,
                        Payment_Type: e.target.value,
                      })
                    }
                    value={invoiceDetails?.Payment_Type}
                    className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2 mt-1"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Upi">Upi</option>
                  </select>
                </div>
              </div>
              {/* end fields stack */}
            </div>
          </div>

          {/* INVOICE DETAILS SECTION - Always Visible Below */}
          <div className="bg-white border rounded-lg p-2">
            <div className="flex flex-col w-full items-center">
              <div className="flex">
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  Invoice Preview
                </h3>
              </div>

              {/* INVOICE PREVIEW */}
              <div
                className="w-full max-w-md bg-white shadow-md border rounded-lg p-6
                      max-h-[60vh] overflow-y-auto"
              >
                {/* HEADER */}

                <h4 className="text-xl font-bold text-center">HELLO GUYS</h4>

                <div className="border-t my-1"></div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px", // 🔥 smaller text
                    lineHeight: "1.2", // 🔥 tight rows
                    marginBottom: "4px",
                  }}
                >
                  <div>
                    <div>
                      <strong>Name:</strong> {watchedCustomerName || "-"}
                    </div>
                    <div>
                      <strong>Phone:</strong> {watchedCustomerPhone || "-"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date().toLocaleDateString("en-GB")}
                    </div>
                    <div>
                      <strong>Time:</strong>{" "}
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>

                <div className="border-t my-1"></div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px", // 🔥 smaller text
                    lineHeight: "1.2", // 🔥 tighter rows
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "6%",
                          padding: "2px 4px",
                          textAlign: "left",
                        }}
                      >
                        No.
                      </th>
                      <th
                        style={{
                          width: "44%",
                          padding: "2px 4px",
                          textAlign: "left",
                        }}
                      >
                        Item
                      </th>
                      <th
                        style={{
                          width: "10%",
                          padding: "2px 4px",
                          textAlign: "center",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          width: "20%",
                          padding: "2px 4px",
                          textAlign: "right",
                        }}
                      >
                        Price
                      </th>
                      <th
                        style={{
                          width: "20%",
                          padding: "2px 4px",
                          textAlign: "right",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {orderDetails?.items?.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: "2px 4px" }}>{index + 1}</td>
                        <td style={{ padding: "2px 4px" }}>
                          {item?.Item_Name ?? "-"}
                        </td>
                        <td style={{ padding: "2px 4px", textAlign: "center" }}>
                          {item?.Item_Quantity ?? 1}
                        </td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>
                          ₹{Number(item?.Item_Price ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>
                          ₹{Number(item?.Amount ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* SUMMARY TABLE */}
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px", // 🔥 smaller text
                    lineHeight: "1.2", // 🔥 tighter rows
                  }}
                >
                  <tbody>
                    <tr style={{ borderTop: "1px solid #000" }}>
                      <td style={{ padding: "2px 4px" }}>
                        <strong>Subtotal</strong>
                      </td>
                      {/* <td style={{ padding: "2px 4px" }} className="text-bold">Subtotal</td> */}
                      <td style={{ padding: "2px 4px", textAlign: "right" }}>
                        <strong>
                          ₹{Number(invoiceDetails.Sub_Total || 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>

                    {Number(invoiceDetails.Service_Charge) > 0 && (
                      <tr>
                        <td style={{ padding: "2px 4px" }}>Dine-In Charge</td>

                        <td style={{ padding: "2px 4px", textAlign: "right" }}>
                          {invoiceDetails.Service_Charge_Type ===
                          "percentage" ? (
                            <>
                              <span style={{ marginRight: "6px" }}>
                                {invoiceDetails.Service_Charge}%
                              </span>
                              <span>₹{getServiceAmount().toFixed(2)}</span>
                            </>
                          ) : (
                            `₹${Number(invoiceDetails.Service_Charge).toFixed(2)}`
                          )}
                        </td>
                      </tr>
                    )}

                    {Number(invoiceDetails.Discount) > 0 && (
                      <tr>
                        <td style={{ padding: "2px 4px" }}>Discount</td>

                        <td style={{ padding: "2px 4px", textAlign: "right" }}>
                          {invoiceDetails.Discount_Type === "percentage" ? (
                            <>
                              <span style={{ marginRight: "6px" }}>
                                {invoiceDetails.Discount}%
                              </span>
                              <span>₹{getDiscountAmount().toFixed(2)}</span>
                            </>
                          ) : (
                            `₹${Number(invoiceDetails.Discount).toFixed(2)}`
                          )}
                        </td>
                      </tr>
                    )}
                    {/* getCouponDiscountAmount */}
                    {invoiceDetails?.Coupon_Code && (
                      <tr>
                        <td style={{ padding: "2px 4px" }}>Coupon Discount</td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>
                          {invoiceDetails.Coupon_Discount_Type === "PERCENT" ? (
                            <>
                              <span style={{ marginRight: "6px" }}>
                                {invoiceDetails.Coupon_Discount_Value}%
                              </span>
                              <span>
                                ₹{getCouponDiscountAmount().toFixed(2)}
                              </span>
                            </>
                          ) : (
                            `₹${Number(invoiceDetails.Coupon_Discount_Value).toFixed(2)}`
                          )}
                        </td>
                      </tr>
                    )}

                    <tr style={{ borderTop: "1px solid #000" }}>
                      <td
                        style={{
                          padding: "4px 4px",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          padding: "4px 4px",
                          fontWeight: "bold",
                          fontSize: "13px",
                          textAlign: "right",
                        }}
                      >
                        ₹{Number(calculateGrandTotal()).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t my-1"></div>

                {/* BUTTONS */}
              </div>
              <div className="relative flex w-full mt-4 fixed bottom-0  gap-4 mb-2">
                <button
                  type="button"
                  disabled={isConfirmingBillAndInvoiceGeneratedLoading}
                  onClick={handleConfirmBillAndGenerateInvoice}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  {isConfirmingBillAndInvoiceGeneratedLoading
                    ? "Generating..."
                    : "Print Bill"}
                </button>
                <button
                  type="button"
                  disabled={isGenerateSmsLoading}
                  onClick={() => handleShareSMS()}
                  className="absolute right-0 top-0 px-4 py-2 bg-green-600 text-white 
                       rounded-lg shadow hover:bg-green-700 transition"
                >
                  {isGenerateSmsLoading ? "Sharing..." : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
