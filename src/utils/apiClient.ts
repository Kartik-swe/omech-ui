import { message } from 'antd';
import Cookies from 'js-cookie';
import { deviceHeaders, getDeviceKey } from './device';
export interface ApiResponse<T = any> {
    msgId: number;
    msg: string;
    data?: T;
  }
  
  /**
   * A reusable function for making API requests.
   * @param url The endpoint URL
   * @param method The HTTP method (GET, POST, PUT, DELETE)
   * @param body The request body (optional)
   * @param headers Additional headers (optional)
   * @returns The standardized API response
   */
  export const apiClient = async <T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, any>,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> => {
    try {
      // Get JWT token from localStorage
    const token = Cookies.get("token");
      // Chekc token and redirec to login
    if (!token) {
      message.error("Unauthorized. Please log in.");
      console.warn("No token found. Redirecting to login...");
      handleLogout();
      return {
        msgId: -1,
        msg: "Unauthorized. Please log in.",
      };
    }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // Add token if available
          ...deviceHeaders(), // registered phones only; office browsers send nothing extra
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
  
       // Check if token is expired (Unauthorized response)
    if (response.status === 401) {
      console.warn("Token expired or invalid. Logging out...");
      handleLogout();
      return {
        msgId: -1,
        msg: "Session expired. Please log in again.",
      };
    }

    // handle 403
    if (response.status === 403) {
      message.error("Forbidden. You do not have permission to access this resource.");
      handleLogout();
      return {
        msgId: -1,
        msg: "Forbidden. You do not have permission to access this resource.",
      };
    }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
  
      // A registered phone whose approval has expired / been revoked gets the
      // plain-text "Access denied" reply: send it to /login, which explains
      // what happened and lets the user request access again.
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && getDeviceKey()) {
        const text = await response.text();
        if (text.startsWith('Access denied')) {
          handleLogout();
          return { msgId: -1, msg: 'This device no longer has access. Please check with your admin.' };
        }
        throw new Error(text || `Unexpected response (${response.status})`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Client Error (${url}):`, error.message);
  
      // Return a standardized error response
      return {
        msgId: -1,
        msg: error.message || 'An unknown error occurred',
      };
    }
  };
  
  // Function to handle logout
const handleLogout = () => {
  Cookies.remove("token");
  Cookies.remove("user");
  window.location.href = "/login"; // Redirect to login page
};