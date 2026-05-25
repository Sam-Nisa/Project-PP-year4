import axios from "axios";
import config from "./config";

/**
 * Generic API request function for JWT.
 */
export const request = (url = "", method = "POST", data = {}, customConfig = {}, token = null) => {
  const isFormData = data instanceof FormData;

  return axios({
    url: `${config.base_url}${url}`,
    method: method.toUpperCase(), // ensure method is uppercase
    data: method.toUpperCase() === "GET" ? undefined : data,
    params: method.toUpperCase() === "GET" ? data : undefined,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customConfig.headers,
    },
    ...customConfig,
  })
    .then((res) => res.data)
    .catch((error) => {
      if (error.response) {
        console.error("API response error:", error.response.data || error.response.statusText);
        
        // Handle 401 Unauthorized globally
        if (error.response.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Request setup error:", error.message);
      }
      throw error;
    });
};
