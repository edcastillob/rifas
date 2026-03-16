import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ticket, Calendar, Clock, Check, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { TicketGrid } from "@/components/raffle/TicketGrid";
import type { Database } from "@/integrations/supabase/types";

type TicketType = Database["public"]["Tables"]["tickets"]["Row"];
type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const validatePhone = (phone: string): boolean => {
  const e164 = /^\+[1-9]\d{6,14}$/;
  return e164.test(phone.replace(/\s/g, ""));
};

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
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `raffle_id=eq.${id}`
        }, (payload) => {
          setTickets(prev => prev.map(t => 
            t.id === payload.new.id ? payload.new as TicketType : t
          ));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: raffleData, error: re }, { data: ticketsData, error: te }] = await Promise.all([
        supabase.from("raffles").select("*").eq("id", id!).single(),
        supabase.from("tickets").select("*").eq("raffle_id", id!).order("numero", { ascending: true }),
      ]);
      if (re) throw re;
      if (te) throw te;
      setRaffle(raffleData);
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

    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!formData.telefono.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }

    if (!validatePhone(formData.telefono)) {
      toast.error("Teléfono inválido. Usa formato internacional: +57XXXXXXXXXX, +58XXXXXXXXXX, +1XXXXXXXXXX");
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email inválido");
      return;
    }

    try {
      setPurchasing(true);
      const ticket = tickets.find(t => t.numero === selectedTicket);
      if (!ticket) { toast.error("Número no encontrado"); return; }

      const isAvailable = ticket.estado === "disponible" || ticket.estado === "libre";
      if (!isAvailable) { toast.error("Este número ya está ocupado"); return; }

      const { error } = await supabase
        .from("tickets")
        .update({
          estado: "reservado",
          comprador_nombre: formData.nombre.trim(),
          comprador_email: formData.email.trim() || null,
          comprador_telefono: formData.telefono.trim(),
          fecha_compra: new Date().toISOString(),
        })
        .eq("id", ticket.id)
        .eq("estado", ticket.estado);

      if (error) throw error;
      setPurchased(true);
      toast.success("¡Reserva exitosa! Tu número ha sido reservado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la reserva. Intenta nuevamente.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/20 shadow-glow">
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Reserva Exitosa!</h2>
              <p className="text-muted-foreground">Tu número ha sido reservado</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Tu número:</p>
              <p className="text-6xl font-bold text-primary">{selectedTicket}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Nombre:</strong> {formData.nombre}</p>
              <p><strong>Teléfono:</strong> {formData.telefono}</p>
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
            </div>
            <p className="text-sm text-muted-foreground">
              Comunícate con el administrador para confirmar el pago
            </p>
            <Button onClick={() => navigate("/")} className="w-full">Volver a Rifas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCount = tickets.filter(t => t.estado === "disponible" || t.estado === "libre").length;
  const soldCount = tickets.length - availableCount;
  const progress = tickets.length > 0 ? (soldCount / tickets.length * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a Rifas
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Raffle info + Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Raffle header */}
            <Card className="border-primary/20 shadow-card overflow-hidden">
              {(raffle as any).imagen_url && (
                <div className="h-48 md:h-64 overflow-hidden">
                  <img src={(raffle as any).imagen_url} alt={raffle.nombre} className="w-full h-full object-cover" />
                </div>
              )}
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

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {soldCount} vendidos de {tickets.length}
                    </span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ticket className="h-4 w-4" />
                    <span>{availableCount} disponibles</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(raffle.fecha + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{raffle.hora}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket grid */}
            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle>Selecciona tu Número</CardTitle>
              </CardHeader>
              <CardContent>
                <TicketGrid
                  tickets={tickets}
                  selectable
                  selectedTicket={selectedTicket}
                  onSelect={setSelectedTicket}
                  showBuyerOnHover
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Purchase form */}
          <Card className="border-primary/20 shadow-card h-fit lg:sticky lg:top-20">
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
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono * (formato internacional)</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ej: +57..., +58..., +1...
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!selectedTicket || purchasing}
                >
                  {purchasing ? "Procesando..." : `Reservar por $${raffle.precio}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al reservar, aceptas los términos y condiciones de la rifa
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
