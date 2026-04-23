import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Cache admin status across hook instances and tabs (session-scoped) to avoid
// repeated edge function calls when navigating between admin pages.
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY_PREFIX = "wsc_admin_check_";

// Module-level in-flight promise so simultaneous mounts share one network call
const inFlight = new Map<string, Promise<boolean>>();

function getCached(userId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const { isAdmin, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return isAdmin;
  } catch {
    return null;
  }
}

function setCached(userId: string, isAdmin: boolean) {
  try {
    sessionStorage.setItem(
      CACHE_KEY_PREFIX + userId,
      JSON.stringify({ isAdmin, timestamp: Date.now() })
    );
  } catch {
    // ignore quota errors
  }
}

async function verifyAdmin(userId: string): Promise<boolean> {
  // Deduplicate concurrent calls
  const existing = inFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Ensure we have a valid session before invoking. If session is missing
        // or token is being refreshed, wait briefly rather than hitting the
        // edge function (which would just return 401 and consume rate limit).
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          // No session yet — wait and retry
          if (attempt < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return false;
        }

        const { data, error } = await supabase.functions.invoke("verify-admin");
        if (!error && data) {
          return data?.isAdmin === true;
        }
        // On error, back off before retrying (handles 429 rate-limits)
      } catch {
        // silent retry
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt)));
      }
    }
    return false;
  })();

  inFlight.set(userId, promise);
  try {
    const result = await promise;
    // Only cache positive results — don't cache "false" because it could be
    // due to transient network/rate-limit issues, not actual non-admin status
    if (result) {
      setCached(userId, result);
    }
    return result;
  } finally {
    inFlight.delete(userId);
  }
}

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        lastUserId.current = null;
        return;
      }

      // Don't re-check the same user
      if (lastUserId.current === user.id) return;
      lastUserId.current = user.id;

      // Use cached value first if available
      const cached = getCached(user.id);
      if (cached !== null) {
        setIsAdmin(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await verifyAdmin(user.id);
      if (!cancelled) {
        setIsAdmin(result);
        setLoading(false);
      }
    };

    if (!authLoading) {
      run();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
