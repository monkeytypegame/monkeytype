import Cookies from "js-cookie";
import axios from "axios";

const axiosInstance = axios.create();

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = Cookies.get("accessToken")
      ? Cookies.get("accessToken")
      : null;
    if (accessToken) {
      config.headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    } else {
      config.headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      //console.log("Refreshing access token");
      const refreshToken = Cookies.get("refreshToken")
        ? Cookies.get("refreshToken")
        : null;
      await axios
        .post(
          `/api/refreshToken`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        )
        .then((response) => {
          Cookies.set("accessToken", response.data.accessToken);
          axios.defaults.headers.common["Authorization"] =
            "Bearer " + response.data.accessToken;
        })
        .catch((error) => {
          console.log(error);
          axios.defaults.headers.common["Authorization"] = "Bearer failed";
        });
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
