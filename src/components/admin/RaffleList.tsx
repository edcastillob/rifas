import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Eye, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

interface RaffleListProps {
  raffles: Raffle[];
  loading: boolean;
  onEdit: (raffle: Raffle) => void;
  onRefresh: () => void;
}

export const RaffleList = ({ raffles, loading, onEdit, onRefresh }: RaffleListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generatingWinner, setGeneratingWinner] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("raffles")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Rifa eliminada exitosamente");
      onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la rifa");
    } finally {
      setDeleteId(null);
    }
  };

  const handleGenerateWinner = async (raffleId: string) => {
    try {
      setGeneratingWinner(raffleId);

      const { data: soldTickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("numero")
        .eq("raffle_id", raffleId)
        .eq("estado", "ocupado");

      if (ticketsError) throw ticketsError;

      if (!soldTickets || soldTickets.length === 0) {
        toast.error("No hay tickets vendidos para esta rifa");
        return;
      }

      const randomIndex = Math.floor(Math.random() * soldTickets.length);
      const winnerNumber = soldTickets[randomIndex].numero;

      const { error: updateError } = await supabase
        .from("raffles")
        .update({ 
          ganador_numero: winnerNumber,
          estado: "finalizada" 
        })
        .eq("id", raffleId);

      if (updateError) throw updateError;

      toast.success(`¡Ganador generado! Número: ${winnerNumber}`);
      onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar ganador");
    } finally {
      setGeneratingWinner(null);
    }
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      activa: "default",
      cerrada: "secondary",
      finalizada: "destructive",
    };
    return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando rifas...</div>;
  }

  if (raffles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No hay rifas creadas aún</p>
        <p className="text-sm text-muted-foreground">Haz clic en "Nueva Rifa" para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {raffles.map((raffle) => (
          <div
            key={raffle.id}
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{raffle.nombre}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{raffle.descripcion}</p>
              </div>
              {getStatusBadge(raffle.estado)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <div>
                <span className="text-muted-foreground">Precio:</span>
                <p className="font-semibold">${raffle.precio}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tickets:</span>
                <p className="font-semibold">{raffle.cantidad_tickets}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>
                <p className="font-semibold">{new Date(raffle.fecha).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Hora:</span>
                <p className="font-semibold">{raffle.hora}</p>
              </div>
            </div>

            {raffle.ganador_numero && (
              <div className="bg-accent/10 border border-accent/30 rounded-md p-3 mb-4">
                <p className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Número ganador: {raffle.ganador_numero}
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/raffle/${raffle.id}/tickets`)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver Tickets
              </Button>
              
              {raffle.estado === "activa" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(raffle)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}

              {raffle.estado === "cerrada" && !raffle.ganador_numero && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleGenerateWinner(raffle.id)}
                  disabled={generatingWinner === raffle.id}
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  {generatingWinner === raffle.id ? "Generando..." : "Generar Ganador"}
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteId(raffle.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la rifa y todos sus tickets asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
