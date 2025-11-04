import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const RaffleTickets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: raffleData, error: raffleError } = await supabase
        .from("raffles")
        .select("*")
        .eq("id", id!)
        .single();

      if (raffleError) throw raffleError;
      setRaffle(raffleData);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("raffle_id", id!)
        .order("numero", { ascending: true });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!tickets.length) return;

    const soldTickets = tickets.filter(t => t.estado === "ocupado");
    const csvContent = [
      ["Número", "Nombre", "Email", "Teléfono", "Fecha de Compra"],
      ...soldTickets.map(t => [
        t.numero,
        t.comprador_nombre || "",
        t.comprador_email || "",
        t.comprador_telefono || "",
        t.fecha_compra ? new Date(t.fecha_compra).toLocaleString() : ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rifa-${raffle?.nombre}-compradores.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Rifa no encontrada</p>
      </div>
    );
  }

  const soldCount = tickets.filter(t => t.estado === "ocupado").length;
  const soldPercentage = ((soldCount / tickets.length) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Button>

        <Card className="border-primary/20 shadow-card mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{raffle.nombre}</CardTitle>
                <p className="text-muted-foreground">{raffle.descripcion}</p>
              </div>
              <Badge variant={raffle.estado === "activa" ? "default" : "secondary"}>
                {raffle.estado.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendidos</p>
                <p className="text-2xl font-bold text-accent">{soldCount}/{tickets.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Porcentaje</p>
                <p className="text-2xl font-bold text-primary">{soldPercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="text-2xl font-bold">${raffle.precio}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recaudado</p>
                <p className="text-2xl font-bold text-accent">${(Number(raffle.precio) * soldCount).toFixed(2)}</p>
              </div>
            </div>
            <Button onClick={exportData} className="gap-2" disabled={soldCount === 0}>
              <Download className="h-4 w-4" />
              Exportar Compradores
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle>Estado de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`aspect-square flex items-center justify-center rounded-md text-sm font-semibold transition-all ${
                    ticket.estado === "ocupado"
                      ? "bg-destructive/20 text-destructive border-2 border-destructive"
                      : "bg-accent/20 text-accent border-2 border-accent"
                  }`}
                  title={ticket.estado === "ocupado" ? `${ticket.comprador_nombre}\n${ticket.comprador_email}` : "Disponible"}
                >
                  {ticket.numero}
                </div>
              ))}
            </div>

            <div className="flex gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent/20 border-2 border-accent rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive/20 border-2 border-destructive rounded"></div>
                <span>Ocupado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RaffleTickets;
