import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail } from "lucide-react";

interface Ticket {
  id: string;
  numero: number;
  estado: string;
  comprador_nombre: string | null;
  comprador_email: string | null;
  comprador_telefono: string | null;
  vendedor_nombre: string | null;
}

interface TicketGridProps {
  tickets: Ticket[];
  selectable?: boolean;
  selectedTicket?: number | null;
  onSelect?: (numero: number) => void;
  showBuyerOnHover?: boolean;
}

const statusConfig: Record<string, { label: string; bgClass: string; borderClass: string; textClass: string }> = {
  disponible: {
    label: "Disponible",
    bgClass: "bg-success/15",
    borderClass: "border-success/50",
    textClass: "text-success",
  },
  libre: {
    label: "Disponible",
    bgClass: "bg-success/15",
    borderClass: "border-success/50",
    textClass: "text-success",
  },
  reservado: {
    label: "Reservado",
    bgClass: "bg-warning/15",
    borderClass: "border-warning/50",
    textClass: "text-warning",
  },
  ocupado: {
    label: "Reservado",
    bgClass: "bg-warning/15",
    borderClass: "border-warning/50",
    textClass: "text-warning",
  },
  pagado: {
    label: "Pagado",
    bgClass: "bg-destructive/15",
    borderClass: "border-destructive/50",
    textClass: "text-destructive",
  },
};

export const TicketGrid = ({ tickets, selectable = false, selectedTicket, onSelect, showBuyerOnHover = true }: TicketGridProps) => {
  const getConfig = (estado: string) => statusConfig[estado] || statusConfig.disponible;

  const isAvailable = (estado: string) => estado === "disponible" || estado === "libre";
  const isTaken = (estado: string) => !isAvailable(estado);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
        {tickets.map((ticket) => {
          const config = getConfig(ticket.estado);
          const available = isAvailable(ticket.estado);
          const isSelected = selectedTicket === ticket.numero;

          const button = (
            <button
              key={ticket.id}
              onClick={() => selectable && available && onSelect?.(ticket.numero)}
              disabled={selectable && !available}
              className={`
                aspect-square flex items-center justify-center rounded-md text-xs sm:text-sm font-bold
                transition-all duration-200 border-2
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary scale-110 shadow-glow z-10 relative"
                  : `${config.bgClass} ${config.textClass} ${config.borderClass}`
                }
                ${selectable && available && !isSelected
                  ? "hover:scale-105 hover:shadow-md cursor-pointer"
                  : selectable && !available
                  ? "cursor-not-allowed opacity-70"
                  : ""
                }
              `}
            >
              {ticket.numero}
            </button>
          );

          if (showBuyerOnHover && isTaken(ticket.estado) && ticket.comprador_nombre) {
            return (
              <HoverCard key={ticket.id} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  {button}
                </HoverCardTrigger>
                <HoverCardContent className="w-56 p-3" side="top">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">#{ticket.numero}</span>
                      <Badge variant={ticket.estado === "pagado" ? "destructive" : "secondary"} className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{ticket.comprador_nombre}</span>
                      </div>
                      {ticket.comprador_telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{ticket.comprador_telefono}</span>
                        </div>
                      )}
                      {ticket.comprador_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{ticket.comprador_email}</span>
                        </div>
                      )}
                      {ticket.vendedor_nombre && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Vendido por: {ticket.vendedor_nombre}
                        </div>
                      )}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          }

          return button;
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success/15 border-2 border-success/50 rounded" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-warning/15 border-2 border-warning/50 rounded" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-destructive/15 border-2 border-destructive/50 rounded" />
          <span>Pagado</span>
        </div>
      </div>
    </div>
  );
};
