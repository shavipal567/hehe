import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const subRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then((result) => {
      const s = result?.data?.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);
    }).catch((e) => {
      console.warn("Failed to restore session:", e);
    }).finally(() => {
      setAuthLoading(false);
    });

    subRef.current = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    }).data.subscription;

    return () => {
      if (subRef.current) subRef.current.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (!error && data?.user) {
      supabase.from("profiles").insert({
        id: data.user.id,
        username: data.user.id,
        display_name: "User",
        total_seconds: 0,
      }).then(({ error: insertError }) => {
        if (insertError) {
          console.warn(
            "Profile fallback skipped (trigger likely handled it):",
            insertError.message
          );
        }
      });
    }

    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = { user, session, authLoading, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
