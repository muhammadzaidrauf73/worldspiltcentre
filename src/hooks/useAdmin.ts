import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CACHE_TTL = 2 * 60 * 1000;

const inFlight = new Map<string, Promise<boolean>>();
const memoryCache = new Map<string, { isAdmin: boolean; timestamp: number }>();

function getCached(userId: string): boolean | null {
  const cached = memoryCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    memoryCache.delete(userId);
    return null;
  }
  return cached.isAdmin;
}

function setCached(userId: string, isAdmin: boolean) {
  memoryCache.set(userId, { isAdmin, timestamp: Date.now() });
}

async function verifyAdmin(userId: string, accessToken: string): Promise<boolean> {
  const cacheKey = `${userId}:${accessToken.slice(-16)}`;
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("verify-admin", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!error && data) {
          return data?.isAdmin === true;
        }
      } catch {
        // silent retry
      }

      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200 * Math.pow(2, attempt)));
      }
    }

    return false;
  })();

  inFlight.set(cacheKey, promise);
  try {
    const result = await promise;
    if (result) {
      setCached(userId, true);
    }
    return result;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export const useAdmin = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastVerifiedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        lastVerifiedRef.current = null;
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Wait until a real authenticated session exists before checking admin.
      // Without this, the edge function can receive the publishable token
      // instead of the user's access token, which causes bad_jwt / missing sub.
      if (!session?.access_token) {
        setLoading(true);
        return;
      }

      const verificationKey = `${user.id}:${session.access_token.slice(-16)}`;
      if (lastVerifiedRef.current === verificationKey) {
        setLoading(false);
        return;
      }

      const cached = getCached(user.id);
      if (cached !== null) {
        lastVerifiedRef.current = verificationKey;
        setIsAdmin(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await verifyAdmin(user.id, session.access_token);

      if (!cancelled) {
        lastVerifiedRef.current = verificationKey;
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
  }, [user, session?.access_token, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
