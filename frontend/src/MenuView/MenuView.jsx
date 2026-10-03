// import { useGetAllFoodItemsQuery } from "../redux/api/foodItemApi";

import { useGetAllCategoriesAndFoodItemsToBeShownOnMenuQuery } from "../redux/api/foodItemApi";




const MenuView = () => {
  // const { data: menuItems, isLoading } = useGetAllCategoriesAndFoodItemsToBeShownOnMenuQuery({});
  // const items = menuItems?.foodItems || [];
// const {
//   data: menuItems,
//   isLoading,
// } = useGetAllCategoriesAndFoodItemsToBeShownOnMenuQuery();

// // const groupedItems = menuItems?.categories || [];
// const items = menuItems?.categories || [];
// console.log("Menu Items:", items);

//   const [showWelcome, setShowWelcome] = useState(true);
// const categoryImages = {
//   fries: "/assets/images/fries.jpg",
//   roll: "/assets/images/roll.jpg",
//   parathas: "/assets/images/paratha.jpg",
// //   tandoor: "/assets/images/categories/tandoor.jpg",
// //   biryani: "/assets/images/categories/biryani.jpg",
// //   beverages: "/assets/images/categories/beverages.jpg",
// };
const {
  data: menuItems,
  isLoading,
} = useGetAllCategoriesAndFoodItemsToBeShownOnMenuQuery();

// categories is an OBJECT, not array
const groupedItems = menuItems?.categories || {};

console.log("Grouped Menu Items:", groupedItems);

// category names
const categories = Object.keys(groupedItems);

const normalizeCategory = (category) =>
  category.toLowerCase().replace(/\s+/g, "-");

  /* ---------------- GROUP BY CATEGORY ---------------- */
  // const groupedItems = items.reduce((acc, item) => {
  //   const category = item?.Item_Category || "Other";
  //   if (!acc[category]) acc[category] = [];
  //   acc[category].push(item);
  //   return acc;
  // }, {});

  // const categories = Object.keys(groupedItems);




  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-yellow-400 text-2xl">
        Loading Menu...
      </div>
    );
  }

  /* ================= EMPTY ================= */
  // if (!items.length) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">
  //       No menu items available
  //     </div>
  //   );
  // }

  /* ================= MENU PAGE ================= */
return (
  <>
  <div className="min-h-screen bg-gray-900 text-white">
    {/* HEADER */}
    {/* <header className="bg-black sticky top-0 z-50 p-4 flex items-center justify-center">
      <div className="text-center mb-0">
        <img
          src="/assets/images/restaurant-logo.png"
          alt="Logo"
          className="w-32 mx-auto mb-2"
        />
        <h4 className="text-gray-400 text-sm">Our Menu</h4>
      </div>
    </header> */}

 
{/* <div className="sticky top-[160px] z-20 bg-gray-900 w-full border-b border-gray-700">
  <div
    className="
      max-w-7xl mx-auto
      px-4 py-3
      flex flex-wrap
      gap-3
      justify-start
      items-center
    "
  >
    {categories.map((cat) => (
      <button
       style={{backgroundColor: '#2d2d2d'}}
        key={cat}
        onClick={() => scrollToCategory(cat)}
        className="
          px-5 py-2
          rounded-full
       
          text-sm font-medium
          text-white
          hover:bg-yellow-400 hover:text-black
          transition
          whitespace-nowrap
        "
      >
        {cat}
      </button>
    ))}
  </div>
</div> */}



    {/* MENU ITEMS */}
    <div //         

    className="max-w-4xl mx-auto px-4 py-6">
      

    
        {/* BLUR FILL (FULL WIDTH FEEL) */}
      {/* IMAGE BACKGROUND FIX */}
<div
style={{marginTop:"0px"}}

className="mb-10"
  // style={{
    
  //     backgroundImage: `url(${"/assets/images/page1.jpg"})`,
  //   backgroundRepeat: "no-repeat",
  //   backgroundPosition: "cover",
  //   backgroundSize: "100% 100%", // ✅ KEY FIX
  // }}
>
  <img src="/billmeal/assets/images/page1.jpg" alt="Background" className="w-full h-full object-cover"/>
  </div>
  

{categories.map((category) => {
  const key = normalizeCategory(category);
  // const image = categoryImages[key];
const image="/billmeal/assets/images/menu-bg.jpg";
  return (
    <div key={category} className="mb-10">

      {/* IMAGE BANNER (ALWAYS FULL IMAGE) */}
      <div
        id={key}
        className="
            relative
    w-full
    rounded-xl
    
          
         
        "
      >
        {/* BLUR FILL (FULL WIDTH FEEL) */}
      {/* IMAGE BACKGROUND FIX */}
<div
  className="absolute inset-0 z-0"
  style={{
    
    backgroundImage: `url(${image})`,
    backgroundRepeat: "no-repeat",
      //backgroundPosition: "center", // ✅ REQUIRED
    // backgroundPosition: "cover",
     //backgroundPosition: "center", // ✅ REQUIRED
    //backgroundSize: "100% 100%", // ✅ KEY FIX
    backgroundSize: "cover",
  }}
/>


        {/* ACTUAL FULL IMAGE (NO CROP) */}
        {/* <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        /> */}

        {/* TEXT LAYER */}
        <div className="relative z-10 h-full p-6 flex flex-col justify-start">
          <h2 style={{color:"#6e0003"}} className="text-xl category-heading 
          flex justify-center items-center font-bold sm:text-4xl  sm:mb-4">
            {category}
          </h2>

          {/* ITEMS (CAN BE ZERO OR MANY) */}
          <div style={{marginBottom: "0px"}} className="space-y-3  mt-4 sm:mt-10 ">
            {groupedItems[category]?.length ? (
              groupedItems[category].map((item) => (
                <div
                style={{marginBottom: "0px",width:"100%"}}
                  key={item.id}
                  className="
                   
                    p-2
                    rounded-lg
                    flex
                    justify-between
                    gap-2
                    w-full
                    sm:justify-between
                   
                  "
                >
                 {/* <span className="whitespace-nowrap text-black text-sm sm:text-base md:text-lg">
  {item.Item_Name}
</span> */}
<span className="
  text-black
  text-sm sm:text-base md:text-lg
  leading-tight
  break-words
  max-w-[75%] sm:max-w-[75%]
">
  {item.Item_Name}
</span>
<span className="
  text-black
  font-bold
  text-sm sm:text-base md:text-lg
  whitespace-nowrap
  flex-shrink-0
">
  ₹{Number(item.Item_Price).toFixed(2)}
</span>

{/* <span className="text-black font-bold text-sm sm:text-base md:text-lg">
  ₹{Number(item.Item_Price).toFixed(2)}
</span> */}
                </div>
              ))
            ) : (
              <p className="text-black/80 italic">
                Items coming soon…
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
})}



    </div>

    {/* FOOTER */}
    {/* <footer className="bg-black py-8 mt-12">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-gray-400 px-4">
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Contact</h3>
          <p>+91 99031 06989</p>
        </div>
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Location</h3>
          <p>21D, Ho-Chi-Minh Sarani, Shakuntala Park, Kolkata 700061, WB</p>
        </div>
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Opening</h3>
          <p>25th December 2025</p>
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mt-6">
        © 2025 Hello Guys Restaurant
      </p>
    </footer> */}
  </div>
   <style>
        {`


  /* below 640px */
  @media (max-width: 640px) {

  .category-heading {
    font-size: 15px;
  }
   
  }
`}
      </style>
      </>
);

};
    
export default MenuView;






//   const scrollToCategory = (category) => {
//     const id = category.toLowerCase().replace(/\s+/g, "-");
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
//   };

  /* ================= WELCOME PAGE ================= */
//   if (showWelcome) {
//     return (
//       <div
//         className="min-h-screen flex items-center justify-center p-4"
//         style={{
//           background:
//             `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
//             url("/assets/images/bg-menu.jpg") center/cover no-repeat`,
//         }}
//       >
//         <div className="text-center text-white max-w-xl">
//           <img src="/assets/images/restaurant-logo.png" alt="Logo" className="w-56 mx-auto mb-8" />

//           <h1 className="text-4xl md:text-5xl font-bold mb-6">
//             A Warm & Delicious Welcome Awaits You
//           </h1>

//           <div className="border-2 border-yellow-400 rounded-full px-8 py-4 mb-6 inline-block">
//             <p className="text-xl">Grand Opening</p>
//             <p className="text-2xl font-bold text-yellow-400">
//               25th December 2025
//             </p>
//           </div>

//           <div className="space-y-2 text-gray-300 mb-8">
//             <div className="flex justify-center gap-2">
//               <Phone size={18} />
//               <a href="tel:+919903106989">+91 99031 06989</a>
//             </div>
//             <div className="flex justify-center gap-2">
//               <MapPin size={18} />
//               <span>21D, Ho-Chi-Minh Sarani, Kolkata 700061</span>
//             </div>
//           </div>

//           <button
//             onClick={() => setShowWelcome(false)}
//             className="bg-yellow-400 text-black px-10 py-3 rounded-full font-semibold text-lg hover:bg-white transition"
//           >
//             View Menu
//           </button>
//         </div>
//       </div>
//     );
//   }

   {/* CATEGORY NAV */}
    {/* <div className="sticky top-[72px] bg-gray-800 p-3 z-40">
      <div className="flex gap-3 flex-wrap justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => scrollToCategory(cat)}
            className="bg-gray-700 px-5 py-2 
            rounded-full hover:bg-yellow-400 hover:text-black transition"
          >
            {cat}
          </button>
        ))}
      </div>
    </div> */}
{/* <div className="sticky top-[72px] z-40 bg-gray-900 w-full border-b border-gray-700">
  <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => scrollToCategory(cat)}
        className="
          whitespace-nowrap
          px-5 py-2
          rounded-full
          bg-gray-700
          text-sm font-medium
          text-white
          hover:bg-yellow-400 hover:text-black
          transition
          flex-shrink-0
        "
      >
        {cat}
      </button>
    ))}
  </div>
</div> */}
{/* <div className="sticky top-[70px] z-40 bg-gray-900 w-full border-b border-gray-700">
  <div
    className="
      max-w-7xl mx-auto
      px-4 py-3
      flex flex-wrap
      gap-3
      justify-start
      items-center
    "
  >
    {categories.map((cat) => (
      <button
      style={{backgroundColor: '#2d2d2d'}}
        key={cat}
        onClick={() => scrollToCategory(cat)}
        className="
          px-5 py-2
          rounded-full
          bg-[#2d2d2d]
          text-sm font-medium
          text-white
          hover:bg-yellow-400 hover:text-black
          transition
          whitespace-nowrap
        "
      >
        {cat}
      </button>
    ))}
  </div>
</div> */}

{/* {categories.map((category) => (
        // <div
        //   key={category}
        //   id={category.toLowerCase().replace(/\s+/g, "-")}
        //   className="mb-12 scroll-mt-32"
        // >
        //   <h2 className="text-2xl heading font-bold border-l-4 border-yellow-400 pl-4 mb-6">
        //     {category}
        //     {/* <span className="text-gray-500 text-sm ml-3">
        //       ({groupedItems[category].length})
        //     </span> 
        //   </h2>
        <div key={category} className="mb-12">
  <h2
    id={category.toLowerCase().replace(/\s+/g, "-")}
    className="heading text-2xl font-bold border-l-4 border-yellow-400 pl-4 mb-6"
  >
    {category}
  </h2>

          <div className="space-y-4 mt-2">
            {groupedItems[category].map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition"
              >
                <span className="text-lg font-medium">
                  {item.Item_Name}
                </span>
                <span className="text-yellow-400 text-xl font-bold">
                  ₹{Number(item.Item_Price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))} */}
 {/* {categories.map((category) => {
  const key = normalizeCategory(category);
  const image = categoryImages[key];

  return (
    <div key={category} className="mb-16">
    
      <div
        id={key}
        className="
          relative
          w-full
          rounded-xl
          overflow-hidden
        "
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
     
        <div className="absolute inset-0 "></div>

 
        <div className="relative z-10 p-6">

        
          <h2 className="text-3xl font-bold text-black-400 
          mb-6 border-b border-yellow-400/40 pb-2">
            {category}
          </h2>

          
          <div className="space-y-4">
            {groupedItems[category].map((item) => (
              <div
                key={item.id}
                className="
                w-120
                  p-4
                  rounded-lg
                  flex
                  justify-between
                  items-center
                 
                "
              >
                <span className="text-lg font-medium text-black">
                  {item.Item_Name}
                </span>
                <span className="text-black text-xl font-bold">
                  ₹{Number(item.Item_Price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );



})}  */}
      /* ---------------- SCROLL HANDLER ---------------- */
// const scrollToCategory = (category) => {
//   const id = category.toLowerCase().replace(/\s+/g, "-");
//   const el = document.getElementById(id);

//   // Get the actual height of the sticky category bar
//   const stickyBar = document.querySelector(".heading");
//   const stickyOffset = stickyBar ? stickyBar.offsetHeight : 0;

//   if (el) {
//     // Calculate top position of the heading relative to the document
//     const elementPosition = el.getBoundingClientRect().top + window.scrollY;

//     // Scroll to the heading minus sticky bar height
//     window.scrollTo({
//       top: elementPosition - stickyOffset - 8, // optional 8px gap
//       behavior: "smooth",
//     });
//   }
// };

// const scrollToCategory = (category) => {
//   const id = category.toLowerCase().replace(/\s+/g, "-");
//   const heading = document.getElementById(id);

//   if (!heading) return;

//   // Height of HEADER (logo)
//   const header = document.querySelector("header");
//   const headerHeight = header ? header.offsetHeight : 0;

//   // Height of CATEGORY BAR
//   const categoryBar = document.querySelector(".sticky.top-\\[160px\\]");
//   const categoryBarHeight = categoryBar ? categoryBar.offsetHeight : 0;

//   const totalOffset = headerHeight + categoryBarHeight + 12; // gap

//   const top =
//     heading.getBoundingClientRect().top +
//     window.scrollY -
//     totalOffset;

//   window.scrollTo({
//     top,
//     behavior: "smooth",
//   });
// };
