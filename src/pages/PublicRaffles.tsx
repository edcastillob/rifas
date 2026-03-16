import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, Clock, ExternalLink } from "lucide-react";
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

  const handleWhatsAppClick = () => {
    const phoneNumber = "+4145994073";
    const message = "Hola, estoy interesado en obtener más información sobre las rifas";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <p className="text-muted-foreground">Cargando rifas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navbar />
      
      {/* Contenido principal que crece para ocupar el espacio disponible */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Sistema de Gestión de Rifas
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
      </main>

      {/* Footer que se queda abajo sin necesidad de scroll */}
      <footer className="border-t border-primary/10 bg-background/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Desarrollado por <span className="font-semibold text-primary">Ing. Edwar Castillo</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Soluciones tecnológicas profesionales
              </p>
            </div>
            
            <Button 
              onClick={handleWhatsAppClick}
              variant="outline" 
              size="sm"
              className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.165-3.495-8.411"/>
              </svg>
              Contactar por WhatsApp
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicRaffles;