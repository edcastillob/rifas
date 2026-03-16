import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RaffleImageUpload } from "./RaffleImageUpload";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

interface RaffleFormProps {
  raffle: Raffle | null;
  onClose: () => void;
}

export const RaffleForm = ({ raffle, onClose }: RaffleFormProps) => {
  const [formData, setFormData] = useState({
    nombre: raffle?.nombre || "",
    precio: raffle?.precio || "",
    cantidad_tickets: raffle?.cantidad_tickets || 100,
    descripcion: raffle?.descripcion || "",
    fecha: raffle?.fecha || "",
    hora: raffle?.hora || "",
    estado: (raffle?.estado || "activa") as "activa" | "cerrada" | "finalizada",
    modo_sorteo: (raffle as any)?.modo_sorteo || "manual",
  });
  const [imagenUrl, setImagenUrl] = useState<string | null>((raffle as any)?.imagen_url || null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio || !formData.cantidad_tickets || !formData.descripcion || !formData.fecha || !formData.hora) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (Number(formData.precio) <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    const selectedDate = new Date(formData.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!raffle && selectedDate < today) {
      toast.error("La fecha debe ser futura");
      return;
    }

    try {
      setLoading(true);

      const raffleData = {
        nombre: formData.nombre,
        precio: Number(formData.precio),
        cantidad_tickets: Number(formData.cantidad_tickets),
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: formData.estado,
      };

      if (raffle) {
        const { error } = await supabase
          .from("raffles")
          .update(raffleData)
          .eq("id", raffle.id);
        if (error) throw error;
        toast.success("Rifa actualizada exitosamente");
      } else {
        const { data: newRaffle, error: raffleError } = await supabase
          .from("raffles")
          .insert(raffleData)
          .select()
          .single();
        if (raffleError) throw raffleError;

        // Create tickets with "disponible" status
        const ticketsToCreate = Array.from({ length: Number(formData.cantidad_tickets) }, (_, i) => ({
          numero: i + 1,
          raffle_id: newRaffle.id,
          estado: "disponible",
        }));

        const { error: ticketsError } = await supabase
          .from("tickets")
          .insert(ticketsToCreate);
        if (ticketsError) throw ticketsError;

        toast.success("Rifa creada exitosamente con " + formData.cantidad_tickets + " tickets");
      }

      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar la rifa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre de la Rifa *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Rifa iPhone 15 Pro"
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio">Precio del Boleto *</Label>
          <Input
            id="precio"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            placeholder="10.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad_tickets">Cantidad de Tickets *</Label>
          <Input
            id="cantidad_tickets"
            type="number"
            min="1"
            max="1000"
            value={formData.cantidad_tickets}
            onChange={(e) => setFormData({ ...formData, cantidad_tickets: Number(e.target.value) || "" })}
            placeholder="100"
            required
            disabled={!!raffle}
          />
          {raffle && (
            <p className="text-xs text-muted-foreground">
              No se puede modificar la cantidad de tickets de una rifa existente
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha de la Rifa *</Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora">Hora de la Rifa *</Label>
          <Input
            id="hora"
            type="time"
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Describe cómo se obtendrá el ganador, premios, términos y condiciones..."
          rows={4}
          required
          maxLength={2000}
        />
      </div>

      {/* Mode */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <Switch
          checked={formData.modo_sorteo === "auto_full"}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, modo_sorteo: checked ? "auto_full" : "manual" })
          }
        />
        <div>
          <Label className="text-sm font-medium">Sortear solo cuando se vendan todos los tickets</Label>
          <p className="text-xs text-muted-foreground">
            El sorteo se habilitará automáticamente cuando el 100% de los tickets estén vendidos
          </p>
        </div>
      </div>

      {/* Image upload (only for existing raffles) */}
      {raffle && (
        <RaffleImageUpload
          raffleId={raffle.id}
          currentUrl={imagenUrl}
          onUploaded={setImagenUrl}
        />
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : raffle ? "Actualizar" : "Crear Rifa"}
        </Button>
      </div>
    </form>
  );
};
