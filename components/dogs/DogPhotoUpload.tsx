"use client";

import { Button } from "@/components/ui/Button";
import {
  getDogPhotoValidationMessage,
  validateDogPhotoFile,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Camera, PawPrint, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

interface DogPhotoUploadProps {
  existingPhotoUrl?: string | null;
  dogName?: string;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
  onError?: (message: string | null) => void;
  className?: string;
  compact?: boolean;
}

export function DogPhotoUpload({
  existingPhotoUrl,
  dogName = "Dog",
  onFileChange,
  disabled = false,
  error,
  onError,
  className,
  compact = false,
}: DogPhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const displayUrl = previewUrl ?? existingPhotoUrl ?? null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    onFileChange(null);
    onError?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;

    const validation = validateDogPhotoFile(file);
    if (!validation.ok) {
      onError?.(getDogPhotoValidationMessage(validation.code));
      onFileChange(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    onError?.(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    onFileChange(file);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50",
          compact ? "h-40" : "h-48 sm:h-56",
        )}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={`Photo preview for ${dogName}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            unoptimized={displayUrl.startsWith("blob:")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
            <PawPrint className="h-10 w-10" aria-hidden />
            <p className="text-sm">No photo selected</p>
          </div>
        )}

        {selectedFile && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Remove selected photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" aria-hidden />
          {displayUrl ? "Change Photo" : "Add Photo"}
        </Button>
        <p className="text-xs text-stone-500">
          JPG, PNG, or WEBP · Max 10 MB
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
