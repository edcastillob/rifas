import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ticket, Calendar, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TicketType = Database["public"]["Tables"]["tickets"]["Row"];
type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const RafflePurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });

  useEffect(() => {
    if (id) {
      fetchData();
      
      const channel = supabase
        .channel('tickets-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `raffle_id=eq.${id}`
          },
          (payload) => {
            setTickets(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as TicketType : t
            ));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket) {
      toast.error("Por favor selecciona un número");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.telefono.replace(/\D/g, ''))) {
      toast.error("Por favor ingresa un teléfono válido (10 dígitos)");
      return;
    }

    try {
      setPurchasing(true);

      const ticket = tickets.find(t => t.numero === selectedTicket);
      if (!ticket) {
        toast.error("Número no encontrado");
        return;
      }

      if (ticket.estado === "ocupado") {
        toast.error("Este número ya está ocupado");
        return;
      }

      const { error } = await supabase
        .from("tickets")
        .update({
          estado: "ocupado",
          comprador_nombre: formData.nombre,
          comprador_email: formData.email,
          comprador_telefono: formData.telefono,
          fecha_compra: new Date().toISOString(),
        })
        .eq("id", ticket.id)
        .eq("estado", "libre");

      if (error) throw error;

      setPurchased(true);
      toast.success("¡Compra exitosa! Tu número ha sido reservado");
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la compra. Intenta nuevamente.");
    } finally {
      setPurchasing(false);
    }
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

  if (purchased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 flex items-center justify-center">
        <Card className="max-w-md w-full border-primary/20 shadow-glow">
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Compra Exitosa!</h2>
              <p className="text-muted-foreground mb-4">
                Tu número ha sido reservado exitosamente
              </p>
            </div>
            <div className="bg-primary/5 rounded-lg p-6 space-y-2">
              <p className="text-sm text-muted-foreground">Tu número:</p>
              <p className="text-6xl font-bold text-primary">{selectedTicket}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Nombre:</strong> {formData.nombre}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Teléfono:</strong> {formData.telefono}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Te hemos enviado una confirmación a tu correo electrónico
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Volver a Rifas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCount = tickets.filter(t => t.estado === "libre").length;
  const soldPercentage = (((tickets.length - availableCount) / tickets.length) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Rifas
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <CardTitle className="text-2xl">{raffle.nombre}</CardTitle>
                  <Badge variant="default" className="bg-accent">ACTIVA</Badge>
                </div>
                <p className="text-muted-foreground">{raffle.descripcion}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <span className="text-sm text-muted-foreground">Precio del boleto</span>
                  <span className="text-3xl font-bold text-primary">${raffle.precio}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Disponibles:</span>
                    <span className="font-semibold text-accent">{availableCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Vendidos:</span>
                    <span className="font-semibold">{soldPercentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(raffle.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{raffle.hora}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle>Selecciona tu Número</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => ticket.estado === "libre" && setSelectedTicket(ticket.numero)}
                      disabled={ticket.estado === "ocupado"}
                      className={`aspect-square flex items-center justify-center rounded-md text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        ticket.estado === "ocupado"
                          ? "bg-destructive/20 text-destructive border-2 border-destructive"
                          : selectedTicket === ticket.numero
                          ? "bg-primary text-primary-foreground border-2 border-primary scale-110"
                          : "bg-accent/20 text-accent border-2 border-accent hover:bg-accent/30 hover:scale-105"
                      }`}
                    >
                      {ticket.numero}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 mt-4 text-sm">
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

          <Card className="border-primary/20 shadow-card h-fit">
            <CardHeader>
              <CardTitle>Datos del Comprador</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePurchase} className="space-y-4">
                {selectedTicket && (
                  <div className="bg-primary/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Número seleccionado:</p>
                    <p className="text-4xl font-bold text-primary">{selectedTicket}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!selectedTicket || purchasing}
                >
                  {purchasing ? "Procesando..." : `Comprar por $${raffle.precio}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al comprar, aceptas los términos y condiciones de la rifa
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RafflePurchase;
