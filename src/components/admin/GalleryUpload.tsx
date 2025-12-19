import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

const GalleryUpload = ({
  value = [],
  onChange,
  maxImages = 8,
  bucket = "product-images",
  folder = "gallery",
}: GalleryUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }

      onChange([...value, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...value];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    onChange(newUrls);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newUrls = [...value];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
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

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
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
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Click to add images ({value.length}/{maxImages})
              </p>
              <p className="text-xs text-muted-foreground">
                Select multiple images at once
              </p>
            </div>
          )}
        </label>
      )}

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Or paste image URL and press Enter..."
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
              'input[placeholder*="paste image URL"]'
            ) as HTMLInputElement;
            if (input?.value) {
              handleUrlAdd(input.value);
              input.value = "";
            }
          }}
          disabled={value.length >= maxImages}
        >
          Add URL
        </Button>
      </div>
    </div>
  );
};

export default GalleryUpload;
