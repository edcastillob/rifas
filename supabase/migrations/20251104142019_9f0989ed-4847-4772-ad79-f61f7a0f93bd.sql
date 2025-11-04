-- Create enum for raffle status
CREATE TYPE raffle_status AS ENUM ('activa', 'cerrada', 'finalizada');

-- Create raffles table
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
  cantidad_tickets INTEGER NOT NULL CHECK (cantidad_tickets > 0),
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado raffle_status NOT NULL DEFAULT 'activa',
  ganador_numero INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupado')),
  comprador_nombre TEXT,
  comprador_email TEXT,
  comprador_telefono TEXT,
  fecha_compra TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (raffle_id, numero)
);

-- Enable Row Level Security
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Public can read active raffles
CREATE POLICY "Anyone can view active raffles"
  ON public.raffles
  FOR SELECT
  USING (true);

-- Public can read tickets
CREATE POLICY "Anyone can view tickets"
  ON public.tickets
  FOR SELECT
  USING (true);

-- Public can update tickets (for purchasing)
CREATE POLICY "Anyone can update tickets"
  ON public.tickets
  FOR UPDATE
  USING (estado = 'libre')
  WITH CHECK (estado = 'ocupado' AND comprador_nombre IS NOT NULL AND comprador_email IS NOT NULL);

-- Admin can do everything (we'll use a simple approach for now)
-- In production, you'd want proper admin authentication
CREATE POLICY "Service role can manage raffles"
  ON public.raffles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage tickets"
  ON public.tickets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_tickets_raffle_id ON public.tickets(raffle_id);
CREATE INDEX idx_tickets_estado ON public.tickets(estado);
CREATE INDEX idx_raffles_estado ON public.raffles(estado);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for raffles updated_at
CREATE TRIGGER update_raffles_updated_at
  BEFORE UPDATE ON public.raffles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for tickets (so clients can see updates in real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;