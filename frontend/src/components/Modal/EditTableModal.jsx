// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import { useUpdateTableMutation } from "../../redux/api/tableApi";

// import { useEffect } from "react";
// import { toast } from "react-toastify";



// export default function EditTableModal({table,onClose}) {

//     const navigate=useNavigate()
//       const {
//         register,
//         handleSubmit,
//         reset,
//         watch
    
        
//       } = useForm()
//       useEffect(() => {
//           reset({
//             Table_Name: table.Table_Name,
//             Table_Capacity: table.Table_Capacity
//           })
//       },[])

//       console.log(table)
     
//     const[editTable,{isLoading:isEditingTable}]=useUpdateTableMutation()
//       const formValues = watch();
//   console.log("Current form values:", formValues);
//     const [errors, setErrors] = useState({});
//       const onSubmit = async(data) => {
//             console.log("Form Data (from RHF):", data);

//     if(!data.Table_Name ){
      
//      setErrors((prevErrors) => ({ ...prevErrors, Table_Name: "Table name is required"
//       }));
//       return
      
//     }

//     if(!data.Table_Capacity ){
      
//       setErrors((prevErrors) => ({ ...prevErrors, Table_Capacity: "Table capacity is required"
//        }));
//        return
       
//      }
//         try {
//              const res = await editTable({
//                body: data,
//                Table_Id:table.Table_Id
//              }).unwrap();
//              console.log(" successfully:", res);
//              const resData = res?.data || res;
//              if (resData?.success) {
       
//                toast.success(" Table edited successfully!");
//                onClose();
//                navigate("/table/all-tables");
//              } else {
//                toast.error("Failed to add new table");
//              }
       
//            } catch (error) {
//              const errorMessage =
//                error?.data?.message || error?.message || "Failed to update table";
//              toast.error(errorMessage);
//              // toast.error("Failed to add lead");
//              console.error("Submission failed", error);
//            }
//       }
//    return (
//   <>

// <div
//   style={{
//     position: "fixed",
//     marginTop: "4rem",
//     inset: 0,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(0,0,0,0.3)", // dim background
//     backdropFilter: "blur(4px)", // blur effect
//     zIndex: 50,
//     padding: "1rem", // ensures spacing on small screens
//   }}
// >
//     <div
//       className="bg-white 
//       w-full
//        max-w-4xl rounded-lg 
//       shadow-lg p-6 
//     overflow-hidden max-h-[90vh]
//       "
//     >
//        <div className="flex justify-between items-center mb-6"
//       style={{marginBottom:"20px",paddingBottom:"10px"}}>
//         <h4 className="text-xl font-semibold text-gray-900">
//           Edit Table
//         </h4>
//         <button
//           type="button"
//           style={{ backgroundColor: "transparent" ,height:"30px",width:"30px",
//             fontSize:"20px"
//           }}
//           onClick={onClose}
//           className="text-gray-500 hover:text-gray-700 "
//         >
//           ✕
//         </button>
//       </div>
    
            
            
//             <div className=" tab-inn">


//               <form onSubmit={handleSubmit(onSubmit)}>
//                 <div className="grid grid-cols-3 gap-4">

//                   <div 
//                   style={{width:"100%"}} className="input-field col s6 ">
//                     <span className="active">
//                      Table Name
//                       <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                     </span>
//                     <input
//                       type="text"
//                       id="Table_Name"
//                       {...register("Table_Name")}
//                       placeholder=" Table Name"
//                       className="w-full outline-none border-b-2 text-gray-900"
//                     />
//                     {errors?.Table_Name && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors?.Table_Name}
//                       </p>
//                     )}
//                   </div>

              

             
              
              
// <div  style={{width:"100%"}}
//  className="input-field col s6  ">
//     <span className="active">
//         Table Capacity
//         <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//     </span>

//     <input
//         type="text"
//         id="Table_Capacity"
//         {...register("Table_Capacity")}
//         placeholder=" Table Capacity"
//         className="w-full outline-none border-b-2 text-gray-900"
        
//                  // limit to 8 digits
//     onInput={(e) => {
//       // ✅ Allow only digits
//       e.target.value = e.target.value.replace(/[^0-9]/g, "");
//     }}
//     />
    
//     {errors?.Table_Capacity && (
//         <p className="text-red-500 text-xs mt-1">
//             {errors?.Table_Capacity}
//         </p>
//     )}
// </div>



                

//                 <div className="flex  items-center">
//                   <button
//                     type="submit"
//                     disabled={formValues.errorCount > 0 ||isEditingTable}
//                     className=" text-white font-bold py-2 px-4 rounded mt-4"
//                     style={{ backgroundColor: "#ff0000" }}
//                   >
//                     {isEditingTable ? "Saving..." : "Save"}
//                   </button>
//                 </div>
//                 </div>
//               </form>
//             </div>
   

        
//       </div>
//     </div>



//   </>
//   );
// }


import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { QRCodeSVG } from "qrcode.react";                                    // NEW

import PrintTableQrs, {
  getTableQrUrl,
} from "../../components/PrintTableQrs";// NEW (adjust path)
import {
  useUpdateTableMutation,
  useRegenerateTableQrMutation,                                              // NEW
} from "../../redux/api/tableApi";
import { toast } from "react-toastify";

export default function EditTableModal({ table, onClose }) {
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    reset({
      Table_Name: table.Table_Name,
      Table_Capacity: table.Table_Capacity,
    });
  }, [table, reset]); // CHANGED: dependency list

  const [editTable, { isLoading: isEditingTable }] = useUpdateTableMutation();
  //const formValues = watch();
  const [errors, setErrors] = useState({});

  // NEW: QR state + regenerate
  const [qrSlug, setQrSlug] = useState(table.Qr_Slug);
  const [regenerateQr, { isLoading: isRegenerating }] = useRegenerateTableQrMutation();

  const handleRegenerate = async () => {
    const ok = window.confirm(
      `Regenerate QR for ${table.Table_Name}?\n\nThe QR currently stuck on this table will STOP working. You must print and replace it.`
    );
    if (!ok) return;
    try {
      const res = await regenerateQr({ Table_Id: table.Table_Id }).unwrap();
      setQrSlug(res.Qr_Slug);
      toast.success("QR regenerated. Print and replace the old one.");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to regenerate QR");
    }
  };

  const onSubmit = async (data) => {
    if (!data.Table_Name) {
      setErrors((prev) => ({ ...prev, Table_Name: "Table name is required" }));
      return;
    }
    if (!data.Table_Capacity) {
      setErrors((prev) => ({ ...prev, Table_Capacity: "Table capacity is required" }));
      return;
    }
    try {
      const res = await editTable({ body: data, Table_Id: table.Table_Id }).unwrap();
      const resData = res?.data || res;
      if (resData?.success) {
        toast.success("Table edited successfully!");
        onClose();
        navigate("/table/all-tables");
      } else {
        toast.error("Failed to update table"); // CHANGED: message said "add new table"
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to update table");
      console.error("Submission failed", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        marginTop: "4rem",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      {/* CHANGED: overflow-y-auto so the QR section is never cut off */}
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <div
          className="flex justify-between items-center mb-6"
          style={{ marginBottom: "20px", paddingBottom: "10px" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">Edit Table</h4>
          <button
            type="button"
            style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 "
          >
            ✕
          </button>
        </div>

        <div className=" tab-inn">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-3 gap-4">
              <div style={{ width: "100%" }} className="input-field col s6 ">
                <span className="active">
                  Table Name
                  <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                </span>
                <input
                  type="text"
                  id="Table_Name"
                  {...register("Table_Name")}
                  placeholder=" Table Name"
                  className="w-full outline-none border-b-2 text-gray-900"
                />
                {errors?.Table_Name && (
                  <p className="text-red-500 text-xs mt-1">{errors?.Table_Name}</p>
                )}
              </div>

              <div style={{ width: "100%" }} className="input-field col s6  ">
                <span className="active">
                  Table Capacity
                  <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                </span>
                <input
                  type="text"
                  id="Table_Capacity"
                  {...register("Table_Capacity")}
                  placeholder=" Table Capacity"
                  className="w-full outline-none border-b-2 text-gray-900"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                />
                {errors?.Table_Capacity && (
                  <p className="text-red-500 text-xs mt-1">{errors?.Table_Capacity}</p>
                )}
              </div>

              <div className="flex  items-center">
                <button
                  type="submit"
                  disabled={isEditingTable}
                  className=" text-white font-bold py-2 px-4 rounded mt-4"
                  style={{ backgroundColor: "#ff0000" }}
                >
                  {isEditingTable ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>

          {/* NEW: QR section */}
          <div className="border-t mt-6 pt-4 flex items-center gap-6">
            {qrSlug ? (
              <QRCodeSVG
                value={getTableQrUrl({ Qr_Slug: qrSlug })}
                size={120}
                level="H"
                includeMargin
              />
            ) : (
              <p className="text-red-500">No QR yet for this table.</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!qrSlug}
                onClick={() =>   PrintTableQrs([{ ...table, Qr_Slug: qrSlug }])}
                style={{ backgroundColor: "#ff0000" }}
                className="text-white px-4 py-2 rounded-md"
              >
                Print QR
              </button>
              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-md bg-gray-200"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate QR"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}