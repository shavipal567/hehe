import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const subRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession()
    .then(({ data, error }) => {
      console.log("INITIAL SESSION:", data.session);
      console.log("GET SESSION ERROR:", error);

      setSession(data.session);
      setUser(data.session?.user ?? null);
    })
    .finally(() => {
      setAuthLoading(false);
    });
   const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  console.log("AUTH EVENT:", event);
  console.log("SESSION:", session);

  setSession(session);
  setUser(session?.user ?? null);
});

subRef.current = subscription;

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
