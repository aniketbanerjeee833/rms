import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";






export const couponApi = createApi({
  reducerPath: "couponApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://192.168.29.2:4000/api/",
    credentials: "include",
  }),
  invalidatesTags: ["Coupon"],
  
  endpoints: (builder) => ({
    addCoupon: builder.mutation({
      query: ( body ) => ({
        url: `coupon/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Coupon"],
    }),
    getAllCoupons: builder.query({
      query: () => `coupon/get-all-coupons`,
      providesTags: ["Coupon"],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, body }) => ({
        url: `coupon/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Coupon"],
    }),
    toggleCouponStatus: builder.mutation({
      query: ({ id }) => ({
        url: `coupon/toggle/status/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation({
      query: ({ id }) => ({
        url: `coupon/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),

//     updateTable: builder.mutation({
//       query: ({ Table_Id, body }) => ({
//         url: `table/update-table/${Table_Id}`,
//         method: "PATCH",
//         body,
//       }),
//       invalidatesTags: ["Table"],
//     }),

 
// getAllTables: builder.query({
//   query: ({ page = null, search = "" } = {}) => {

//     const params = new URLSearchParams();

//     // Only add page if page exists
//     if (page !== null && page !== undefined) {
//       params.append("page", page);
//     }

//     // Only add search if search exists and is not empty
//     if (search && search.trim() !== "") {
//       params.append("search", search.trim());
//     }

//     const queryString = params.toString();

//     return queryString
//       ? `table/get-all-tables?${queryString}`
//       : `table/get-all-tables`;
//   },

//   providesTags: ["Table"],
// }),




  }),
});
export const { useAddCouponMutation ,useGetAllCouponsQuery,useUpdateCouponMutation,
    useToggleCouponStatusMutation,
    useDeleteCouponMutation} = couponApi;
