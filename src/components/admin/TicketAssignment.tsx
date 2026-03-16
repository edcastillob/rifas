import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TicketAssignmentProps {
  open: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    numero: number;
    estado: string;
    comprador_nombre: string | null;
    comprador_email: string | null;
    comprador_telefono: string | null;
    vendedor_nombre: string | null;
    referencia_pago: string | null;
    notas: string | null;
  } | null;
  onSuccess: () => void;
}

const validatePhone = (phone: string): boolean => {
  // E.164: + followed by 7-15 digits
  const e164 = /^\+[1-9]\d{6,14}$/;
  return e164.test(phone.replace(/\s/g, ""));
};

export const TicketAssignment = ({ open, onClose, ticket, onSuccess }: TicketAssignmentProps) => {
  const isEditing = ticket && (ticket.estado === "reservado" || ticket.estado === "ocupado" || ticket.estado === "pagado");
  
  const [form, setForm] = useState({
    comprador_nombre: ticket?.comprador_nombre || "",
    comprador_telefono: ticket?.comprador_telefono || "",
    comprador_email: ticket?.comprador_email || "",
    vendedor_nombre: ticket?.vendedor_nombre || "",
    referencia_pago: ticket?.referencia_pago || "",
    notas: ticket?.notas || "",
    estado: ticket?.estado === "pagado" ? "pagado" : "reservado",
  });
  const [saving, setSaving] = useState(false);

  // Reset form when ticket changes
  useState(() => {
    if (ticket) {
      setForm({
        comprador_nombre: ticket.comprador_nombre || "",
        comprador_telefono: ticket.comprador_telefono || "",
        comprador_email: ticket.comprador_email || "",
        vendedor_nombre: ticket.vendedor_nombre || "",
        referencia_pago: ticket.referencia_pago || "",
        notas: ticket.notas || "",
        estado: ticket.estado === "pagado" ? "pagado" : "reservado",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.comprador_nombre.trim()) {
      toast.error("El nombre del comprador es requerido");
      return;
    }

    if (!form.comprador_telefono.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }

    if (!validatePhone(form.comprador_telefono)) {
      toast.error("Teléfono inválido. Usa formato internacional: +57XXXXXXXXXX");
      return;
    }

    if (form.comprador_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.comprador_email)) {
      toast.error("Email inválido");
      return;
    }

    if (!ticket) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          estado: form.estado,
          comprador_nombre: form.comprador_nombre.trim(),
          comprador_telefono: form.comprador_telefono.trim(),
          comprador_email: form.comprador_email.trim() || null,
          vendedor_nombre: form.vendedor_nombre.trim() || null,
          referencia_pago: form.referencia_pago.trim() || null,
          notas: form.notas.trim() || null,
          fecha_compra: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.success(`Ticket #${ticket.numero} ${isEditing ? "actualizado" : "asignado"} exitosamente`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al asignar ticket");
    } finally {
      setSaving(false);
    }
  };

  const handleFree = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          estado: "disponible",
          comprador_nombre: null,
          comprador_telefono: null,
          comprador_email: null,
          vendedor_nombre: null,
          referencia_pago: null,
          notas: null,
          fecha_compra: null,
        })
        .eq("id", ticket.id);

      if (error) throw error;
      toast.success(`Ticket #${ticket.numero} liberado`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al liberar ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar Ticket #${ticket?.numero}` : `Asignar Ticket #${ticket?.numero}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Comprador *</Label>
              <Input
                value={form.comprador_nombre}
                onChange={(e) => setForm({ ...form, comprador_nombre: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono * (formato internacional)</Label>
              <Input
                value={form.comprador_telefono}
                onChange={(e) => setForm({ ...form, comprador_telefono: e.target.value })}
                placeholder="+57 300 123 4567"
                required
              />
              <p className="text-xs text-muted-foreground">Ej: +57..., +58..., +1...</p>
            </div>

            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                value={form.comprador_email}
                onChange={(e) => setForm({ ...form, comprador_email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input
                value={form.vendedor_nombre}
                onChange={(e) => setForm({ ...form, vendedor_nombre: e.target.value })}
                placeholder="Nombre del vendedor"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referencia de Pago</Label>
              <Input
                value={form.referencia_pago}
                onChange={(e) => setForm({ ...form, referencia_pago: e.target.value })}
                placeholder="Nro. de transferencia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <Button type="button" variant="destructive" onClick={handleFree} disabled={saving} size="sm">
                Liberar Ticket
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : isEditing ? "Actualizar" : "Asignar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
