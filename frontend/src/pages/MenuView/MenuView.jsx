// import { useGetAllFoodItemsQuery } from "../redux/api/foodItemApi";

import { useGetAllCategoriesAndFoodItemsToBeShownOnMenuQuery } from "../../redux/api/foodItemApi";




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
  <img src="/assets/images/page1.jpg" alt="Background" className="w-full h-full object-cover"/>
  </div>
  

{categories.map((category) => {
  const key = normalizeCategory(category);
  // const image = categoryImages[key];
const image="/assets/images/menu-bg.jpg";
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






