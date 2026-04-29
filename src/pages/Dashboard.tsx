import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Download, Wallet, Gift, Users } from "lucide-react";
import { z } from "zod";

type GiftType = "money" | "gift";
interface Entry {
  id: string;
  guest_name: string;
  address: string | null;
  type: GiftType;
  amount: number | null;
  gift_description: string | null;
  created_at: string;
}

const DEMO_ENTRIES_KEY = 'wedding_gift_demo_entries';

const getDemoEntries = (): Entry[] => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_ENTRIES_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveDemoEntries = (entries: Entry[]) => {
  localStorage.setItem(DEMO_ENTRIES_KEY, JSON.stringify(entries));
};

const entrySchema = z.object({
  guest_name: z.string().trim().min(1, "Guest name required").max(120),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  type: z.enum(["money", "gift"]),
  amount: z.number().positive().max(99999999).optional(),
  gift_description: z.string().trim().max(500).optional(),
});

const Dashboard = () => {
  const { user, demoUser } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingName, setWeddingName] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | GiftType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  // form state
  const [type, setType] = useState<GiftType>("money");
  const [guestName, setGuestName] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [giftDesc, setGiftDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setType("money");
    setGuestName("");
    setAddress("");
    setAmount("");
    setGiftDesc("");
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (e: Entry) => {
    setEditing(e);
    setType(e.type);
    setGuestName(e.guest_name);
    setAddress(e.address ?? "");
    setAmount(e.amount?.toString() ?? "");
    setGiftDesc(e.gift_description ?? "");
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!user && !demoUser) return;
    
    // Demo mode: load from localStorage
    if (!isSupabaseConfigured) {
      const demoEntries = getDemoEntries();
      // Add sample data if empty
      if (demoEntries.length === 0) {
        const sampleEntries: Entry[] = [
          { id: '1', guest_name: 'Aarav Khan', address: 'Dhaka', type: 'money', amount: 5000, gift_description: null, created_at: new Date().toISOString() },
          { id: '2', guest_name: 'Priya Sharma', address: 'Chittagong', type: 'gift', amount: null, gift_description: 'Saree', created_at: new Date().toISOString() },
          { id: '3', guest_name: 'Rahim Ali', address: 'Sylhet', type: 'money', amount: 10000, gift_description: null, created_at: new Date().toISOString() },
        ];
        saveDemoEntries(sampleEntries);
        setEntries(sampleEntries);
      } else {
        setEntries(demoEntries);
      }
      setWeddingName("My Wedding");
      setLoading(false);
      return;
    }

    // Real Supabase mode
    if (!supabase || !user) return;
    (async () => {
      const { data: weddings } = await supabase
        .from("weddings")
        .select("id, name")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      if (weddings && weddings.length) {
        setWeddingId(weddings[0].id);
        setWeddingName(weddings[0].name);
      }
      await loadEntries();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, demoUser]);

  const loadEntries = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setEntries(getDemoEntries());
      return;
    }
    const { data, error } = await supabase
      .from("guest_entries")
      .select("id, guest_name, address, type, amount, gift_description, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setEntries((data as Entry[]) ?? []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !demoUser) return;
    
    const payload = {
      guest_name: guestName,
      address: address || undefined,
      type,
      amount: type === "money" ? Number(amount) : undefined,
      gift_description: type === "gift" ? giftDesc : undefined,
    };
    const parsed = entrySchema.safeParse(payload);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (type === "money" && (!amount || Number(amount) <= 0)) { toast.error("Enter a valid amount"); return; }
    if (type === "gift" && !giftDesc.trim()) { toast.error("Enter a gift description"); return; }

    setBusy(true);

    // Demo mode: save to localStorage
    if (!isSupabaseConfigured) {
      const currentEntries = getDemoEntries();
      const newEntry: Entry = {
        id: editing?.id || Date.now().toString(),
        guest_name: guestName.trim(),
        address: address.trim() || null,
        type,
        amount: type === "money" ? Number(amount) : null,
        gift_description: type === "gift" ? giftDesc.trim() : null,
        created_at: new Date().toISOString(),
      };
      
      let updatedEntries: Entry[];
      if (editing) {
        updatedEntries = currentEntries.map(e => e.id === editing.id ? newEntry : e);
      } else {
        updatedEntries = [newEntry, ...currentEntries];
      }
      saveDemoEntries(updatedEntries);
      setEntries(updatedEntries);
      setBusy(false);
      toast.success(editing ? "Entry updated" : "Entry added");
      setDialogOpen(false);
      resetForm();
      return;
    }

    // Real Supabase mode
    if (!supabase || !user || !weddingId) {
      setBusy(false);
      return;
    }

    const dbRow = {
      wedding_id: weddingId,
      admin_id: user.id,
      guest_name: guestName.trim(),
      address: address.trim() || null,
      type,
      amount: type === "money" ? Number(amount) : null,
      gift_description: type === "gift" ? giftDesc.trim() : null,
    };

    const { error } = editing
      ? await supabase.from("guest_entries").update(dbRow).eq("id", editing.id)
      : await supabase.from("guest_entries").insert(dbRow);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Entry updated" : "Entry added");
    setDialogOpen(false);
    resetForm();
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    
    // Demo mode
    if (!isSupabaseConfigured) {
      const currentEntries = getDemoEntries();
      const updatedEntries = currentEntries.filter(e => e.id !== id);
      saveDemoEntries(updatedEntries);
      setEntries(updatedEntries);
      toast.success("Entry deleted");
      return;
    }

    // Real Supabase mode
    if (!supabase) return;
    const { error } = await supabase.from("guest_entries").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Entry deleted");
    loadEntries();
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter !== "all" && e.type !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.guest_name.toLowerCase().includes(q) ||
          (e.address?.toLowerCase().includes(q) ?? false) ||
          (e.gift_description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [entries, search, filter]);

  const totalMoney = useMemo(
    () => entries.filter((e) => e.type === "money").reduce((s, e) => s + Number(e.amount ?? 0), 0),
    [entries]
  );
  const totalGifts = useMemo(() => entries.filter((e) => e.type === "gift").length, [entries]);

  const exportCSV = () => {
    const header = ["Guest Name", "Address", "Type", "Amount", "Gift", "Date"];
    const rows = filtered.map((e) => [
      e.guest_name,
      e.address ?? "",
      e.type,
      e.amount ?? "",
      e.gift_description ?? "",
      new Date(e.created_at).toLocaleDateString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wedding-gifts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">WEDDING</p>
            <h1 className="font-display text-4xl uppercase">{weddingName || "MY WEDDING"}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={!entries.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Add entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl uppercase">{editing ? "EDIT ENTRY" : "ADD GUEST ENTRY"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="gn">Guest name *</Label>
                    <Input id="gn" value={guestName} onChange={(e) => setGuestName(e.target.value)} required maxLength={120} />
                  </div>
                  <div>
                    <Label htmlFor="ad">Address</Label>
                    <Textarea id="ad" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} rows={2} />
                  </div>
                  <div>
                    <Label>Type *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as GiftType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="money">Money</SelectItem>
                        <SelectItem value="gift">Gift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {type === "money" ? (
                    <div>
                      <Label htmlFor="am">Amount *</Label>
                      <Input id="am" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="gd">Gift description *</Label>
                      <Textarea id="gd" value={giftDesc} onChange={(e) => setGiftDesc(e.target.value)} required maxLength={500} rows={2} />
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary/90">
                      {busy ? "Saving…" : editing ? "Save changes" : "Add entry"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users} label="Total guests" value={entries.length.toString()} />
          <StatCard icon={Wallet} label="Total money received" value={`৳ ${totalMoney.toLocaleString("en-IN")}`} />
          <StatCard icon={Gift} label="Total gifts" value={totalGifts.toString()} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, address or gift…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="money">Money only</SelectItem>
              <SelectItem value="gift">Gifts only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Money / Gift</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {entries.length === 0 ? "No entries yet. Add your first one!" : "No entries match your search."}
                </TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.guest_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">{e.address ?? "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      e.type === "money" ? "bg-accent/10 text-accent" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {e.type === "money" ? <Wallet className="h-3 w-3" /> : <Gift className="h-3 w-3" />}
                      {e.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {e.type === "money"
                      ? `৳ ${Number(e.amount).toLocaleString("en-IN")}`
                      : <span className="text-sm">{e.gift_description}</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="font-display text-3xl">{value}</div>
  </div>
);

export default Dashboard;
