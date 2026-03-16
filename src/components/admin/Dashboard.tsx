import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Ticket, DollarSign, TrendingUp, Users, BarChart3, Trophy } from "lucide-react";

interface DashboardProps {
  raffleId: string;
  raffleName: string;
  rafflePrice: number;
}

interface TicketData {
  estado: string;
  vendedor_nombre: string | null;
  fecha_compra: string | null;
  created_at: string | null;
}

interface SellerStat {
  name: string;
  count: number;
  revenue: number;
}

export const Dashboard = ({ raffleId, raffleName, rafflePrice }: DashboardProps) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [raffleId]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("estado, vendedor_nombre, fecha_compra, created_at")
      .eq("raffle_id", raffleId);

    if (!error && data) setTickets(data);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Cargando estadísticas...</div>;

  const total = tickets.length;
  const disponibles = tickets.filter(t => t.estado === "disponible" || t.estado === "libre").length;
  const reservados = tickets.filter(t => t.estado === "reservado" || t.estado === "ocupado").length;
  const pagados = tickets.filter(t => t.estado === "pagado").length;
  const vendidos = reservados + pagados;
  const progreso = total > 0 ? (vendidos / total) * 100 : 0;
  const ingresos = pagados * rafflePrice;
  const ingresosPotenciales = vendidos * rafflePrice;

  // Conversion rate
  const conversionRate = vendidos > 0 ? (pagados / vendidos) * 100 : 0;

  // Sales velocity (tickets sold per day since first sale)
  const salesDates = tickets
    .filter(t => t.fecha_compra)
    .map(t => new Date(t.fecha_compra!).getTime())
    .sort();
  const firstSale = salesDates[0];
  const daysSinceFirst = firstSale ? Math.max(1, Math.ceil((Date.now() - firstSale) / (1000 * 60 * 60 * 24))) : 1;
  const velocity = vendidos / daysSinceFirst;

  // Top sellers
  const sellerMap = new Map<string, SellerStat>();
  tickets.forEach(t => {
    if ((t.estado === "reservado" || t.estado === "ocupado" || t.estado === "pagado") && t.vendedor_nombre) {
      const existing = sellerMap.get(t.vendedor_nombre) || { name: t.vendedor_nombre, count: 0, revenue: 0 };
      existing.count++;
      if (t.estado === "pagado") existing.revenue += rafflePrice;
      sellerMap.set(t.vendedor_nombre, existing);
    }
  });
  const topSellers = Array.from(sellerMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

  const stats = [
    { label: "Total Tickets", value: total, icon: Ticket, color: "text-primary" },
    { label: "Disponibles", value: disponibles, icon: Ticket, color: "text-success" },
    { label: "Reservados", value: reservados, icon: Users, color: "text-warning" },
    { label: "Pagados", value: pagados, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard: {raffleName}</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Confirmados (pagados)</p>
              <p className="text-3xl font-bold text-success">${ingresos.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potenciales (reservados + pagados)</p>
              <p className="text-xl font-semibold text-muted-foreground">${ingresosPotenciales.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progreso de Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{vendidos} de {total} vendidos</span>
                <span className="font-semibold">{progreso.toFixed(1)}%</span>
              </div>
              <Progress value={progreso} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Velocidad</p>
                <p className="font-semibold">{velocity.toFixed(1)} tickets/día</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversión</p>
                <p className="font-semibold">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      {topSellers.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              Ranking de Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSellers.map((seller, i) => (
                <div key={seller.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${i === 0 ? "text-warning" : i === 1 ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                      #{i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-xs text-muted-foreground">{seller.count} tickets vendidos</p>
                    </div>
                  </div>
                  <Badge variant="outline">${seller.revenue.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
