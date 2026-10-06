import { apiSlice } from "../../api/apiSlice";

interface UploadImageResponse {
  success: boolean;
  message: string;
  data: { url: string };
}

export const uploadsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Takes a raw File, wraps it in FormData. axios detects FormData
    // payloads automatically and sets the correct multipart boundary
    // header itself - it ignores/replaces the JSON Content-Type default
    // configured on axiosInstance for this specific call, so nothing
    // extra needs to be overridden here.
    uploadMealImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "/uploads/meal-image",
          method: "POST",
          data: formData,
        };
      },
      transformResponse: (response: UploadImageResponse) => response.data,
    }),
  }),
});

export const { useUploadMealImageMutation } = uploadsApiSlice;
