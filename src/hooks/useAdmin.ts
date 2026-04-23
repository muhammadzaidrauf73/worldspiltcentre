import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Cache admin status across hook instances to avoid duplicate edge function calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        lastCheckedUserId.current = null;
        return;
      }

      // Skip if we already checked this user
      if (lastCheckedUserId.current === user.id) {
        return;
      }

      // Check cache first
      const cached = adminCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setIsAdmin(cached.isAdmin);
        setLoading(false);
        lastCheckedUserId.current = user.id;
        return;
      }

      lastCheckedUserId.current = user.id;
      setLoading(true);

      // Retry with exponential backoff for transient failures (e.g. 429 rate limits)
      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("verify-admin");

          if (!error && data) {
            const result = data?.isAdmin === true;
            adminCache.set(user.id, { isAdmin: result, timestamp: Date.now() });
            setIsAdmin(result);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Silent — will retry
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
        }
      }

      // All attempts failed
      setIsAdmin(false);
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
