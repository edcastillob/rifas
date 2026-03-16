
-- Drop existing check constraint on tickets.estado
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_estado_check;

-- Add new columns to tickets table
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS vendedor_nombre text,
  ADD COLUMN IF NOT EXISTS referencia_pago text,
  ADD COLUMN IF NOT EXISTS notas text;

-- Add new columns to raffles table
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS imagen_url text,
  ADD COLUMN IF NOT EXISTS modo_sorteo text DEFAULT 'manual';

-- Add new check constraint with all valid statuses
ALTER TABLE public.tickets ADD CONSTRAINT tickets_estado_check 
  CHECK (estado IN ('libre', 'ocupado', 'disponible', 'reservado', 'pagado'));

-- Update existing ticket statuses
UPDATE public.tickets SET estado = 'disponible' WHERE estado = 'libre';
UPDATE public.tickets SET estado = 'reservado' WHERE estado = 'ocupado';

-- Create storage bucket for raffle images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('raffle-images', 'raffle-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for raffle images storage
CREATE POLICY "Anyone can view raffle images" ON storage.objects
FOR SELECT USING (bucket_id = 'raffle-images');

CREATE POLICY "Admins can upload raffle images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'raffle-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can update raffle images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'raffle-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can delete raffle images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'raffle-images' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update the tickets UPDATE RLS policy for public users to support new statuses
DROP POLICY IF EXISTS "Anyone can update tickets" ON public.tickets;
CREATE POLICY "Anyone can update tickets" ON public.tickets
FOR UPDATE USING (estado = 'disponible')
WITH CHECK (
  estado IN ('reservado') 
  AND comprador_nombre IS NOT NULL 
  AND comprador_telefono IS NOT NULL
);
