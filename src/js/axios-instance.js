import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5005",
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  async (config) => {
    let idToken;
    if (firebase.auth().currentUser != null) {
      idToken = await firebase.auth().currentUser.getIdToken();
    } else {
      idToken = null;
    }
    if (idToken) {
      config.headers = {
        Authorization: `Bearer ${idToken}`,
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

export default axiosInstance;
