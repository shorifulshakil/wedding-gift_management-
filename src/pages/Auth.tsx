import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart } from "lucide-react";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(5, "Phone required").max(30),
  dob: z.string().min(1, "Date of birth required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

// Demo user storage
const DEMO_USERS_KEY = 'wedding_gift_demo_users';

const getDemoUsers = (): Record<string, { password: string; name: string }> => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveDemoUser = (email: string, password: string, name: string) => {
  const users = getDemoUsers();
  users[email.toLowerCase()] = { password, name };
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTab = params.get("mode") === "signup" ? "signup" : "login";
  const [tab, setTab] = useState(initialTab);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);

    let error: string | null = null;

    if (isSupabaseConfigured && supabase) {
      const { error: supabaseError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { name: parsed.data.name, phone: parsed.data.phone, dob: parsed.data.dob },
        },
      });
      error = supabaseError?.message || null;
    } else {
      // Demo mode: save user locally
      const users = getDemoUsers();
      if (users[parsed.data.email.toLowerCase()]) {
        error = "An account with this email already exists";
      } else {
        saveDemoUser(parsed.data.email, parsed.data.password, parsed.data.name);
        // Auto-login in demo mode
        const demoSession = {
          email: parsed.data.email.toLowerCase(),
          name: parsed.data.name,
          demo: true
        };
        localStorage.setItem('wedding_gift_demo_session', JSON.stringify(demoSession));
        // Force auth refresh
        window.dispatchEvent(new Event('demo-login'));
      }
    }

    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Account created! You're signed in.");
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);

    let error: string | null = null;

    if (isSupabaseConfigured && supabase) {
      const { error: supabaseError } = await supabase.auth.signInWithPassword({ 
        email: parsed.data.email, 
        password: parsed.data.password 
      });
      error = supabaseError?.message || null;
    } else {
      // Demo mode: verify against local storage
      const users = getDemoUsers();
      const user = users[parsed.data.email.toLowerCase()];
      if (!user) {
        error = "No account found with this email. Create one first!";
      } else if (user.password !== parsed.data.password) {
        error = "Incorrect password";
      } else {
        // Auto-login in demo mode
        localStorage.setItem('wedding_gift_demo_session', JSON.stringify({
          email: parsed.data.email.toLowerCase(),
          name: user.name,
          demo: true
        }));
      }
    }

    setBusy(false);
    if (error) { toast.error(error); return; }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" fill="currentColor" />
          <span className="font-display text-xl">Wedding Gift Manager</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-3xl text-center mb-1">Welcome</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Manage your wedding gifts in one place.</p>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="li-password">Password</Label>
                  <Input id="li-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="name" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="su-phone">Phone</Label>
                  <Input id="su-phone" name="phone" required maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="su-dob">Date of birth</Label>
                  <Input id="su-dob" name="dob" type="date" required />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" name="password" type="password" required minLength={6} />
                </div>
                <div>
                  <Label htmlFor="su-confirm">Confirm password</Label>
                  <Input id="su-confirm" name="confirmPassword" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
