import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Loader2, LayoutGrid } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_visible: boolean;
}

const SortableItem = ({
  section,
  onToggleVisibility,
}: {
  section: HomepageSection;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg mb-2 transition-all ${
        isDragging ? "shadow-lg scale-[1.02] opacity-90 z-50" : ""
      } ${!section.is_visible ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {section.display_order}
          </div>
          <div>
            <p className="font-medium text-foreground">{section.section_name}</p>
            <p className="text-xs text-muted-foreground">{section.section_key}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {section.is_visible ? (
          <Eye className="h-4 w-4 text-success" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
        <Switch
          checked={section.is_visible}
          onCheckedChange={(checked) => onToggleVisibility(section.id, checked)}
        />
      </div>
    </div>
  );
};

const HomepageSections = () => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HomepageSection[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<HomepageSection>;
    }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
    },
  });

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { is_visible: isVisible } });
      toast.success(isVisible ? "Section is now visible" : "Section is now hidden");
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);

      // Optimistic update
      queryClient.setQueryData(["homepage-sections"], newSections);

      // Save new order to database
      setIsSaving(true);
      try {
        await Promise.all(
          newSections.map((section, index) =>
            supabase
              .from("homepage_sections")
              .update({ display_order: index + 1 })
              .eq("id", section.id)
          )
        );
        queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
        toast.success("Section order updated");
      } catch (error) {
        toast.error("Failed to update order");
        queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Homepage Sections</h1>
            <p className="text-muted-foreground">
              Drag to reorder sections. Toggle visibility to show/hide sections on homepage.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Section Order & Visibility
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Sections are displayed in the order shown below. Drag to rearrange.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableItem
                    key={section.id}
                    section={section}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default HomepageSections;
