import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    useAddCouponMutation,
    useGetAllCouponsQuery,
    useToggleCouponStatusMutation,
    useUpdateCouponMutation,
} from "../redux/api/couponApi";
import { toast } from "react-toastify";


export default function Coupon() {
    const [editingCoupon, setEditingCoupon] = useState(null); // null = add mode, object = edit mode

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
    } = useForm();

    const [addCoupon, { isLoading: isAddingCoupon }] = useAddCouponMutation();
    const [updateCoupon, { isLoading: isUpdatingCoupon }] = useUpdateCouponMutation();

    const { data: coupon, isLoading, refetch } = useGetAllCouponsQuery();
    const [toggleCouponStatus] = useToggleCouponStatusMutation();
    const coupons = coupon?.data || coupon?.coupons || coupon || [];
    // const [toggleStatus, setToggleStatus] = useState(false);
    const formValues = watch();
    console.log(formValues);
    // Prefill form when editing
    useEffect(() => {
        if (editingCoupon) {
            setValue("code", editingCoupon.code);
            setValue("discount_type", editingCoupon.discount_type);
            setValue("discount_value", editingCoupon.discount_value);
            setValue("is_active", editingCoupon.is_active ? "1" : "0");
        } else {
            reset();
        }
    }, [editingCoupon]);

    const onSubmit = async (data) => {
        console.log(data);
        try {
            if (editingCoupon) {
                const payload = {
                    code: data.code,
                    discount_type: data.discount_type,
                    discount_value: data.discount_value,
                    is_active: data.is_active
                }
                // Edit mode
                const res = await updateCoupon({ id: editingCoupon.id, body: payload }).unwrap();
                if (res?.success) {
                    toast.success("Coupon updated successfully");
                    setEditingCoupon(null);
                    reset();
                    refetch();
                }
            } else {
                // Add mode
                const res = await addCoupon(data).unwrap();
                if (res?.success) {
                    toast.success("Coupon added successfully");
                    reset();
                    refetch();
                }
            }
        } catch (error) {
            const errorMessage =
                error?.data?.message || error?.message || `Failed to ${editingCoupon ? "update" : "add"} coupon`;
            toast.error(errorMessage);
        }
    };

    const handleEdit = (couponItem) => {
        setEditingCoupon(couponItem);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingCoupon(null);
        reset();
    };

    const handleStatusToggle = async (couponItem) => {
        // setToggleStatus(true)

        try {
            const newStatus = couponItem.is_active ? "0" : "1";

            const res = await toggleCouponStatus({
                id: couponItem.id,

            }).unwrap();
            if (res?.success) {
                toast.success(`Coupon ${couponItem.code} ${newStatus === "1" ? "activated" : "deactivated"} successfully`);
                refetch();

            }
        } catch (error) {
            const errorMessage =
                error?.data?.message || error?.message || "Failed to update status";
            toast.error(errorMessage);
        } 
    };

    return (
        <>
            <div className="sb2-2-3">
                <div className="row">
                    <div className="col-md-12">
                        {/* ─── ADD / EDIT FORM (unchanged UI) ─── */}
                        <div className="box-inn-sp">
                            <div className="inn-title">
                                <div className="flex flex-row justify-between tables-center mb-4 sm:mb-4">
                                    <div>
                                        <h4 className="text-2xl font-bold mb-2">
                                            {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                                        </h4>
                                        <p className="text-gray-500 mb-6">
                                            {editingCoupon
                                                ? `Editing: ${editingCoupon.code}`
                                                : "Add Coupon Details"}
                                        </p>
                                    </div>

                                    <div className="hidden sm:block flex gap-2">
                                        {editingCoupon && (
                                            <button
                                                onClick={handleCancelEdit}
                                                style={{
                                                    outline: "none",
                                                    boxShadow: "none",
                                                    backgroundColor: "#6b7280",
                                                }}
                                                className="text-white px-4 py-2 rounded-md mr-2"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                        {/* <button
                      style={{
                        outline: "none",
                        boxShadow: "none",
                        backgroundColor: "#ff0000",
                      }}
                      className="text-white px-4 py-2 rounded-md"
                    >
                      All Coupons
                    </button> */}
                                    </div>
                                </div>
                            </div>

                            <div className="tab-inn">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="grid grid-cols-2 gap-4">

                                        {/* Coupon Code */}
                                        <div style={{ width: "100%" }} className="input-field col s6">
                                            <span className="active">
                                                Coupon Code
                                                <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                            </span>
                                            <input
                                                type="text"
                                                id="code"
                                                {...register("code")}
                                                placeholder="Coupon Code"
                                                className="w-full outline-none border-b-2 text-gray-900"
                                            />
                                        </div>

                                        {/* Discount Type */}
                                        <div style={{ width: "100%", paddingBottom: "0px" }} className="input-field col s6">
                                            <span className="active">
                                                Discount Type
                                                <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                            </span>
                                            <select
                                                {...register("discount_type")}
                                                className="w-full border-b-2 h-10 text-gray-900 outline-none"
                                            >
                                                <option value="">Select Discount Type</option>
                                                <option value="PERCENT">Percentage</option>
                                                <option value="FLAT">Flat</option>
                                            </select>
                                        </div>

                                        {/* Discount Value */}
                                        <div style={{ width: "100%" }} className="input-field col s6">
                                            <span className="active">
                                                Discount Value
                                                <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                            </span>
                                            <input
                                                type="text"
                                                id="discount_value"
                                                {...register("discount_value")}
                                                placeholder="Discount Value"
                                                className="w-full outline-none border-b-2 text-gray-900"
                                                onInput={(e) => {
                                                    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                                }}
                                            />
                                        </div>

                                        {/* Status */}
                                        <div style={{ width: "100%", paddingBottom: "0px" }} className="input-field col s6">
                                            <span className="active">Status</span>
                                            <select
                                                {...register("is_active")}
                                                className="w-full border-b-2 h-10 text-gray-900 outline-none"
                                            >
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <div className="flex justify-end items-end gap-2">
                                        {editingCoupon && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="text-white font-bold py-2 px-4 rounded mt-4 sm:hidden"
                                                style={{ backgroundColor: "#6b7280" }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isAddingCoupon || isUpdatingCoupon}
                                            className="text-white font-bold py-2 px-4 rounded mt-4"
                                            style={{ backgroundColor: "#ff0000" }}
                                        >
                                            {isAddingCoupon || isUpdatingCoupon
                                                ? editingCoupon ? "Updating..." : "Saving..."
                                                : editingCoupon ? "Update Coupon" : "Save Coupon"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {/* ─── ALL COUPONS TABLE ─── */}
                            <div className="tab-inn" >
                                <div style={{borderBottom: "none"}}
                                 className="inn-title">
                                    <div className="flex flex-row justify-between items-center mb-4">
                                        <div>
                                            <h4 className="text-2xl font-bold mb-1">All Coupons</h4>
                                            <p className="text-gray-500">Manage existing coupons</p>
                                        </div>
                                        <span
                                            className="text-sm font-semibold px-3 py-1 rounded-full"
                                            style={{ backgroundColor: "#fff0f0", color: "#ff0000" }}
                                        >
                                            {Array.isArray(coupons) ? coupons.length : 0} Total
                                        </span>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div
                                            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                                            style={{ borderColor: "#ff0000", borderTopColor: "transparent" }}
                                        />
                                    </div>
                                ) : !Array.isArray(coupons) || coupons.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <p className="text-gray-500 font-medium">No coupons found</p>
                                        <p className="text-gray-400 text-sm mt-1">Add your first coupon using the form above</p>
                                    </div>
                                ) : (
                                    <div
                                        className="overflow-x-auto overflow-y-auto rounded-lg border border-gray-100"
                                        style={{
                                            maxHeight: "200px",
                                        }}
                                    >
                                        <table className="w-full text-sm text-left">
                                            <thead className="sticky top-0 z-10 bg-white">
                                                <tr style={{ backgroundColor: "#fff5f5", borderBottom: "2px solid #ff0000" }}>
                                                    <th className="px-4 py-3 font-semibold text-gray-700">Sl No.</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-700">Coupon Code</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-700">Value</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coupons.map((item, index) => (
                                                    <tr
                                                        key={item._id || item.id || index}
                                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                        style={
                                                            editingCoupon && (editingCoupon._id || editingCoupon.id) === (item._id || item.id)
                                                                ? { backgroundColor: "#fff8f8" }
                                                                : {}
                                                        }
                                                    >
                                                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                                                        <td className="px-4 py-3">
                                                            <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs tracking-wider">
                                                                {item.code}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span
                                                                className="px-2 py-1 rounded-full text-xs font-semibold"
                                                                style={
                                                                    item.discount_type === "PERCENT"
                                                                        ? { backgroundColor: "#eff6ff", color: "#2563eb" }
                                                                        : { backgroundColor: "#f0fdf4", color: "#16a34a" }
                                                                }
                                                            >
                                                                {item.discount_type === "PERCENT" ? "Percentage" : "Flat"}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                                            {item.discount_type === "PERCENT"
                                                                ? `${item.discount_value}%`
                                                                : `₹${item.discount_value}`}
                                                        </td>

                                                        {/* Status Toggle */}
                                                        {/* <td className="px-4 py-3">
                            <button
                              onClick={() => handleStatusToggle(item)}
                              className="flex items-center gap-2 focus:outline-none group"
                              title={item.is_active ? "Click to deactivate" : "Click to activate"}
                            >
                             
                              <div
                                className="relative w-11 h-6 rounded-full transition-colors duration-300"
                                style={{
                                  backgroundColor: item.is_active ? "#ff0000" : "#d1d5db",
                                }}
                              >
                                <div
                                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                                  style={{
                                    transform: item.is_active ? "translateX(22px)" : "translateX(4px)",
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium"
                                style={{ color: item.is_active ? "#ff0000" : "#9ca3af" }}
                              >
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </button>
                          </td> */}
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => handleStatusToggle(item)}
                                                                type="button"
                                                                className="flex items-center gap-3 border-0 bg-transparent focus:outline-none"
                                                                title={
                                                                    item.is_active
                                                                        ? "Click to deactivate"
                                                                        : "Click to activate"
                                                                }
                                                            >
                                                                {/* Toggle */}
                                                                <div
                                                                    className={`
                                                                        relative w-12 h-6 rounded-full
                                                                        transition-all duration-300 ease-in-out
                                                                        ${item.is_active ? "bg-red-500" : "bg-gray-300"}
                                                                    `}
                                                                >
                                                                    <div
                                                                        className={`
                                                                        absolute top-[2px] left-[2px]
                                                                        w-5 h-5 bg-white rounded-full shadow-md
                                                                        transition-all duration-300 ease-in-out
                                                                        ${item.is_active ? "translate-x-6" : ""}
                                                                        `}
                                                                    />
                                                                </div>

                                                                {/* Status Text */}
                                                                <span
                                                                    className={`
                                                                    text-sm font-medium transition-colors duration-300
                                                                    ${item.is_active
                                                                            ? "text-red-500"
                                                                            : "text-gray-400"
                                                                        }
                                                                        `}
                                                                >
                                                                    {item.is_active ? "Active" : "Inactive"}
                                                                </span>
                                                            </button>
                                                        </td>

                                                        {/* Edit Action */}
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                                                                style={{
                                                                    backgroundColor:
                                                                        editingCoupon &&
                                                                            (editingCoupon._id || editingCoupon.id) === (item._id || item.id)
                                                                            ? "#ff0000"
                                                                            : "#fff0f0",
                                                                    color:
                                                                        editingCoupon &&
                                                                            (editingCoupon._id || editingCoupon.id) === (item._id || item.id)
                                                                            ? "#ffffff"
                                                                            : "#ff0000",
                                                                }}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                {editingCoupon &&
                                                                    (editingCoupon._id || editingCoupon.id) === (item._id || item.id)
                                                                    ? "Editing..."
                                                                    : "Edit"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>



                    </div>
                </div>
            </div>
        </>
    );
}