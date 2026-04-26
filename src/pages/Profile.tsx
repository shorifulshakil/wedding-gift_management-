import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [weddingName, setWeddingName] = useState("");
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from("profiles").select("name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("weddings").select("id, name").eq("admin_id", user.id).order("created_at").limit(1),
      ]);
      if (p) { setName(p.name ?? ""); setPhone(p.phone ?? ""); }
      if (w && w.length) { setWeddingId(w[0].id); setWeddingName(w[0].name); }
    })();
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ name, phone });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ name, phone: phone || null }).eq("id", user!.id);
    if (weddingId && weddingName.trim()) {
      await supabase.from("weddings").update({ name: weddingName.trim() }).eq("id", weddingId);
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setNewPassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-4xl mb-8">Profile</h1>

        <form onSubmit={saveProfile} className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h2 className="font-display text-2xl">Account details</h2>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
          <div>
            <Label htmlFor="wn">Wedding name</Label>
            <Input id="wn" value={weddingName} onChange={(e) => setWeddingName(e.target.value)} maxLength={120} />
          </div>
          <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary/90">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>

        <form onSubmit={changePassword} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-display text-2xl">Change password</h2>
          <div>
            <Label htmlFor="np">New password</Label>
            <Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <Button type="submit" disabled={busy || !newPassword} className="bg-primary hover:bg-primary/90">
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Profile;
