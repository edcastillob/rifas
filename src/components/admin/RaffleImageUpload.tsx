import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface RaffleImageUploadProps {
  raffleId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

export const RaffleImageUpload = ({ raffleId, currentUrl, onUploaded }: RaffleImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${raffleId}/cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("raffle-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      // Update raffle record
      const { error: updateError } = await supabase
        .from("raffles")
        .update({ imagen_url: publicUrl })
        .eq("id", raffleId);

      if (updateError) throw updateError;

      setPreview(publicUrl);
      onUploaded(publicUrl);
      toast.success("Imagen subida exitosamente");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Imagen de la Rifa
      </Label>
      <p className="text-xs text-muted-foreground">
        Tamaño recomendado: 1080×1080 o 1200×1200 px. Se usará como fondo del tablero visual.
      </p>

      {preview && (
        <div className="relative rounded-lg overflow-hidden border border-border max-w-xs">
          <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => {
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="max-w-xs"
        />
        {uploading && <p className="text-xs text-muted-foreground mt-1">Subiendo imagen...</p>}
      </div>
    </div>
  );
};
