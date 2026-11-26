-- =============================================================
-- Mercado Artesanal · Correcciones al esquema
-- Borrado lógico de productos y motivo de rechazo de talleres.
-- Se puede correr más de una vez.
-- =============================================================

ALTER TABLE producto  ADD COLUMN IF NOT EXISTS eliminado      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE productor ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
