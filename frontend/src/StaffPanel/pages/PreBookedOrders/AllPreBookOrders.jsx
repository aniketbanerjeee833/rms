
import { useEffect, useState } from 'react';
import { Clock, Armchair, CalendarDays, Filter, X, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


// import { useDispatch } from 'react-redux';

import { useCancelPreBookOrderMutation, useGetAllPreBookingOrdersQuery, useLazyGetPreBookOrderItemsForKOTQuery, useStartPreBookOrderMutation }
  from '../../../redux/api/Staff/orderApi';






// import { useTotalPreBookOrdersEachDayQuery } from '../../redux/api/Staff/orderApi';
import { toast } from 'react-toastify';

// const socket = io("", {
//   transports: ["websocket"],
// });

export default function AllPreBookOrders() {
  //   const formatTime = (time) => {
  //   if (!time) return "--";
  //   const d = new Date(time);
  //   d.setSeconds(0);
  //   return d.toLocaleTimeString([], {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };
    const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const getElapsedTime = (startTime) => {
    if (!startTime) return "00:00:00";

    const start = new Date(startTime);
    const diff = Math.max(
      0,
      Math.floor((currentTime.getTime() - start.getTime()) / 1000)
    );

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };
  const [printingOrderId, setPrintingOrderId] = useState(null);

  const navigate = useNavigate()
  //const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  //   const [tables, setTables] = useState([]);
  //const [currentTime, setCurrentTime] = useState(new Date());
  //const [kotNotifications, setKotNotifications] = useState({});

  // const [kotNotifications, setKotNotifications] = useState([]);
  //const { data: tableHavingOrders} = useGetTablesHavingOrdersQuery();
  const { data: preBookedOrdersData } = useGetAllPreBookingOrdersQuery();
  console.log("PreBooked Orders Data:", preBookedOrdersData);
  const [cancelPreBookOrder, { isLoading: isCancelling }] = useCancelPreBookOrderMutation();
  //const[takeawayCancelOrder,{isLoading:isTakeawayCancelOrderLoading}]=useCancelTakeawayOrderMutation();
  // const[takeawayCompleteOrder,{isLoading:isTakeawayCompleteOrderLoading}]=useCompleteTakeawayOrderMutation();
  // const[getPreBookItemsForKOT,{isLoading:isGetPreBookItemsForKOTLoading}]=useGetPreBookOrderItemsForKOTQuery();

  const [startPreBookOrder, { isLoading: isStartingOrder }] =
    useStartPreBookOrderMutation();


 


  const isBookingTimeReached = (booking) => {
    if (!booking?.Booking_Date || !booking?.Booking_Time) {
      return false;
    }

    const rawDate = String(booking.Booking_Date).trim();
    const rawTime = String(booking.Booking_Time).trim();

    let year, month, day;

    // Supports YYYY-MM-DD and DD-MM-YYYY
    let match = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (match) {
      [, year, month, day] = match;
    } else {
      match = rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

      if (!match) return false;

      [, day, month, year] = match;
    }

    // Supports 12:48 PM, 12:48:00 PM, and 24-hour times
    match = rawTime.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
    );

    if (!match) return false;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || 0);
    const period = match[4]?.toUpperCase();

    if (period) {
      if (hours < 1 || hours > 12) return false;
      if (period === "AM" && hours === 12) hours = 0;
      if (period === "PM" && hours !== 12) hours += 12;
    }

    const bookingDateTime = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      hours,
      minutes,
      seconds
    );

    if (
      bookingDateTime.getFullYear() !== Number(year) ||
      bookingDateTime.getMonth() !== Number(month) - 1 ||
      bookingDateTime.getDate() !== Number(day)
    ) {
      return false;
    }

    return currentTime >= bookingDateTime;
  };


  const handleStartOrder = async (booking) => {
    try {
      await startPreBookOrder(
        booking.Pre_Booked_Order_Id
      ).unwrap();

      toast.success("Pre-book order started successfully.");
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to start pre-book order."
      );
    }
  };

  const [
    triggerGetPreBookItemsForKOT] = useLazyGetPreBookOrderItemsForKOTQuery();



  const preBookedOrders = preBookedOrdersData?.preBookedOrders || [];




  // console.log("Raw Tables Data:", rawTables, "Takeaway Tables Data:", takeawayTables);






  const filteredPreBookedOrders = preBookedOrders?.filter((order) => {
    if (!searchTerm) return true;

    const search = searchTerm.trim().toLowerCase();

    const orderId = order.Pre_Booked_Order_Id?.toLowerCase() || "";
    const customerName = order.Customer_Name?.toLowerCase() || "";
    const customerPhone = order.Customer_Phone || "";
    const amount = order.Amount || "";
    const date = order.Booking_Date || "";
    const time = order.Booking_Time || "";
    const advance = order.Advance_Payment || ""

    const itemMatch = order.items?.some(item =>
      item.Item_Name?.toLowerCase().includes(search)
    );

    return (
      orderId.includes(search) ||
      customerName.includes(search) ||
      customerPhone.includes(search) ||
      amount.includes(search) ||
      date.includes(search) ||
      time.includes(search) ||
      advance.includes(search) ||
      itemMatch
    );
  });
  console.log("Filtered PreBooked Orders:", filteredPreBookedOrders);


  const printPreBookKOT = (kitchens) => {
    const getCurrentDate = () =>
      new Date().toLocaleDateString("en-GB");

    const getCurrentTime = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const kitchenSections = Object.entries(kitchens)
      .map(([kitchenName, items], index) => `
    ${index > 0 ? `<div class="line"></div>` : ``}

    <div class="invoice-kitchen">
      <div class="header-center">
        <div class="brand">PRE ORDER</div>
        <div class="brand">${kitchenName}</div>
      </div>

      <div class="info-row date-time">
        <span><b>Date:</b> ${getCurrentDate()}</span>
        <span><b>Time:</b> ${getCurrentTime()}</span>
      </div>

      <div class="line-solid"></div>

   
         ${items?.length > 0 ? `
    <div class="items-header">
      <div class="col-no">No</div>
      <div class="item-name">ITEM</div>
      <div class="item-qty">QTY</div>
     
    </div>
    `
          : ``}

      ${items
          .map(
            (it, i) => `
          <div class="item-row">
            <div class="col-no">${i + 1}</div>
            <div class="item-name">${it.Item_Name}</div>
            <div class="item-qty">${it.Item_Quantity}</div>
          </div>
        `
          )
          .join("")}
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
<body>
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

  }
  const handlePreOrderPrintKOT = async (Pre_Booked_Order_Id) => {
    console.log("PRINT KOT FOR:", Pre_Booked_Order_Id);
    setPrintingOrderId(Pre_Booked_Order_Id);
    try {
      const res = await triggerGetPreBookItemsForKOT(
        Pre_Booked_Order_Id
      ).unwrap();

      console.log("KOT DATA:", res);


      const kitchens = res?.preBookedOrderItems || {};

      // ✅ CHECK: any kitchen has items?
      const hasItems = Object.values(kitchens).some(
        (items) => Array.isArray(items) && items.length > 0
      );

      if (!hasItems) {
        toast.error("No items available for KOT printing.");
        return;
      }

      // 🔥 PRINT ONLY WHEN ITEMS EXIST
      printPreBookKOT(kitchens);
      // printPreBookKOT(res?.preBookedOrderItems);

    } catch (err) {
      console.error("❌ KOT fetch error:", err);
    } finally {
      setPrintingOrderId(null);
    }
  };
  const formatBookingDate = (dateStr) => {
    if (!dateStr) return null;

    const [dd, mm, yyyy] = dateStr.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };



  const handleCancelPreBookOrder = async (order) => {
    const orderId = order.Pre_Booked_Order_Id;

    if (!window.confirm(`Are you sure you want to cancel booking ${orderId}?`)) {
      return;
    }

    try {
      const response = await cancelPreBookOrder(orderId).unwrap();

      toast.success(
        response?.message || "Pre-booked order cancelled successfully."
      );
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to cancel pre-booked order."
      );
    }
  };

  return (
    <>




      <div style={{ padding: "20px", width: "100%", }} className="box-inn-sp">

        <div className="inn-title w-full px-1 py-1">
          <div className="flex flex-col sm:flex-row justify-between 
                items-start sm:items-center w-full ">

            {/* LEFT HEADER */}
            <div className="w-full sm:w-auto">
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Pre Booked Orders</h4>
            </div>

            {/* RIGHT BUTTON SECTION */}
            {/* <div className="
      w-full sm:w-auto 
      flex 
      justify-start sm:justify-end 
      gap-4
    ">
                    

                   

                        
      <input
        type="text"
        placeholder="Search ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
    
                    <button
                      type="button"
                      onClick={() =>navigate("/staff/orders/add")}
                      className="text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "#ff0000" }}
                    >
                      Add Order
                    </button>
                  
                   
                  </div> */}
            <div
              className="
    w-full
    flex
    flex-col
    
    sm:flex-row
    sm:justify-end
    sm:items-center
    sm:w-1/2
    gap-3
  "
            >
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-1/2'
              />

              {/* Add Order Button */}
              <button
                type="button"
                onClick={() => navigate("/staff/pre-book-order/add-pre-booked-orders")}
                className="
    h-12
    px-4
    text-white
    font-bold
    rounded
    flex items-center justify-center
    whitespace-nowrap
  "
                style={{ backgroundColor: "#ff0000" }}
              >
                Add Pre Book Order
              </button>

            </div>


          </div>
        </div>

        <div style={{ height: "70vh" }}
          className="p-2 bg-gray-100">
          <div className="
    grid 
    grid-cols-1 
    sm:grid-cols-2 
    md:grid-cols-3 
    lg:grid-cols-4 
    gap-6
  ">


            {filteredPreBookedOrders?.length > 0 && filteredPreBookedOrders?.map((order) => {
              const today = new Date().toISOString().split("T")[0];
              const bookingDate = formatBookingDate(order?.Booking_Date);

              const isToday = bookingDate === today;
              // const today = new Date().toISOString().split("T")[0];
              // const isToday = order?.Booking_Date === today;
              return (
                // <div
                //   key={order?.Pre_Booked_Order_Id }
                //   className="bg-white rounded-lg p-4 shadow-md relative border"

                // >
                <div
                  key={order?.Pre_Booked_Order_Id}
                  style={{
                    border: isToday ? "2px solid #b91c1c" : "1px solid #e5e7eb", // red-800 / gray-200

                  }}
                  className="bg-white rounded-lg p-4  relative"
                >




                  {/* <div className=' flex gap-2 justify-end'>
    {order?.tables?.length>0 && 
    <div>
          <div className="text-sm text-gray-600">
            {order?.tables?.map((table) => table.Table_Name).join(", ")}
          </div>

           </div>
      }
     <div
      className={` px-3 py-1 bg-orange-500 text-xs font-bold text-white 
      `}
    >
      pending
    </div>
    </div> */}
                  <div className="flex gap-2 justify-end items-center">
                    {order?.tables?.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {order.tables.map((table) => table.Table_Name).join(", ")}
                      </div>
                    )}

                    {/* Order Type */}
                    <div className="px-3 py-1 bg-blue-600 text-xs font-bold text-white">
                      {(order?.Order_Type || "DINE_IN").toUpperCase().replace("-", "_")}
                    </div>

                    {/* Pending Status */}
                    {/* <div className="px-3 py-1 bg-orange-500 text-xs font-bold text-white rounded">
                      PENDING
                    </div> */}

                    <div
                      className={`px-3 py-1 text-xs font-bold text-white  ${String(order?.Status || "").
                        toLowerCase() === "hold"
                          ? "bg-orange-500"
                          : String(order?.Status || "").toLowerCase() === "completed"
                            ? "bg-green-600"
                            : "bg-orange-500"
                        }`}
                    >
                      {(order?.Status || "pending")}
                    </div>

                  </div>



                  <>

                    {/* <h5 className=" font-bold text-gray-800  sm:text-xl mb-1"> */}

                    {/* </h5> */}


                    {/* Timer */}

                    <div className=" pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm  text-teal-600">{order?.Booking_Date}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm  text-teal-600">{order?.Booking_Time}</span>
                    </div>

                    {/* Amount */}


                    {order?.Customer_Name && <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Customer Name:</span>
                      <span className="text-sm  text-teal-600">{order?.Customer_Name}</span>
                    </div>}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Customer Phone:</span>
                      <span className="text-sm  text-teal-600">{order?.Customer_Phone}</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm  text-teal-600">₹{order?.Amount}</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Advance:</span>
                      <span className="text-sm  text-teal-600">₹{order?.Advance_Payment}</span>
                    </div>

                    {/* KOT */}
                    <div className="flex justify-center items-center">
                      {/* <button
  type="button"
   disabled={!isToday || printingOrderId === order?.Pre_Booked_Order_Id}
  style={{
    backgroundColor: "#ffa600",
    opacity: isToday ? 1 : 0.4,          // 👈 fade when disabled
    cursor: isToday ? "pointer" : "not-allowed"
  }}
  onClick={() => handlePreOrderPrintKOT(order?.Pre_Booked_Order_Id)}
  className="text-white mt-2 font-bold py-2 px-4 rounded"
>
    {printingOrderId === order?.Pre_Booked_Order_Id
    ? "Printing..."
    : "Print KOT"}
  
</button> */}
                    </div>
                    {/* Timer */}
     

{String(order?.Status || "").toLowerCase() === "hold" && (
  <div className="flex items-center bg-gray-100 p-3 rounded-md mb-4">
    <Clock size={18} className="text-teal-600 mr-2" />
    <span className="font-mono font-bold text-lg text-gray-800">
      {getElapsedTime(
        order?.tables?.find((table) => table.Start_Time)?.Start_Time
      )}
    </span>
  </div>
)}

                    {/* View Details */}
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
                      <button
                        type="button"
                        style={{ backgroundColor: "#ff0000" }}
                        className="text-white font-bold py-2 px-4 rounded"
                        onClick={() =>
                          navigate(
                            `/staff/pre-book-order/update-pre-booked-order/${order?.Pre_Booked_Order_Id}`
                          )
                        }
                      >
                        View Details
                      </button>
                      {/* Start Order button: show only when booking time arrives */}


                    {String(order?.Status || "").toLowerCase() === "pending" &&
  String(order?.Order_Type || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-") === "dine-in" &&
  isBookingTimeReached(order) && (
    <button
      type="button"
      onClick={() => handleStartOrder(order)}
      disabled={isStartingOrder}
      className="px-3 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
    >
      {isStartingOrder ? "Starting..." : "Start Order"}
    </button>
  )}

                      {/* Show Started after the order is started */}
                      {/* {String(order?.Status || "").toLowerCase() === "hold" && (
                        <span className="px-3 py-2 rounded bg-blue-100 text-blue-800">
                          Started
                        </span>
                      )} */}

                      {/* Cancel Booking */}
                      {String(order?.Status || "").toLowerCase() === "pending" && (
                        <button
                          type="button"
                          disabled={isCancelling}
                          style={{ backgroundColor: "#6b7280" }} // gray-700
                          onClick={() => handleCancelPreBookOrder(order)}
                          className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                          {isCancelling ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>

                  </>





                </div>)
            })}




          </div>

          {/* No results */}
          {filteredPreBookedOrders?.length === 0 && (

            <div className="flex flex-col items-center justify-center w-full  text-center">
              <div className="bg-white rounded-full p-8 shadow-lg mb-6">
                <Armchair className="w-20 h-20 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                No  pre booked orders found
              </h2>
              <p className="text-gray-500">
                Waiting for new orders to arrive...
              </p>
              <div className="mt-6 flex gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}

        </div>

      </div>



    </>
  );
}


