import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { axiosInstance } from "./axiosInstance";

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
      headers?: AxiosRequestConfig["headers"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method = "GET", data, params, headers }) => {
    try {
      // axiosInstance has a fixed "Content-Type: application/json" default
      // header. That's correct for every normal JSON request, but it
      // actively breaks file uploads: a FormData body needs the browser
      // to set its own Content-Type with a generated multipart boundary,
      // and a manually-fixed header prevents that override, so the
      // request goes out malformed and the server never sees the file.
      // Detected here once, centrally, so every current and future
      // FormData-based call is handled correctly without each one having
      // to remember to do this itself.
      const isFormData =
        typeof FormData !== "undefined" && data instanceof FormData;

      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers: isFormData
          ? { ...headers, "Content-Type": undefined }
          : headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
