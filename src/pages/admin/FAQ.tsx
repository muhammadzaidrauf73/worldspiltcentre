import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, HelpCircle, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface FAQForm {
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: FAQForm = {
  question: "",
  answer: "",
  display_order: 0,
  is_active: true,
};

const AdminFAQ = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FAQForm) => {
      if (editingId) {
        const { error } = await supabase
          .from("faqs")
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("faqs").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success(editingId ? "FAQ updated" : "FAQ created");
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error) => {
      toast.error("Error saving FAQ: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ deleted");
    },
    onError: (error) => {
      toast.error("Error deleting FAQ: " + error.message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("faqs")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
  });

  const handleEdit = (faq: any) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    saveMutation.mutate(form);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const currentFaq = faqs[index];
    const prevFaq = faqs[index - 1];
    
    reorderMutation.mutate({ id: currentFaq.id, newOrder: prevFaq.display_order });
    reorderMutation.mutate({ id: prevFaq.id, newOrder: currentFaq.display_order });
  };

  const handleMoveDown = (index: number) => {
    if (index === faqs.length - 1) return;
    const currentFaq = faqs[index];
    const nextFaq = faqs[index + 1];
    
    reorderMutation.mutate({ id: currentFaq.id, newOrder: nextFaq.display_order });
    reorderMutation.mutate({ id: nextFaq.id, newOrder: currentFaq.display_order });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="h-8 w-8" />
              FAQ Management
            </h1>
            <p className="text-muted-foreground">
              Manage frequently asked questions displayed on the website
            </p>
          </div>
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingId(null);
                setForm(emptyForm);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Input
                    id="question"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    placeholder="Enter the question..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Answer *</Label>
                  <Textarea
                    id="answer"
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    placeholder="Enter the answer..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={form.display_order}
                      onChange={(e) =>
                        setForm({ ...form, display_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-7">
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="hidden md:table-cell">Answer</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No FAQs found. Add your first FAQ.
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq: any, index: number) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === faqs.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {faq.question}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                      {faq.answer}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          faq.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {faq.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(faq)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this FAQ?")) {
                              deleteMutation.mutate(faq.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFAQ;
