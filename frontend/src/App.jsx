import { lazy, Suspense } from 'react';
import { Routes, Route, BrowserRouter, Navigate, useLocation, Outlet } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout/Layout';
import { useGetUserQuery } from './redux/api/userApi';
import Spinner from './components/Layout/Spinner';


// import 'bootstrap/dist/css/bootstrap.min.css';

// import AllDailyFoodStockDashboard from './pages/DailyFoodStock/AllDailyFoodStockDashboard';



// import PreBookOrders from './StaffPanel/pages/PreBookedOrders/PreBookOrders';
// import AllPreBookOrders from './StaffPanel/pages/PreBookedOrders/AllPreBookOrders';







// 🧩 Lazy imports
const Header = lazy(() => import('./components/Header/Header'));
const Login = lazy(() => import('./pages/User/Login/Login'));

const Dashboard = lazy(() => import('./pages/Dashboard'));

const Reports = lazy(() => import('./pages/Reports'));
const DayWiseReport = lazy(() => import('./pages/DayWiseReport'));
const DateRangeReport = lazy(() => import('./pages/DateRangeReport'));
const AddCategory = lazy(() => import('./pages/Items/AddCategories'));


const AddMaterial = lazy(() => import('./pages/Materials/AddMaterial'));
const MaterialsList = lazy(() => import('./pages/Materials/MaterialsList'));
const MaterialsRelease = lazy(() => import('./pages/Materials/MaterialsRelease'));
const EachMaterialReport = lazy(() => import('./pages/Materials/EachMaterialReport'));

const PartyAdd = lazy(() => import('./pages/Party/PartyAdd'));
const AllPartiesList = lazy(() => import('./pages/Party/AllPartiesList'));
const PartySalesPurchasesDetails = lazy(() => import('./pages/Party/PartySalesPurchasesDetails'));



const Table= lazy(() => import('./pages/Items/Table'));
const AllTablesList= lazy(() => import('./pages/Items/AllTablesList'));

const DailyExpense= lazy(() => import('./pages/DailyExpense/DailyExpense'));
const AllDailyExpense= lazy(() => import('./pages/DailyExpense/AllDailyExpense'));

const ItemSalesPurchasesDetails = lazy(() => import('./pages/Items/ItemsSalesPurchasesDetails'));


const InventoryAdd = lazy(() => import('./pages/Purchase/InventoryAdd'));
const InventoryView = lazy(() => import('./pages/Purchase/InventoryView'));
const AllInventoryList = lazy(() => import('./pages/Purchase/AllInventoryList'));
const InventoryEdit = lazy(() => import('./pages/Purchase/InventoryEdit'));

const Coupon= lazy(() => import('./pages/Coupon'));
const AddFoodItem = lazy(() => import('./pages/Sale/AddFoodItem'));

const AllFoodItemsList = lazy(() => import('./pages/Sale/AllFoodItemsList'));


const AllOrdersDashboard = lazy(() => import('./pages/Orders/AllOrdersDashboard'));
const AllOrdersDayWise = lazy(() => import('./pages/Orders/AllOrdersDayWise'));
const AllOrdersTakeawayDateRange = lazy(() => import('./pages/Orders/AllOrdersTakeawayDateRange'));

const AddStaff = lazy(() => import('./pages/Settings/AddStaff'));
const StaffList = lazy(() => import('./pages/Settings/StaffList'));

const FinancialYear = lazy(() => import('./pages/Settings/FinancialYear'));
const DailyFoodStock = lazy(() => import('./pages/DailyFoodStock/DailyFoodStock'));

const AllDailyFoodStockDashboard = lazy(() => import('./pages/DailyFoodStock/AllDailyFoodStockDashboard'));
const AllDailyFoodStockReport = lazy(() => import('./pages/DailyFoodStock/AllDailyFoodStockReport'));
// const StaffTables=lazy(()=>import('./staff/pages/Tables/StaffTables'))
// const StaffTablesList=lazy(()=>import('./staff/pages/Tables/StaffTablesList'))

// ==========================================
// Staff PAnel Routes
// ==========================================



const Orders=lazy(()=>import('./StaffPanel/pages/Orders'))
const OrdersTakeAway=lazy(()=>import('./StaffPanel/pages/OrdersTakeAway'))
// const UpdateOrdersTakeAway=lazy(()=>import('./StaffPanel/pages/UpdateOrdersTakeaway'))
const OrderDetails=lazy(()=>import('./StaffPanel/pages/OrderDetails'))
const TableOrderDetails=lazy(()=>import('./StaffPanel/pages/TableOrderDetails'))
const ProductWiseReport=lazy(()=>import('./StaffPanel/pages/Reports/ProductWiseReport'))
const SalesDineInTakeawayReport=lazy(()=>import('./pages/SalesDineInTakeawayReport'))
const KitchenReport=lazy(()=>import('./StaffPanel/pages/Reports/KitchenReport'))

const PreBookOrders=lazy(()=>import('./StaffPanel/pages/PreBookedOrders/PreBookOrders'))
const AllPreBookOrders=lazy(()=>import('./StaffPanel/pages/PreBookedOrders/AllPreBookOrders'))
const UpdatePreBookOrders=lazy(()=>import('./StaffPanel/pages/PreBookedOrders/UpdatePreBookOrders'))
// const PreBookOrdersDashboard=lazy(()=>import('./StaffPanel/pages/PreBookedOrders/PreBookOrdersDashboard'))
const AllPreBookOrdersDayWise=lazy(()=>import('./StaffPanel/pages/PreBookedOrders/AllPreBookOrdersDayWise'))

// ==========================================
// Waiter Panel Routes
// ==========================================
const AddWaiterOrders=lazy(()=>import('./pages/Waiter/pages/AddWaiterOrders'))
const WaiterOrders=lazy(()=>import('./pages/Waiter/pages/WaiterOrders'))
const UpdateWaiterOrder=lazy(()=>import('./pages/Waiter/pages/UpdateWaiterOrder'))
// ==========================================
// Kitchen Staff Panel Routes
// ==========================================
const KitchenStaff=lazy(()=>import('./KitchenStaffPanel/pages/KitchenStaff'))


const InvoicePublicView=lazy(()=>import('./pages/InvoicePublicView'))
const CustomerQRMenuView=lazy(()=>import('./pages/Customer/CustomerQRMenuView'))
const MenuView=lazy(()=>import('./pages/MenuView/MenuView'))
// ==========================================
// 🔒 Auth Route Guards
// ==========================================




function ProtectedRoute() {
  const location = useLocation();
  const { data, isLoading, isError } = useGetUserQuery(undefined, {
    skip: location.pathname === "/login", // ⛔ Skip fetch on login
  });

  if (isLoading) return <div className='flex justify-center align-center w-full'>Loading...</div>;

  const isAuthenticated = data?.authenticated || data?.user;

  if (isError || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// 🔓 Public Route — prevent logged-in users from accessing /login
function PublicRoute() {
  const location = useLocation();
  const { data, isLoading } = useGetUserQuery(undefined, {
    skip: location.pathname !== "/login", // ✅ Only run this check on login page
  });

  if (isLoading) return <div>Loading...</div>;

  const isAuthenticated = data?.authenticated;

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}
function RoleAwareFallback({ userRole }) {
  if (userRole === "admin") {
    return <Navigate to="/home" replace />;
  }

  if (userRole === "staff") {
    return <Navigate to="/staff/orders/all-tables" replace />;
  }

  if (userRole === "kitchen-staff") {
    return <Navigate to="/kitchen-staff/orders/all-orders" replace />;
  }

  return <Navigate to="/login" replace />;
}

function RouterWrapper({ userRole }) {
  const location = useLocation();
  console.log(location, userRole);
  const isCustomerPage = /^\/(t|s)\/[^/]+$/.test(location.pathname);
  const isPublicInvoice =
  /^\/((TK)?INV\d+|PRBINV\d+|\d{1,10})$/i.test(location.pathname);
  const hideHeader = location.pathname === "/login" || 
  location.pathname.startsWith("/day-wise-report") ||
  location.pathname.startsWith("/order/date-range-orders-takaway-report") ||
  location.pathname.startsWith("/material/material-view")||
  location.pathname.startsWith("/order/day-wise-invoices-order-report")||
  location.pathname.startsWith("/party/party-sales-purchases-details")||
  location.pathname.startsWith("/menu")||
  location.pathname.startsWith("/staff/day-wise-pre-book-order-report")||
  isPublicInvoice || isCustomerPage;
;

  return (
    <>
      {!hideHeader && <Header />}
      <Suspense
  fallback={
    hideHeader ? null : <Spinner size="lg" text="Loading Dashboard..." />
  }
>

    {/* <Suspense fallback={<Spinner size="lg" text="Loading Dashboard..." />}> */}
        <Routes>
                 <Route
          path="/:Invoice_Id"
          element={<InvoicePublicView/>}
        />
          {/* Public Route: Login */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
   
          </Route>
            {/* <Route
              path="/customer/order"
              element={
                  <CustomerQRMenuView/>
              }
            /> */}
            <Route path="/t/:qr_slug" element={<CustomerQRMenuView />} />
{/* Admin Routes */}
          {userRole=="admin" && (

         <>
  

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/home"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />


            <Route
              path="/items/add-category"
              element={
                <Layout>
                  <AddCategory />
                </Layout>
              }
            />
            <Route
              path="/table/add"
              element={
                <Layout>
                  <Table/>
                </Layout>
              }
            />
            <Route
              path="/table/all-tables"
              element={
                <Layout>
                  <AllTablesList />
                </Layout>
              }
            />

              <Route
              path="/daily-expense/add"
              element={
                <Layout>
                  <DailyExpense/>
                </Layout>
              }
            />

            <Route
              path="/daily-expense/all-daily-expenses"
              element={
                <Layout>
                  <AllDailyExpense/>
                </Layout>
              }
            />


                  <Route
              path="/item/item-sales-purchases-details/:id"
              element={
                
                  <ItemSalesPurchasesDetails/>
               
              }
            />
            <Route
              path="/party/add"
              element={
                <Layout>
                  <PartyAdd />
                </Layout>
              }
            />
            <Route
              path="/party/all-parties"
              element={
                <Layout>
                  <AllPartiesList />
                </Layout>
              }
            />
              <Route
              path="/party/party-sales-purchases-details/:id"
              element={
                
                  <PartySalesPurchasesDetails/>
               
              }
            />

             <Route
              path="/material/add"
              element={
                <Layout>
                  <AddMaterial/>
                </Layout>
              }
            />

           
            <Route
              path="/material/all-materials"
              element={
                <Layout>
                  <MaterialsList/>
                </Layout>
              }
            />
                <Route
              path="/material/materials-release"
              element={
                <Layout>
                  <MaterialsRelease/>
                </Layout>
              }
            />
            <Route
              path="/material/material-view/:Material_Name"
              element={
             
                  <EachMaterialReport/>
             
              }
            />
             <Route
              path="/coupon"
              element={
                <Layout>
                  <Coupon/>
                </Layout>
              }
               
                 
              
              
            />
              <Route
              path="/new/food-items/add"
              element={
               
                  <AddFoodItem />
              
              }
            />
           
              <Route
              path="/new/all-new-food-items"
              element={
                <Layout>
                  <AllFoodItemsList/>
                </Layout>
              }
            />
             
            <Route
              path="/inventory/add"
              element={
             
                  <InventoryAdd />
                
              }
            />
              <Route
              path="/inventory/edit/:id"
              element={
             
                  <InventoryEdit />
                
              }
            />
            <Route
              path="/inventory/view/:id"
              element={
               
                  <InventoryView/>
             
              }
            />
            <Route
              path="/inventory/all-inventories"
              element={
                <Layout>
                  <AllInventoryList />
                </Layout>
              }
            />

            <Route path="/order/all-orders" element={
              <Layout>
                <AllOrdersDashboard />
              </Layout>
            } />

            <Route
              path="/order/day-wise-invoices-order-report/:date"
              element={
                
                  <AllOrdersDayWise/>
              
              }
            />
            {/* /order/date-range-orders-takaway-report */}
               <Route
              path="/order/date-range-orders-takaway-report/:fromDate/:toDate"
              element={
                
                  <AllOrdersTakeawayDateRange/>
              
              }
            />
            {/* <Route path="/order/view/:id" element={
              <Layout>
                <OrderView />
              </Layout>
            } /> */}
    <Route path="/report/product-wise-report" element={
              <Layout>
                <ProductWiseReport/>
              </Layout>
            
            } />

                 <Route
             path="/report/sales-dine-in-takeaway-report" 
            element={
              <Layout>
            <SalesDineInTakeawayReport/>
            </Layout>

          } 
            />

            
                 <Route
             path="/report/kitchen-wise-report" 
            element={
              <Layout>
            <KitchenReport/>
            </Layout>

          } 
            />

            <Route
              path="/staff/add"
              element={
                <Layout>
                  <AddStaff/>
                </Layout>
              }
            />

           
            <Route
              path="/staff/all-staffs"
              element={
                <Layout>
                  <StaffList/>
                </Layout>
              }
            />
            
            <Route
              path="/reports"
              element={
                <Layout>
                  <Reports />
                </Layout>
              }
            />
             <Route
              path="/reports"
              element={
                <Layout>
                  <Reports />
                </Layout>
              }
            />
              <Route
              path="/day-wise-report/:date"
              element={
                
                  <DayWiseReport/>
              
              }
            />
        
              <Route
             path="/date-range-report/:fromDate/:toDate" 
            element={<DateRangeReport/>} 
            />
         

                   <Route
              path="/financial-year/add"
              element={
                <Layout>
                  <FinancialYear/>
                </Layout>
              }
            />

                <Route
              path="/food-items/daily-food-stock"
              element={
                <Layout>
                  <DailyFoodStock/>
                </Layout>
              }
            />
              <Route
              path="/food-items/all-daily-food-stock"
              element={
                <Layout>
                  <AllDailyFoodStockDashboard/>
                </Layout>
              }
            />
              <Route
              path="/food-items/all-daily-food-stock-report"
              element={
                <Layout>
                  <AllDailyFoodStockReport/>
                </Layout>
              }
            />

          </Route>
          </>
        
        )}

        

        { userRole==="staff" && (
          <>
          {/* <Route
              path="/staff/table/items-add"
              element={
                <Layout>
                  <StaffTables/>
                </Layout>
              }
            /> */}
              {/* <Route
              path="/staff/table/all-tables"
              element={
                <Layout>
                  <StaffTablesList/>
                </Layout>
              }
            /> */}
              {/* <Route
              path="/staff/orders/add"
              element={
               
                  <Orders/>
              
              }
            /> */}
             <Route
              path="/staff/orders/add/:Table_Name"
              element={
               
                  <Orders/>
              
              }
            />
            <Route
              path="/staff/orders-takeaway/add"
              element={
               
                  <OrdersTakeAway/>
              
              }
            />
             {/* <Route
              path="/staff/update-orders-takeaway/:Order_Id"
              element={
               
                  <UpdateOrdersTakeAway/>
              
              }
            /> */}
              {/* <Route
              path="/staff/orders/all-orders"
              element={
                <Layout>
                  <OrderDetails/>
                </Layout>
              }
            /> */}
             <Route
              path="/staff/orders/all-tables"
              element={
                <Layout>
                  <OrderDetails/>
                </Layout>
              }
            />
            <Route
              path="/staff/orders/table-order-details/:Order_Id"
              element={
               
                  <TableOrderDetails/>
              
              }
            />
            <Route path="/order/all-orders" element={
              <Layout>
                <AllOrdersDashboard />
              </Layout>
            
            } />

               <Route
              path="/order/day-wise-invoices-order-report/:date"
              element={
                
                  <AllOrdersDayWise/>
              
              }
            />
            {/* /order/date-range-orders-takaway-report */}
               <Route
              path="/order/date-range-orders-takaway-report/:fromDate/:toDate"
              element={
                
                  <AllOrdersTakeawayDateRange/>
              
              }
            />
             <Route path="/report/product-wise-report" element={
              <Layout>
                <ProductWiseReport/>
              </Layout>
            
            } />
         <Route
             path="/report/sales-dine-in-takeaway-report" 
            element={
              <Layout>
            <SalesDineInTakeawayReport/>
            </Layout>

          } 
            />

              <Route
             path="/report/kitchen-wise-report" 
            element={
              <Layout>
            <KitchenReport/>
            </Layout>

          } 
            />
   <Route
              path="/staff/pre-book-order/add-pre-booked-orders"
              element={
               
                  <PreBookOrders/>
              
              }
            />
            <Route
              path="/staff/pre-book-order/all-pre-booked-orders"
              element={
                       <Layout>
                  <AllPreBookOrders/>
                  </Layout>
              
              }
            />
             <Route
              path="/staff/pre-book-order/update-pre-booked-order/:Pre_Booked_Order_Id"
              element={
               
                  <UpdatePreBookOrders/>
              
              }
            />
           
              <Route
              path="/staff/day-wise-pre-book-order-report/:date"
              element={
                
                  <AllPreBookOrdersDayWise/>
              
              }
            />
               <Route
              path="/food-items/daily-food-stock"
              element={
                <Layout>
                  <DailyFoodStock/>
                </Layout>
              }
            />
               <Route
              path="/food-items/all-daily-food-stock"
              element={
                <Layout>
                  <AllDailyFoodStockDashboard/>
                </Layout>
              }
            />
            <Route
              path="/food-items/all-daily-food-stock-report"
              element={
                <Layout>
                  <AllDailyFoodStockReport/>
                </Layout>
              }
            />
              <Route
              path="/daily-expense/add"
              element={
                <Layout>
                  <DailyExpense/>
                </Layout>
              }
            />

            <Route
              path="/daily-expense/all-daily-expenses"
              element={
                <Layout>
                  <AllDailyExpense/>
                </Layout>
              }
            />
          </>
        )}
         { userRole==="waiter" && (
          <>
          
               {/* <Route
              path="/waiter/orders/add"
              element={
               
                  <AddWaiterOrders/>
              
              }
            /> * */}
           
             <Route
              path="/waiter/orders/add/:Table_Name"
              element={
               
                  <AddWaiterOrders/>
              
              }
            /> 
              {/* <Route
              path="/waiter/orders/all-orders"
              element={
                <Layout>
                  <WaiterOrders/>
                </Layout>
              }
            /> */}
                <Route
              path="/waiter/orders/all-orders"
              element={
                <Layout>
                  <WaiterOrders/>
                </Layout>
              }
            />
            <Route
              path="/waiter/orders/update-order/:Order_Id"
              element={
             
                  <UpdateWaiterOrder/>
               
              }
            />
           
           
           
           
           
        
 
           
            

          </>
        )}

       {userRole==="kitchen-staff" && (
          <>
            <Route
              path="/kitchen-staff/orders/all-orders"
              element={
                
                  <KitchenStaff/>
               
              }
            />
                <Route
              path="/new/all-new-food-items"
              element={
              
                  <AllFoodItemsList/>
              
              }
            />
            </>
              )}


          <Route
              path="/menu"
              element={
                  <MenuView/>
              }
            />

          {/* Fallback */}
          <Route path="*" element={<RoleAwareFallback userRole={userRole} />} />

          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </Suspense>
      

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
export default function App() {
  const { data: userMe, isLoading } = useGetUserQuery();

  // ⛔ Prevent router from rendering repeatedly
  if (isLoading) return <div>
     <Spinner size="lg" text="Loading ..." />
  </div>;

  // ❌ Not logged in → redirect userRole=null
  const role = userMe?.user?.role || null;

  return (
    <BrowserRouter>
      <RouterWrapper userRole={role} />
    </BrowserRouter>
  );
}




