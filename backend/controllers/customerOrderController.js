import crypto from "crypto";
import {io} from "../app.js"
import db from "../config/db.js";

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// same "insert, then fill formatted id" pattern you use everywhere
async function insertWithCode(connection, sql, params, table, codeCol, prefix) {
  const [r] = await connection.execute(sql, params);
  const code = prefix + String(r.insertId).padStart(5, "0");
  await connection.execute(`UPDATE ${table} SET ${codeCol} = ? WHERE id = ?`, [code, r.insertId]);
  return code;
}

/* ============ 1. QR scan -> find or create the OPEN session ============ */

// const scanTable = async (req, res, next) => {
//   let connection;

//   try {
//       const { deviceId } = req.body;

//     if (!deviceId || typeof deviceId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid device.",
//       });
//     }
//     connection = await db.getConnection();
//     await connection.beginTransaction();
// const [[blockedDevice]] = await connection.execute(
//   `SELECT Blocked_Until FROM customer_device_blocks
//    WHERE Device_Id = ? AND Blocked_Until > NOW() LIMIT 1`,
//   [deviceId]
// );
// if (blockedDevice) {
//   await connection.rollback();
//   return res.status(403).json({
//     success: false,
//     reason: "DEVICE_BLOCKED",
//     message: "This device is temporarily blocked from ordering. Please ask restaurant staff for assistance.",
//   });
// }
//     // Lock the table row so two simultaneous scans
//     // cannot create two sessions.
//     const [[table]] = await connection.execute(
//       `SELECT Table_Id, Table_Name
//        FROM add_table
//        WHERE Qr_Slug = ?
//        FOR UPDATE`,
//       [req.params.qr_slug]
//     );

//     if (!table) {
//       await connection.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Invalid QR code",
//       });
//     }

//     // Get the latest session for this table,
//     // regardless of its status.
//     let [[session]] = await connection.execute(
//       `SELECT
//          id,
//          Token,
//          Order_Id,
//          Status,
//          TIMESTAMPDIFF(MINUTE, Last_Activity_At, NOW()) AS idle_min,
//          TIMESTAMPDIFF(SECOND, Closed_At, NOW()) AS closed_seconds
//        FROM table_sessions
//        WHERE Table_Id = ?
//        ORDER BY id DESC
//        LIMIT 1
//        FOR UPDATE`,
//       [table.Table_Id]
//     );

//     // =====================================================
//     // 1. OLD OPEN SESSION WITH NO ORDER
//     // =====================================================

//     // Customer scanned QR but never placed an order.
//     // If inactive for more than 2 hours, expire it.
//     if (
//       session &&
//       session.Status === "OPEN" &&
//       !session.Order_Id &&
//       session.idle_min > 120
//     ) {
//       await connection.execute(
//         `UPDATE table_sessions
//          SET Status = 'EXPIRED',
//              Closed_At = NOW()
//          WHERE id = ?`,
//         [session.id]
//       );

//       session = null;
//     }

//     // =====================================================
//     // 2. RECENTLY COMPLETED SESSION
//     // =====================================================

//     // Prevent immediate creation of a new session
//     // after payment.
//     if (
//       session &&
//       session.Status === "PAID" &&
//       session.closed_seconds !== null &&
//       session.closed_seconds < 60
//     ) {
//       await connection.rollback();

//       return res.status(409).json({
//         success: false,
//          message: "Please wait a moment. The table is being reset for the next order.",
//       });
//     }
//     if (
//   session &&
//   session.Status === "REJECTED" &&
//   session.closed_seconds !== null &&
//   session.closed_seconds < 60
// ) {
//   await connection.rollback();
//   return res.status(409).json({
//     success: false,
//     message: "This table needs staff assistance. Please ask a staff member to help you.",
//   });
// }

//     // =====================================================
//     // 3. USE EXISTING OPEN SESSION
//     // =====================================================

//     let token;

//     if (session && session.Status === "OPEN") {
//       token = session.Token;

//       await connection.execute(
//         `UPDATE table_sessions
//          SET Last_Activity_At = NOW()
//          WHERE id = ?`,
//         [session.id]
//       );
//     }

//     // =====================================================
//     // 4. NO USABLE SESSION → CREATE NEW SESSION
//     // =====================================================

//     else {
//       token = crypto.randomBytes(16).toString("hex");

//       await connection.execute(
//         `INSERT INTO table_sessions
//          (Table_Id, Token)
//          VALUES (?, ?)`,
//         [table.Table_Id, token]
//       );
//     }

//     await connection.commit();

//     res.json({
//       success: true,
//       token,
//       Table_Name: table.Table_Name,
//     });

//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//     }

//     next(err);
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };
const scanTable = async (req, res, next) => {
  let connection;

  try {
    const { deviceId } = req.body;
    console.log("📱 SCAN DEVICE ID:", deviceId);
console.log("📱 SCAN BODY:", req.body);


    if (!deviceId || typeof deviceId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid device.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =====================================================
    // 0. CHECK DEVICE BLOCK
    // =====================================================

    const [[blockedDevice]] = await connection.execute(
      `SELECT Blocked_Until
       FROM customer_device_blocks
       WHERE Device_Id = ?
       LIMIT 1
       FOR UPDATE`,
      [deviceId]
    );

    if (
      blockedDevice &&
      new Date(blockedDevice.Blocked_Until) > new Date()
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        reason: "DEVICE_BLOCKED",
        message:
          "This device is temporarily blocked from ordering. Please ask restaurant staff for assistance.",
      });
    }

    // =====================================================
    // LOCK TABLE
    // =====================================================

    const [[table]] = await connection.execute(
      `SELECT Table_Id, Table_Name
       FROM add_table
       WHERE Qr_Slug = ?
       FOR UPDATE`,
      [req.params.qr_slug]
    );

    if (!table) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // =====================================================
    // GET LATEST SESSION
    // =====================================================

    let [[session]] = await connection.execute(
      `SELECT
         id,
         Token,
         Order_Id,
         Status,
         TIMESTAMPDIFF(MINUTE, Last_Activity_At, NOW()) AS idle_min,
         TIMESTAMPDIFF(SECOND, Closed_At, NOW()) AS closed_seconds
       FROM table_sessions
       WHERE Table_Id = ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [table.Table_Id]
    );

    // =====================================================
    // 1. OLD OPEN SESSION WITH NO ORDER
    // =====================================================

    if (
      session &&
      session.Status === "OPEN" &&
      !session.Order_Id &&
      session.idle_min > 120
    ) {
      await connection.execute(
        `UPDATE table_sessions
         SET Status = 'EXPIRED',
             Closed_At = NOW()
         WHERE id = ?`,
        [session.id]
      );

      session = null;
    }

    // =====================================================
    // 2. RECENTLY COMPLETED SESSION
    // =====================================================

    if (
      session &&
      session.Status === "PAID" &&
      session.closed_seconds !== null &&
      session.closed_seconds < 60
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Please wait a moment. The table is being reset for the next order.",
      });
    }

    // =====================================================
    // 3. RECENTLY REJECTED SESSION
    // =====================================================

    if (
      session &&
      session.Status === "REJECTED" &&
      session.closed_seconds !== null &&
      session.closed_seconds < 60
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "This table needs staff assistance. Please ask a staff member to help you.",
      });
    }

    // =====================================================
    // 4. USE EXISTING OPEN SESSION
    // =====================================================

    let token;

    if (session && session.Status === "OPEN") {
      token = session.Token;

      await connection.execute(
        `UPDATE table_sessions
         SET Last_Activity_At = NOW()
         WHERE id = ?`,
        [session.id]
      );
    }

    // =====================================================
    // 5. CREATE NEW SESSION
    // =====================================================

    else {
      token = crypto.randomBytes(16).toString("hex");

      await connection.execute(
        `INSERT INTO table_sessions
         (Table_Id, Token, Device_Id)
         VALUES (?, ?, ?)`,
        [table.Table_Id, token, deviceId]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      token,
      Table_Name: table.Table_Name,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/* ============ 2. Current session: table, items, total ============ */

const getSession = async (req, res, next) => {
  try {
    const [[s]] = await db.execute(
      `SELECT ts.Status, ts.Order_Id, t.Table_Name
       FROM table_sessions ts
       JOIN add_table t ON t.Table_Id = ts.Table_Id
       WHERE ts.Token = ? LIMIT 1`,
      [req.params.token]
    );
    if (!s) return res.status(404).json({ success: false, message: "Invalid link" });
    // if (s.Status !== "OPEN") {
    //   return res.status(410).json({
    //     success: false,
    //     message: "Order completed. Scan the QR on your table to order again.",
    //   });
    // }
    if (s.Status !== "OPEN") {
  const rejected = s.Status === "REJECTED";
  return res.status(410).json({
    success: false,
    reason: rejected ? "REJECTED" : "COMPLETED",
    message: rejected
      ? "Your order was cancelled by the restaurant. Please speak to a staff member."
      : "Order completed. Scan the QR on your table to order again.",
  });
}

    let items = [];
    let total = 0;
    if (s.Order_Id) {
      [items] = await db.execute(
        `SELECT oi.Item_Id, fi.Item_Name, oi.Quantity, oi.Price, oi.Amount
         FROM order_items oi
         JOIN add_food_item fi ON fi.Item_Id = oi.Item_Id
         WHERE oi.Order_Id = ?
         ORDER BY oi.id`,
        [s.Order_Id]
      );
      total = items.reduce((sum, i) => sum + Number(i.Amount), 0);
    }

    res.json({ success: true, Table_Name: s.Table_Name, items, total });
  } catch (err) {
    next(err);
  }
};

/* ============ 3. Place an order (first one or "add more") ============ */

const placeCustomerOrder = async (req, res, next) => {
  let connection;
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return res.status(400).json({ success: false, message: "Invalid items" });
    }
    for (const i of items) {
      if (!i.Item_Id || !Number.isInteger(i.Quantity) || i.Quantity < 1 || i.Quantity > 20) {
        return res.status(400).json({ success: false, message: "Invalid item or quantity" });
      }
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // lock the session row: two phones ordering at once are processed one by one
    const [[session]] = await connection.execute(
      `SELECT id, Table_Id, Status, Order_Id FROM table_sessions WHERE Token = ? FOR UPDATE`,
      [req.params.token]
    );
    if (!session) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Invalid link" });
    }
    if (session.Status !== "OPEN") {
      await connection.rollback();
      return res.status(410).json({
        success: false,
        message: "Order completed. Scan the QR on your table to order again.",
      });
    }

    // prices come from the DB, never from the browser
    const [dbItems] = await connection.query(
      `SELECT Item_Id, Item_Name, Item_Price, Item_Category
       FROM add_food_item WHERE Item_Id IN (?)`,
      [items.map((i) => i.Item_Id)]
    );
    const byId = Object.fromEntries(dbItems.map((d) => [d.Item_Id, d]));

    const lines = [];
    for (const i of items) {
      const d = byId[i.Item_Id];
      if (!d) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Item not available" });
      }
      const price = Number(d.Item_Price);
      lines.push({ ...d, Quantity: i.Quantity, Price: price, Amount: price * i.Quantity });
    }

    /* ---- find or create the order ---- */
    // let Order_Id = session.Order_Id;
    // const isAddition = !!Order_Id;
    let Order_Id = session.Order_Id;
const isAddition = !!Order_Id;
let tableBecameOccupied = false;

    if (!Order_Id) {
      // staff may already have an unpaid order on this table: join it
      const [[existing]] = await connection.execute(
        `SELECT o.Order_Id
         FROM order_tables ot
         JOIN orders o ON o.Order_Id = ot.Order_Id
         WHERE ot.Table_Id = ? AND o.Payment_Status = 'pending'
         ORDER BY o.id DESC LIMIT 1`,
        [session.Table_Id]
      );

      if (existing) {
        Order_Id = existing.Order_Id;
      } else {
        Order_Id = await insertWithCode(
          connection,
          `INSERT INTO orders (User_Id, Customer_Id, Status, Sub_Total, Discount, Amount, Payment_Status)
           VALUES (NULL, NULL, 'hold', 0, 0, 0, 'pending')`,
          [], "orders", "Order_Id", "ODR"
        );
        await insertWithCode(
          connection,
          `INSERT INTO order_tables (Order_Id, Table_Id) VALUES (?, ?)`,
          [Order_Id, session.Table_Id], "order_tables", "Order_Table_Id", "OTB"
        );
        await connection.execute(
          `UPDATE add_table SET Status='occupied', Start_Time=NOW() WHERE Table_Id = ?`,
          [session.Table_Id]
        );
      }
      await connection.execute(
        `UPDATE table_sessions SET Order_Id = ? WHERE id = ?`,
        [Order_Id, session.id]
      );
      tableBecameOccupied = true;
    }

    /* ---- one KOT per order: reuse it, or create it on the first round ---- */
    const [[existingKot]] = await connection.execute(
      `SELECT KOT_Id FROM kitchen_orders WHERE Order_Id = ? ORDER BY id LIMIT 1 FOR UPDATE`,
      [Order_Id]
    );

    let KOT_Id;
    if (existingKot) {
      KOT_Id = existingKot.KOT_Id;
      // new items arrived, so the KOT is active again
      await connection.execute(
        `UPDATE kitchen_orders SET Status = 'pending', updated_at = NOW() WHERE KOT_Id = ?`,
        [KOT_Id]
      );
    } else {
      KOT_Id = await insertWithCode(
        connection,
        `INSERT INTO kitchen_orders (Order_Id, Status) VALUES (?, 'pending')`,
        [Order_Id], "kitchen_orders", "KOT_Id", "KOT"
      );
    }

    const stockDate = today();
    const kotItems = [];
    let addedTotal = 0;

    for (const l of lines) {
      /* ---- bill line: one row per item, quantity grows with each round ---- */
      const [[line]] = await connection.execute(
        `SELECT id, Quantity, Price FROM order_items
         WHERE Order_Id = ? AND Item_Id = ? LIMIT 1 FOR UPDATE`,
        [Order_Id, l.Item_Id]
      );

      if (line) {
        const newQty = Number(line.Quantity) + l.Quantity;
        await connection.execute(
          `UPDATE order_items SET Quantity = ?, Amount = ? WHERE id = ?`,
          [newQty, Number(line.Price) * newQty, line.id]
        );
        addedTotal += Number(line.Price) * l.Quantity;
      } else {
        await insertWithCode(
          connection,
          `INSERT INTO order_items (Order_Id, Item_Id, Quantity, Price, Amount) VALUES (?, ?, ?, ?, ?)`,
          [Order_Id, l.Item_Id, l.Quantity, l.Price, l.Amount],
          "order_items", "Order_Item_Id", "ODRITM"
        );
        addedTotal += l.Amount;
      }

      /* ---- kitchen row: always new, so the kitchen sees what is new ---- */
      const KOT_Item_Id = await insertWithCode(
        connection,
        `INSERT INTO kitchen_order_items (KOT_Id, Item_Id, Item_Name, Quantity, Item_Status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [KOT_Id, l.Item_Id, l.Item_Name, l.Quantity],
        "kitchen_order_items", "KOT_Item_Id", "KOTITM"
      );

      kotItems.push({
        KOT_Item_Id, Item_Id: l.Item_Id, Item_Name: l.Item_Name,
        Quantity: l.Quantity, Item_Status: "pending", Item_Category: l.Item_Category,
      });

      /* ---- stock, same as your staff flow ---- */
      await connection.execute(
        `INSERT INTO daily_food_stock
           (Item_Id, Stock_Date, Opening_Quantity, Added_Quantity, Sold_Quantity, Closing_Quantity)
         VALUES (?, ?, 0, 0, 0, 0)
         ON DUPLICATE KEY UPDATE Stock_Date = daily_food_stock.Stock_Date`,
        [l.Item_Id, stockDate]
      );
      await connection.execute(
        `UPDATE daily_food_stock
         SET Sold_Quantity = Sold_Quantity + ?, Closing_Quantity = Closing_Quantity - ?
         WHERE Item_Id = ? AND Stock_Date = ?`,
        [l.Quantity, l.Quantity, l.Item_Id, stockDate]
      );
      await connection.execute(
        `INSERT INTO food_stock_movements
           (Item_Id, Stock_Date, Movement_Type, Quantity, Ref_Id, User_Id)
         VALUES (?, ?, 'DINE_IN', ?, ?, NULL)`,
        [l.Item_Id, stockDate, l.Quantity, Order_Id]
      );
    }

    await connection.execute(
      `UPDATE orders SET Sub_Total = Sub_Total + ?, Amount = Amount + ? WHERE Order_Id = ?`,
      [addedTotal, addedTotal, Order_Id]
    );
    await connection.execute(
      `UPDATE table_sessions SET Last_Activity_At = NOW() WHERE id = ?`,
      [session.id]
    );

    const [[tbl]] = await connection.execute(
      `SELECT Table_Name FROM add_table WHERE Table_Id = ?`,
      [session.Table_Id]
    );

    await connection.commit();
 if (tableBecameOccupied) {
  io.to("all_waiters").emit("tables_occupied", {
    Order_Id,
    Table_Ids: [session.Table_Id],
    Table_Names: [tbl.Table_Name],
  });
}

    /* ---- instant notifications (after commit) ---- */
    const byCategory = {};
    kotItems.forEach((it) => (byCategory[it.Item_Category] ||= []).push(it));

    // kitchen: same event your staff orders already use
    Object.entries(byCategory).forEach(([category, catItems]) => {
      io.to(`category_${category}`).emit("new_kitchen_order", {
        KOT_Id, Order_Id, Order_Type: "dinein", Status: "pending",
        Table_Names: [tbl.Table_Name], Source: "customer", items: catItems,
      });
    });
// console.log("📢 About to emit customer_order");

// console.log(
//   "Staff room size:",
//   io.sockets.adapter.rooms.get("staff")?.size || 0
// );
    // waiter / cashier panel
    io.to("staff").emit("customer_order", {
      Table_Name: tbl.Table_Name, Order_Id, KOT_Id,
      Is_Addition: isAddition, items: kotItems, Added_Total: addedTotal,
      at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, Order_Id, KOT_Id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Customer order error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
/* ============ 4. Called from your EXISTING payment / free-table code ============ */
// const closeTableSessions = async (connection, tableIds) => {
//   if (!tableIds?.length) return;
//   await connection.query(
//     `UPDATE table_sessions SET Status='PAID', Closed_At=NOW()
//      WHERE Table_Id IN (?) AND Status='OPEN'`,
//     [tableIds]
//   );
// };
const closeSessionsForOrder = async (connection, Order_Id) => {
  await connection.execute(
    `UPDATE table_sessions
     SET Status = 'PAID', Closed_At = NOW()
     WHERE Order_Id = ? AND Status = 'OPEN'`,
    [Order_Id]
  );
};
export { scanTable, getSession, placeCustomerOrder, closeSessionsForOrder };




// const scanTable = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // lock the table row so two simultaneous scans can't create two sessions
//     const [[table]] = await connection.execute(
//       `SELECT Table_Id, Table_Name FROM add_table WHERE Qr_Slug = ? FOR UPDATE`,
//       [req.params.qr_slug]
//     );
//     if (!table) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Invalid QR code" });
//     }

//     let [[session]] = await connection.execute(
//       `SELECT id, Token, Order_Id,
//               TIMESTAMPDIFF(MINUTE, Last_Activity_At, NOW()) AS idle_min
//        FROM table_sessions
//        WHERE Table_Id = ? AND Status = 'OPEN' LIMIT 1`,
//       [table.Table_Id]
//     );

//     // scanned but never ordered, and idle for 2h -> recycle it
//     if (session && !session.Order_Id && session.idle_min > 120) {
//       await connection.execute(
//         `UPDATE table_sessions SET Status='EXPIRED', Closed_At=NOW() WHERE id=?`,
//         [session.id]
//       );
//       session = null;
//     }

//     let token;
//     if (session) {
//       token = session.Token;
//       await connection.execute(
//         `UPDATE table_sessions SET Last_Activity_At = NOW() WHERE id = ?`,
//         [session.id]
//       );
//     } else {
//       token = crypto.randomBytes(16).toString("hex");
//       await connection.execute(
//         `INSERT INTO table_sessions (Table_Id, Token) VALUES (?, ?)`,
//         [table.Table_Id, token]
//       );
//     }

//     await connection.commit();
//     res.json({ success: true, token, Table_Name: table.Table_Name });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const placeCustomerOrder = async (req, res, next) => {
//   let connection;
//   try {
//     const { items } = req.body;

//     if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
//       return res.status(400).json({ success: false, message: "Invalid items" });
//     }
//     for (const i of items) {
//       if (!i.Item_Id || !Number.isInteger(i.Quantity) || i.Quantity < 1 || i.Quantity > 20) {
//         return res.status(400).json({ success: false, message: "Invalid item or quantity" });
//       }
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // lock the session row: two phones ordering at once are processed one by one
//     const [[session]] = await connection.execute(
//       `SELECT id, Table_Id, Status, Order_Id FROM table_sessions WHERE Token = ? FOR UPDATE`,
//       [req.params.token]
//     );
//     if (!session) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Invalid link" });
//     }
//     if (session.Status !== "OPEN") {
//       await connection.rollback();
//       return res.status(410).json({
//         success: false,
//         message: "Order completed. Scan the QR on your table to order again.",
//       });
//     }

//     // prices come from the DB, never from the browser
//     const [dbItems] = await connection.query(
//       `SELECT Item_Id, Item_Name, Item_Price, Item_Category
//        FROM add_food_item WHERE Item_Id IN (?)`,
//       [items.map((i) => i.Item_Id)]
//     );
//     const byId = Object.fromEntries(dbItems.map((d) => [d.Item_Id, d]));

//     const lines = [];
//     for (const i of items) {
//       const d = byId[i.Item_Id];
//       if (!d) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: "Item not available" });
//       }
//       const price = Number(d.Item_Price);
//       lines.push({ ...d, Quantity: i.Quantity, Price: price, Amount: price * i.Quantity });
//     }
//     const addedTotal = lines.reduce((s, l) => s + l.Amount, 0);

//     /* ---- find or create the order ---- */
//     let Order_Id = session.Order_Id;
//     const isAddition = !!Order_Id;

//     if (!Order_Id) {
//       // staff may already have an unpaid order on this table: join it
//       const [[existing]] = await connection.execute(
//         `SELECT o.Order_Id
//          FROM order_tables ot
//          JOIN orders o ON o.Order_Id = ot.Order_Id
//          WHERE ot.Table_Id = ? AND o.Payment_Status = 'pending'
//          ORDER BY o.id DESC LIMIT 1`,
//         [session.Table_Id]
//       );

//       if (existing) {
//         Order_Id = existing.Order_Id;
//       } else {
//         Order_Id = await insertWithCode(
//           connection,
//           `INSERT INTO orders (User_Id, Customer_Id, Status, Sub_Total, Discount, Amount, Payment_Status)
//            VALUES (NULL, NULL, 'hold', 0, 0, 0, 'pending')`,
//           [], "orders", "Order_Id", "ODR"
//         );
//         await insertWithCode(
//           connection,
//           `INSERT INTO order_tables (Order_Id, Table_Id) VALUES (?, ?)`,
//           [Order_Id, session.Table_Id], "order_tables", "Order_Table_Id", "OTB"
//         );
//         await connection.execute(
//           `UPDATE add_table SET Status='occupied', Start_Time=NOW() WHERE Table_Id = ?`,
//           [session.Table_Id]
//         );
//       }
//       await connection.execute(`UPDATE table_sessions SET Order_Id = ? WHERE id = ?`, [Order_Id, session.id]);
//     }

//     /* ---- new KOT for these items only ---- */
//     // const KOT_Id = await insertWithCode(
//     //   connection,
//     //   `INSERT INTO kitchen_orders (Order_Id, Status) VALUES (?, 'pending')`,
//     //   [Order_Id], "kitchen_orders", "KOT_Id", "KOT"
//     // );
//     /* ---- one KOT per order: reuse it, or create it on the first round ---- */
// const [[existingKot]] = await connection.execute(
//   `SELECT KOT_Id FROM kitchen_orders WHERE Order_Id = ? ORDER BY id LIMIT 1 FOR UPDATE`,
//   [Order_Id]
// );

// let KOT_Id;
// if (existingKot) {
//   KOT_Id = existingKot.KOT_Id;
//   // new items arrived, so the KOT is active again
//   await connection.execute(
//     `UPDATE kitchen_orders SET Status = 'pending', updated_at = NOW() WHERE KOT_Id = ?`,
//     [KOT_Id]
//   );
// } else {
//   KOT_Id = await insertWithCode(
//     connection,
//     `INSERT INTO kitchen_orders (Order_Id, Status) VALUES (?, 'pending')`,
//     [Order_Id], "kitchen_orders", "KOT_Id", "KOT"
//   );
// }

//     const stockDate = today();
//     const kotItems = [];

//     for (const l of lines) {
//       await insertWithCode(
//         connection,
//         `INSERT INTO order_items (Order_Id, Item_Id, Quantity, Price, Amount) VALUES (?, ?, ?, ?, ?)`,
//         [Order_Id, l.Item_Id, l.Quantity, l.Price, l.Amount],
//         "order_items", "Order_Item_Id", "ODRITM"
//       );

//       const KOT_Item_Id = await insertWithCode(
//         connection,
//         `INSERT INTO kitchen_order_items (KOT_Id, Item_Id, Item_Name, Quantity, Item_Status)
//          VALUES (?, ?, ?, ?, 'pending')`,
//         [KOT_Id, l.Item_Id, l.Item_Name, l.Quantity],
//         "kitchen_order_items", "KOT_Item_Id", "KOTITM"
//       );

//       kotItems.push({
//         KOT_Item_Id, Item_Id: l.Item_Id, Item_Name: l.Item_Name,
//         Quantity: l.Quantity, Item_Status: "pending", Item_Category: l.Item_Category,
//       });

//       // same stock logic as your staff addOrder
//       await connection.execute(
//         `INSERT INTO daily_food_stock
//            (Item_Id, Stock_Date, Opening_Quantity, Added_Quantity, Sold_Quantity, Closing_Quantity)
//          VALUES (?, ?, 0, 0, 0, 0)
//          ON DUPLICATE KEY UPDATE Stock_Date = daily_food_stock.Stock_Date`,
//         [l.Item_Id, stockDate]
//       );
//       await connection.execute(
//         `UPDATE daily_food_stock
//          SET Sold_Quantity = Sold_Quantity + ?, Closing_Quantity = Closing_Quantity - ?
//          WHERE Item_Id = ? AND Stock_Date = ?`,
//         [l.Quantity, l.Quantity, l.Item_Id, stockDate]
//       );
//       await connection.execute(
//         `INSERT INTO food_stock_movements
//            (Item_Id, Stock_Date, Movement_Type, Quantity, Ref_Id, User_Id)
//          VALUES (?, ?, 'DINE_IN', ?, ?, NULL)`,
//         [l.Item_Id, stockDate, l.Quantity, Order_Id]
//       );
//     }

//     await connection.execute(
//       `UPDATE orders SET Sub_Total = Sub_Total + ?, Amount = Amount + ? WHERE Order_Id = ?`,
//       [addedTotal, addedTotal, Order_Id]
//     );
//     await connection.execute(
//       `UPDATE table_sessions SET Last_Activity_At = NOW() WHERE id = ?`,
//       [session.id]
//     );

//     const [[tbl]] = await connection.execute(
//       `SELECT Table_Name FROM add_table WHERE Table_Id = ?`,
//       [session.Table_Id]
//     );

//     await connection.commit();

//     /* ---- instant notifications (after commit) ---- */
//     const byCategory = {};
//     kotItems.forEach((it) => (byCategory[it.Item_Category] ||= []).push(it));

//     // kitchen: same event your staff orders already use
//     Object.entries(byCategory).forEach(([category, catItems]) => {
//       io.to(`category_${category}`).emit("new_kitchen_order", {
//         KOT_Id, Order_Id, Order_Type: "dinein", Status: "pending",
//         Table_Names: [tbl.Table_Name], Source: "customer", items: catItems,
//       });
//     });

//     // waiter / cashier panel
//     io.to("staff").emit("customer_order", {
//       Table_Name: tbl.Table_Name, Order_Id, KOT_Id,
//       Is_Addition: isAddition, items: kotItems, Added_Total: addedTotal,
//       at: new Date().toISOString(),
//     });

//     res.status(201).json({ success: true, Order_Id, KOT_Id });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Customer order error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };