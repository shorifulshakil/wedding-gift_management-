import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

interface DemoUser {
  email: string;
  name: string;
  demo: boolean;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  demoUser: DemoUser | null;
}

const Ctx = createContext<AuthCtx>({ 
  user: null, 
  session: null, 
  loading: false, 
  signOut: async () => {},
  demoUser: null 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    // Check for demo session first
    const demoSession = localStorage.getItem('wedding_gift_demo_session');
    if (demoSession) {
      try {
        setDemoUser(JSON.parse(demoSession));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('wedding_gift_demo_session');
      }
    }

    // If Supabase not configured, skip auth
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { 
    // Clear demo session
    localStorage.removeItem('wedding_gift_demo_session');
    setDemoUser(null);
    
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signOut, demoUser }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
