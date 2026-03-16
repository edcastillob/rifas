import { Button } from "@/components/ui/button";
import { Download, MessageCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface TicketExport {
  numero: number;
  estado: string;
  comprador_nombre: string | null;
  comprador_telefono: string | null;
  comprador_email: string | null;
  vendedor_nombre: string | null;
  referencia_pago: string | null;
  notas: string | null;
  fecha_compra: string | null;
}

interface ExportToolsProps {
  tickets: TicketExport[];
  raffleName: string;
}

export const ExportTools = ({ tickets, raffleName }: ExportToolsProps) => {
  const soldTickets = tickets.filter(
    (t) => t.estado === "reservado" || t.estado === "ocupado" || t.estado === "pagado"
  );

  const handleExportExcel = () => {
    if (!soldTickets.length) return;

    const data = soldTickets.map((t) => ({
      "Número": t.numero,
      "Estado": t.estado === "pagado" ? "Pagado" : "Reservado",
      "Nombre": t.comprador_nombre || "",
      "Teléfono": t.comprador_telefono || "",
      "Email": t.comprador_email || "",
      "Vendedor": t.vendedor_nombre || "",
      "Ref. Pago": t.referencia_pago || "",
      "Notas": t.notas || "",
      "Fecha Compra": t.fecha_compra ? new Date(t.fecha_compra).toLocaleString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String((row as any)[key] || "").length)),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `${raffleName.replace(/\s/g, "_")}_tickets.xlsx`);
  };

  const handleWhatsAppBroadcast = () => {
    if (!soldTickets.length) return;

    // Generate message with all buyers
    const lines = soldTickets.map(
      (t) => `#${t.numero} - ${t.comprador_nombre} (${t.comprador_telefono})`
    );
    const message = `🎟️ *${raffleName}*\n\nListado de participantes:\n${lines.join("\n")}`;

    // Open WhatsApp with pre-filled message (user picks contact)
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={soldTickets.length === 0}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Exportar Excel ({soldTickets.length})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppBroadcast}
        disabled={soldTickets.length === 0}
        className="gap-2 border-success/50 text-success hover:bg-success/10"
      >
        <MessageCircle className="h-4 w-4" />
        Compartir WhatsApp
      </Button>
    </div>
  );
};
