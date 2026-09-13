// import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.loading) { // Wait until loading is complete
      if (!auth.user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }
  }, [auth.user, auth.loading, router]);

  if (auth.loading || loading) return <p>Loading...</p>; // Prevent flickering

  return <>{children}</>;
};

export default ProtectedRoute;
