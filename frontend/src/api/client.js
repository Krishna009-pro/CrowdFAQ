import axios from "axios";

const getApiBaseUrl = () => {
  const envBaseUrl = process.env.REACT_APP_API_BASE_URL;

  if (
    envBaseUrl &&
    !envBaseUrl.includes("localhost") &&
    !envBaseUrl.includes("127.0.0.1")
  ) {
    return envBaseUrl;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1/`;
  }

  return "http://localhost:5000/api/v1/";
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
