import { useState, useRef } from "react";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Plus, GripVertical, Crop, Link, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import ImageCropper from "./ImageCropper";
import { Textarea } from "@/components/ui/textarea";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

interface SortableImageProps {
  url: string;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImage = ({ url, index, onRemove }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square rounded-lg overflow-hidden border-2 bg-muted ${
        isDragging ? "border-primary shadow-lg" : "border-border"
      }`}
    >
      <img
        src={url}
        alt={`Gallery ${index + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-black/60 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Main Badge */}
      {index === 0 && (
        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded font-medium">
          Main
        </span>
      )}

      {/* Order Badge */}
      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
        {index + 1}
      </span>
    </div>
  );
};

const GalleryUpload = ({
  value = [],
  onChange,
  maxImages = 8,
  bucket = "product-images",
  folder = "gallery",
}: GalleryUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const [showBulkUrl, setShowBulkUrl] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id as string);
      const newIndex = value.indexOf(over.id as string);
      const newOrder = arrayMove(value, oldIndex, newIndex);
      onChange(newOrder);
      toast.success("Image order updated");
    }
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image(s)`);
      return;
    }

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to crop queue
    setCropQueue(validFiles);
    setCurrentCropFile(validFiles[0]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);

    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange([...value, urlData.publicUrl]);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }

    // Move to next file in queue
    const nextQueue = cropQueue.slice(1);
    setCropQueue(nextQueue);
    setCurrentCropFile(nextQueue[0] || null);
  };

  const handleCropCancel = () => {
    // Skip current file and move to next
    const nextQueue = cropQueue.slice(1);
    setCropQueue(nextQueue);
    setCurrentCropFile(nextQueue[0] || null);
  };

  const handleSkipCrop = async () => {
    if (!currentCropFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = currentCropFile.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, currentCropFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange([...value, urlData.publicUrl]);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }

    // Move to next file in queue
    const nextQueue = cropQueue.slice(1);
    setCropQueue(nextQueue);
    setCurrentCropFile(nextQueue[0] || null);
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleUrlAdd = (url: string) => {
    if (!url.trim()) return;
    if (value.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    onChange([...value, url.trim()]);
  };

  const handleBulkUrlAdd = () => {
    if (!bulkUrls.trim()) return;
    
    // Split by newlines, commas, or spaces and filter valid URLs
    const urls = bulkUrls
      .split(/[\n,\s]+/)
      .map(url => url.trim())
      .filter(url => {
        if (!url) return false;
        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch {
          // Check if it starts with http or https
          return url.startsWith('http://') || url.startsWith('https://');
        }
      });

    if (urls.length === 0) {
      toast.error("No valid URLs found");
      return;
    }

    const remainingSlots = maxImages - value.length;
    if (urls.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image(s). Found ${urls.length} URLs.`);
      return;
    }

    onChange([...value, ...urls]);
    setBulkUrls("");
    setShowBulkUrl(false);
    toast.success(`Added ${urls.length} image(s)`);
  };

  return (
    <div className="space-y-4">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelect}
        disabled={isUploading || value.length >= maxImages}
        className="hidden"
        id="gallery-upload"
      />

      {/* Image Cropper Dialog */}
      {currentCropFile && (
        <ImageCropper
          imageFile={currentCropFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          maxWidth={800}
          maxHeight={800}
        />
      )}

      {/* Sortable Image Grid */}
      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-2">
              {value.map((url, index) => (
                <SortableImage
                  key={url}
                  url={url}
                  index={index}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info text */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag images to reorder. First image will be the main product image.
        </p>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <label
          htmlFor="gallery-upload"
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors ${
            isUploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">
                Uploading...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <Crop className="h-4 w-4 text-muted-foreground" />
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Click to add images ({value.length}/{maxImages})
              </p>
              <p className="text-xs text-muted-foreground">
                Images will be cropped before upload
              </p>
            </div>
          )}
        </label>
      )}

      {/* Bulk URL Section */}
      <div className="border rounded-lg p-3 bg-secondary/30">
        <button
          type="button"
          onClick={() => setShowBulkUrl(!showBulkUrl)}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span>Add images by URL (paste from other websites)</span>
          </div>
          {showBulkUrl ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showBulkUrl && (
          <div className="mt-3 space-y-3">
            <Textarea
              placeholder={`Paste image URLs here (one per line or comma separated)

Example:
https://www.lahorecentre.com/image1.jpg
https://www.lahorecentre.com/image2.jpg
https://www.lahorecentre.com/image3.jpg`}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              disabled={value.length >= maxImages}
              className="min-h-[120px] text-sm font-mono"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Right-click images on other websites → "Copy image address" → Paste here
              </p>
              <Button
                type="button"
                onClick={handleBulkUrlAdd}
                disabled={value.length >= maxImages || !bulkUrls.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add All URLs
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Single URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Or paste single image URL and press Enter..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleUrlAdd(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
          disabled={value.length >= maxImages}
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const input = document.querySelector(
              'input[placeholder*="paste single image URL"]'
            ) as HTMLInputElement;
            if (input?.value) {
              handleUrlAdd(input.value);
              input.value = "";
            }
          }}
          disabled={value.length >= maxImages}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default GalleryUpload;
