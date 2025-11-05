import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const PublicRaffles = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("estado", "activa")
        .order("fecha", { ascending: true });

      if (error) throw error;
      setRaffles(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <p className="text-muted-foreground">Cargando rifas...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Rifas Disponibles
            </h1>
            <p className="text-xl text-muted-foreground">
              Participa y gana increíbles premios
            </p>
          </header>

          {raffles.length === 0 ? (
            <Card className="max-w-2xl mx-auto border-primary/20 shadow-card">
              <CardContent className="py-12 text-center">
                <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">
                  No hay rifas activas en este momento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vuelve pronto para ver nuevas oportunidades
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {raffles.map((raffle) => (
                <Card
                  key={raffle.id}
                  className="border-primary/20 shadow-glow hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/raffle/${raffle.id}`)}
                >
                  <div className="h-2 bg-gradient-primary"></div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-2xl">{raffle.nombre}</CardTitle>
                      <Badge variant="default" className="bg-accent">ACTIVA</Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">{raffle.descripcion}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                      <span className="text-sm text-muted-foreground">Precio del boleto</span>
                      <span className="text-2xl font-bold text-primary">${raffle.precio}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-4 w-4" />
                        <span>{raffle.cantidad_tickets} tickets</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(raffle.fecha).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <Clock className="h-4 w-4" />
                        <span>{raffle.hora}</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Comprar Boleto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicRaffles;
