import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// This page now redirects to the appropriate separate page
const Account = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      
      // Redirect to appropriate page based on tab parameter
      const tab = searchParams.get("tab");
      if (tab === "orders") {
        navigate("/orders", { replace: true });
      } else if (tab === "wishlist") {
        navigate("/wishlist", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    }
  }, [user, authLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Account;
