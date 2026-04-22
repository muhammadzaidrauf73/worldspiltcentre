import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Save,
  Upload,
  Download,
  Boxes,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock_quantity: number | null;
  is_active: boolean | null;
  category_id: string | null;
}

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type BulkAction = "set" | "increase" | "decrease" | "out_of_stock";

const LOW_STOCK_THRESHOLD = 5;

const StockManager = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>("set");
  const [bulkValue, setBulkValue] = useState<number>(0);
  const [confirmImport, setConfirmImport] = useState<{
    rows: { id: string; stock: number; name: string }[];
  } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["stock-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, stock_quantity, is_active, category_id")
        .order("name", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data || []) as ProductRow[];
    },
  });

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    if (filter !== "all") {
      list = list.filter((p) => {
        const s = p.stock_quantity ?? 0;
        if (filter === "out_of_stock") return s <= 0;
        if (filter === "low_stock") return s > 0 && s <= LOW_STOCK_THRESHOLD;
        if (filter === "in_stock") return s > LOW_STOCK_THRESHOLD;
        return true;
      });
    }
    return list;
  }, [products, search, categoryFilter, filter]);

  const stats = useMemo(() => {
    let inStock = 0,
      low = 0,
      out = 0,
      total = 0;
    products.forEach((p) => {
      const s = p.stock_quantity ?? 0;
      total += s;
      if (s <= 0) out++;
      else if (s <= LOW_STOCK_THRESHOLD) low++;
      else inStock++;
    });
    return { inStock, low, out, total, count: products.length };
  }, [products]);

  const dirtyCount = Object.keys(edits).length;

  const setEdit = (id: string, value: number, original: number) => {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === original) {
        delete next[id];
      } else {
        next[id] = Math.max(0, value);
      }
      return next;
    });
  };

  const saveEdits = async () => {
    const entries = Object.entries(edits);
    if (entries.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      // Update one by one (Supabase has no built-in bulk update by id)
      const results = await Promise.all(
        entries.map(([id, qty]) =>
          supabase
            .from("products")
            .update({ stock_quantity: qty })
            .eq("id", id)
        )
      );
      const failed = results.filter((r) => r.error);
      if (failed.length) {
        toast.error(`${failed.length} update(s) failed`);
      } else {
        toast.success(`Updated stock for ${entries.length} product(s)`);
      }
      setEdits({});
      await queryClient.invalidateQueries({ queryKey: ["stock-products"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const discardEdits = () => {
    setEdits({});
    toast.info("Changes discarded");
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(filtered.map((p) => p.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const applyBulk = async () => {
    if (selected.size === 0) {
      toast.error("No products selected");
      return;
    }
    const ids = Array.from(selected);
    const productMap = new Map(products.map((p) => [p.id, p]));

    setSaving(true);
    try {
      const results = await Promise.all(
        ids.map((id) => {
          const current = productMap.get(id)?.stock_quantity ?? 0;
          let next = current;
          if (bulkAction === "set") next = bulkValue;
          else if (bulkAction === "increase") next = current + bulkValue;
          else if (bulkAction === "decrease") next = Math.max(0, current - bulkValue);
          else if (bulkAction === "out_of_stock") next = 0;
          return supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, next) })
            .eq("id", id);
        })
      );
      const failed = results.filter((r) => r.error).length;
      if (failed) {
        toast.error(`${failed} update(s) failed`);
      } else {
        toast.success(`Updated ${ids.length} product(s)`);
      }
      setSelected(new Set());
      setBulkOpen(false);
      setBulkValue(0);
      await queryClient.invalidateQueries({ queryKey: ["stock-products"] });
    } catch (e: any) {
      toast.error(e.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["id", "name", "brand", "price", "stock_quantity"],
      ...products.map((p) => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.brand || "").replace(/"/g, '""')}"`,
        String(p.price),
        String(p.stock_quantity ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${products.length} products`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("CSV is empty");
          return;
        }
        const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
        const idIdx = header.indexOf("id");
        const stockIdx = header.indexOf("stock_quantity");
        if (idIdx === -1 || stockIdx === -1) {
          toast.error("CSV must include 'id' and 'stock_quantity' columns");
          return;
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        const parsed: { id: string; stock: number; name: string }[] = [];
        for (let i = 1; i < lines.length; i++) {
          // simple csv split that respects quoted commas
          const cols = parseCSVLine(lines[i]);
          const id = cols[idIdx]?.trim();
          const stock = parseInt(cols[stockIdx]?.trim() || "0", 10);
          if (!id || isNaN(stock)) continue;
          const product = productMap.get(id);
          if (!product) continue;
          if ((product.stock_quantity ?? 0) !== stock) {
            parsed.push({ id, stock, name: product.name });
          }
        }
        if (parsed.length === 0) {
          toast.info("No stock changes detected in CSV");
          return;
        }
        setConfirmImport({ rows: parsed });
      } catch (err: any) {
        toast.error(err.message || "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyImport = async () => {
    if (!confirmImport) return;
    setSaving(true);
    try {
      const results = await Promise.all(
        confirmImport.rows.map((r) =>
          supabase
            .from("products")
            .update({ stock_quantity: r.stock })
            .eq("id", r.id)
        )
      );
      const failed = results.filter((r) => r.error).length;
      if (failed) toast.error(`${failed} update(s) failed`);
      else toast.success(`Imported stock for ${confirmImport.rows.length} product(s)`);
      setConfirmImport(null);
      await queryClient.invalidateQueries({ queryKey: ["stock-products"] });
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setSaving(false);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someFilteredSelected =
    filtered.some((p) => selected.has(p.id)) && !allFilteredSelected;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Boxes className="h-7 w-7" />
              Stock Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Update stock individually, in bulk, or via CSV
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total products" value={stats.count} />
          <StatCard
            label="In stock"
            value={stats.inStock}
            tone="text-green-600"
          />
          <StatCard
            label="Low stock"
            value={stats.low}
            tone="text-amber-600"
          />
          <StatCard
            label="Out of stock"
            value={stats.out}
            tone="text-destructive"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="md:col-span-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4">
                <Select
                  value={filter}
                  onValueChange={(v) => setFilter(v as StockFilter)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stock levels</SelectItem>
                    <SelectItem value="in_stock">In stock (&gt; {LOW_STOCK_THRESHOLD})</SelectItem>
                    <SelectItem value="low_stock">Low stock (1–{LOW_STOCK_THRESHOLD})</SelectItem>
                    <SelectItem value="out_of_stock">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-muted/50 px-4 py-3 rounded-lg border">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{filtered.length} shown</span>
            {selected.size > 0 && (
              <Badge variant="secondary">{selected.size} selected</Badge>
            )}
            {dirtyCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                {dirtyCount} unsaved
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setBulkOpen(true)}
            >
              Bulk action ({selected.size})
            </Button>
            {dirtyCount > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={discardEdits}>
                  Discard
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save {dirtyCount} change{dirtyCount > 1 ? "s" : ""}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No products match the current filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          allFilteredSelected
                            ? true
                            : someFilteredSelected
                            ? "indeterminate"
                            : false
                        }
                        onCheckedChange={(c) => toggleAll(Boolean(c))}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Brand</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-32">Current</TableHead>
                    <TableHead className="w-36">New stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const original = p.stock_quantity ?? 0;
                    const value =
                      edits[p.id] !== undefined ? edits[p.id] : original;
                    const isDirty = edits[p.id] !== undefined;
                    const status =
                      value <= 0
                        ? "out"
                        : value <= LOW_STOCK_THRESHOLD
                        ? "low"
                        : "in";
                    return (
                      <TableRow
                        key={p.id}
                        className={isDirty ? "bg-amber-500/5" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected.has(p.id)}
                            onCheckedChange={(c) =>
                              toggleOne(p.id, Boolean(c))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm line-clamp-2">
                            {p.name}
                          </div>
                          {!p.is_active && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {p.brand}
                        </TableCell>
                        <TableCell>
                          {status === "out" ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Out
                            </Badge>
                          ) : status === "low" ? (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20">
                              Low
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/20">
                              In stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {original}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                setEdit(p.id, value - 1, original)
                              }
                            >
                              −
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              value={value}
                              onChange={(e) =>
                                setEdit(
                                  p.id,
                                  Math.max(0, Number(e.target.value)),
                                  original
                                )
                              }
                              className="h-8 w-20 tabular-nums"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                setEdit(p.id, value + 1, original)
                              }
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk action dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk update stock</DialogTitle>
            <DialogDescription>
              Apply an action to {selected.size} selected product
              {selected.size > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Action</Label>
              <Select
                value={bulkAction}
                onValueChange={(v) => setBulkAction(v as BulkAction)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set stock to value</SelectItem>
                  <SelectItem value="increase">Increase stock by</SelectItem>
                  <SelectItem value="decrease">Decrease stock by</SelectItem>
                  <SelectItem value="out_of_stock">
                    Mark as out of stock (set to 0)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkAction !== "out_of_stock" && (
              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  type="number"
                  min={0}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulk} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import confirmation */}
      <AlertDialog
        open={!!confirmImport}
        onOpenChange={(o) => !o && setConfirmImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm CSV import</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmImport?.rows.length} product
              {(confirmImport?.rows.length || 0) > 1 ? "s" : ""} will have
              their stock updated. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmImport && (
            <div className="max-h-64 overflow-auto border rounded-md text-sm">
              <table className="w-full">
                <thead className="bg-muted text-xs sticky top-0">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="text-right p-2 w-20">New stock</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmImport.rows.slice(0, 50).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 truncate max-w-xs">{r.name}</td>
                      <td className="p-2 text-right tabular-nums">{r.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {confirmImport.rows.length > 50 && (
                <div className="p-2 text-xs text-muted-foreground text-center border-t">
                  + {confirmImport.rows.length - 50} more
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyImport} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import & Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

const StatCard = ({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: number;
  tone?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${tone}`}>{value.toLocaleString()}</div>
    </CardContent>
  </Card>
);

// Minimal CSV line parser supporting quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export default StockManager;
