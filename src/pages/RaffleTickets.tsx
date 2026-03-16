import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketGrid } from "@/components/raffle/TicketGrid";
import { TicketAssignment } from "@/components/admin/TicketAssignment";
import { Dashboard } from "@/components/admin/Dashboard";
import { ExportTools } from "@/components/admin/ExportTools";
import { RaffleVisualCard } from "@/components/raffle/RaffleVisualCard";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const RaffleTickets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/auth", { replace: true });
      return;
    }
    if (id) fetchData();
  }, [id, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: rd }, { data: td }] = await Promise.all([
        supabase.from("raffles").select("*").eq("id", id!).single(),
        supabase.from("tickets").select("*").eq("raffle_id", id!).order("numero", { ascending: true }),
      ]);
      setRaffle(rd);
      setTickets(td || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (numero: number) => {
    const ticket = tickets.find(t => t.numero === numero);
    if (ticket) {
      setSelectedTicket(ticket);
      setAssignOpen(true);
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

  const soldTickets = tickets.filter(t => t.estado !== "disponible" && t.estado !== "libre");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel
          </Button>
          <ExportTools tickets={tickets as any} raffleName={raffle.nombre} />
        </div>

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
        </Card>

        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Tablero</TabsTrigger>
            <TabsTrigger value="list">Lista Completa</TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            {(raffle as any).imagen_url && (
              <TabsTrigger value="visual">Visual</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="grid">
            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  Haz clic en un ticket para asignar o editar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TicketGrid
                  tickets={tickets as any}
                  selectable
                  onSelect={handleTicketClick}
                  showBuyerOnHover
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  Tickets Vendidos/Reservados ({soldTickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Ref. Pago</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soldTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No hay tickets vendidos aún
                          </TableCell>
                        </TableRow>
                      ) : (
                        soldTickets.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-bold">{t.numero}</TableCell>
                            <TableCell>
                              <Badge variant={t.estado === "pagado" ? "default" : "secondary"} className="text-xs">
                                {t.estado === "pagado" ? "Pagado" : "Reservado"}
                              </Badge>
                            </TableCell>
                            <TableCell>{t.comprador_nombre}</TableCell>
                            <TableCell>{t.comprador_telefono}</TableCell>
                            <TableCell className="text-muted-foreground">{t.comprador_email || "—"}</TableCell>
                            <TableCell>{(t as any).vendedor_nombre || "—"}</TableCell>
                            <TableCell>{(t as any).referencia_pago || "—"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{(t as any).notas || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {t.fecha_compra ? new Date(t.fecha_compra).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setAssignOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard
              raffleId={raffle.id}
              raffleName={raffle.nombre}
              rafflePrice={Number(raffle.precio)}
            />
          </TabsContent>

          {(raffle as any).imagen_url && (
            <TabsContent value="visual">
              <Card className="border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Tablero Visual</CardTitle>
                </CardHeader>
                <CardContent>
                  <RaffleVisualCard
                    imagenUrl={(raffle as any).imagen_url}
                    raffleName={raffle.nombre}
                    tickets={tickets}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {assignOpen && selectedTicket && (
        <TicketAssignment
          open={assignOpen}
          onClose={() => { setAssignOpen(false); setSelectedTicket(null); }}
          ticket={selectedTicket as any}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default RaffleTickets;
