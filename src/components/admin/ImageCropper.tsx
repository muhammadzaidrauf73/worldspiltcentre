import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCcw, RotateCw, ZoomIn, Check, X } from "lucide-react";

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper = ({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9,
  maxWidth = 1920,
  maxHeight = 1080,
}: ImageCropperProps) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load the image
  useState(() => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
    });
    reader.readAsDataURL(imageFile);
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, aspectRatio);
      setCrop(initialCrop);
      // Set completedCrop immediately so Apply works on first click
      const pixelCrop: PixelCrop = {
        unit: "px",
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
      };
      setCompletedCrop(pixelCrop);
    },
    [aspectRatio]
  );

  const getCroppedImg = async (): Promise<Blob> => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      throw new Error("Image or crop not ready");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const pixelRatio = window.devicePixelRatio;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Calculate final dimensions
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;

    if (finalWidth > maxWidth) {
      finalHeight = (maxWidth / finalWidth) * finalHeight;
      finalWidth = maxWidth;
    }
    if (finalHeight > maxHeight) {
      finalWidth = (maxHeight / finalHeight) * finalWidth;
      finalHeight = maxHeight;
    }

    canvas.width = Math.floor(finalWidth * pixelRatio);
    canvas.height = Math.floor(finalHeight * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    const rotateRads = (rotate * Math.PI) / 180;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();

    // Create a temporary canvas for the full image with transformations
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("No temp context");

    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;

    tempCtx.translate(centerX, centerY);
    tempCtx.rotate(rotateRads);
    tempCtx.scale(scale, scale);
    tempCtx.translate(-centerX, -centerY);
    tempCtx.drawImage(image, 0, 0);

    // Draw the cropped portion to final canvas
    ctx.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );

    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg();
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop & Resize Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="flex justify-center bg-muted rounded-lg p-2 max-h-[400px] overflow-auto">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxHeight: "350px",
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {scale.toFixed(1)}x
              </Label>
              <Slider
                value={[scale]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={([value]) => setScale(value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Rotate: {rotate}°</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => r - 90)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => r + 90)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate(0)}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !completedCrop}
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Apply Crop"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
