"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { message } from "antd";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Clear cookies
    Cookies.remove("token");
    Cookies.remove("user");

    // Show message
    message.success("Logged out successfully.");

    // Redirect to login page after short delay
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <p className="text-gray-700 text-lg">Logging you out...</p>
    </div>
  );
};

export default LogoutPage;
