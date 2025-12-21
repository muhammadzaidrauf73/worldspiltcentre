import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

const ImageUpload = ({ value, onChange, bucket = "product-images", folder = "products" }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id="image-upload"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-contain rounded-lg border border-border bg-white"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors"
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
          )}
        </label>
      )}

      {/* URL Input fallback */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="url"
          placeholder="Or paste image URL..."
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value);
            onChange(e.target.value);
          }}
          className="text-sm"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
