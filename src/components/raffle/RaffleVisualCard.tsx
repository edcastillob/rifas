import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Ticket {
  numero: number;
  estado: string;
}

interface RaffleVisualCardProps {
  imagenUrl: string;
  raffleName: string;
  tickets: Ticket[];
}

const statusColors: Record<string, string> = {
  disponible: "#22c55e",
  libre: "#22c55e",
  reservado: "#eab308",
  ocupado: "#eab308",
  pagado: "#ef4444",
};

export const RaffleVisualCard = ({ imagenUrl, raffleName, tickets }: RaffleVisualCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCard = useCallback(() => {
    return new Promise<void>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const size = 1080;
        canvas.width = size;
        canvas.height = size;

        // Draw background image
        ctx.drawImage(img, 0, 0, size, size);

        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, size, size);

        // Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(raffleName, size / 2, 60);

        // Draw grid of 100 numbers (10x10)
        const gridSize = 10;
        const padding = 60;
        const topOffset = 90;
        const cellSize = (size - padding * 2) / gridSize;
        const gap = 4;

        tickets.slice(0, 100).forEach((ticket) => {
          const idx = ticket.numero - 1;
          const col = idx % gridSize;
          const row = Math.floor(idx / gridSize);
          const x = padding + col * cellSize + gap / 2;
          const y = topOffset + row * cellSize + gap / 2;
          const w = cellSize - gap;
          const h = cellSize - gap;

          // Cell background
          const color = statusColors[ticket.estado] || statusColors.disponible;
          ctx.fillStyle = color + "33"; // 20% opacity
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          
          // Rounded rect
          const r = 6;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Number
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.floor(cellSize * 0.35)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(ticket.numero), x + w / 2, y + h / 2);
        });

        // Legend at bottom
        const legendY = size - 30;
        const legendItems = [
          { label: "Disponible", color: "#22c55e" },
          { label: "Reservado", color: "#eab308" },
          { label: "Pagado", color: "#ef4444" },
        ];
        const legendWidth = 180;
        const startX = (size - legendWidth * 3) / 2;

        legendItems.forEach((item, i) => {
          const lx = startX + i * legendWidth;
          ctx.fillStyle = item.color;
          ctx.fillRect(lx, legendY - 8, 16, 16);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(item.label, lx + 22, legendY + 4);
        });

        resolve();
      };
      img.src = imagenUrl;
    });
  }, [imagenUrl, raffleName, tickets]);

  const handleDownload = async () => {
    await drawCard();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${raffleName.replace(/\s/g, "_")}_tablero.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        Descargar Tablero Visual
      </Button>
      <p className="text-xs text-muted-foreground">
        Genera una imagen 1080×1080 con el tablero de la rifa sobre la imagen de fondo.
      </p>
    </div>
  );
};
