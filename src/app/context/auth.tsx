"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // Import js-cookie

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // New state for loading
  const router = useRouter();

  useEffect(() => {
    // Check for token in cookies on mount
    const token = Cookies.get("token");
    const userData = Cookies.get("user");

    
    if (token && userData) {
      setUser(JSON.parse(userData)); // Restore user data
    }
    setLoading(false); // Finish loading
  }, []);

  const login = (token: string, userData: any) => {
    Cookies.set("token", token, { expires: 1, secure: true, sameSite: "strict" });
    Cookies.set("user", JSON.stringify(userData), { expires: 1, secure: true, sameSite: "strict" });
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
