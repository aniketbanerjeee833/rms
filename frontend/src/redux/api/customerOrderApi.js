import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const customerOrderApi = createApi({
  reducerPath: "customerOrderApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://192.168.0.101:4000/api/customer/",
    credentials: "include",
  }),

  tagTypes: ["CustomerSession", "CustomerOrder"],

  endpoints: (builder) => ({
    // Scan table QR
    // scanTable: builder.mutation({
    //   query: ({ qr_slug, deviceId }) => ({
    //     url: `scan/${qr_slug}`,
    //     method: "POST",
    //   }),
    //   invalidatesTags: ["CustomerSession"],
    // }),
    scanTable: builder.mutation({
  query: ({ qr_slug, deviceId }) => ({
    url: `/scan/${qr_slug}`,
    method: "POST",
    body: {
      deviceId,
    },
  }),
  invalidatesTags: ["CustomerSession"],
}),
// scanTable: builder.mutation({
//   query: ({ qr_slug, deviceId, location }) => ({
//     url: `/scan/${qr_slug}`,
//     method: "POST",
//     body: {
//       deviceId,
//       location,
//     },
//   }),
// }),

    // Get current session + current order
    getSession: builder.query({
      query: (token) => `session/${token}`,
      providesTags: ["CustomerSession", "CustomerOrder"],
    }),

    // Place customer order
    placeCustomerOrder: builder.mutation({
      query: ({ token, items }) => ({
        url: `session/${token}/orders`,
        method: "POST",
        body: { items },
      }),
      invalidatesTags: ["CustomerSession", "CustomerOrder"],
    }),
  }),
});

export const {
  useScanTableMutation,
  useGetSessionQuery,
  usePlaceCustomerOrderMutation,
} = customerOrderApi;