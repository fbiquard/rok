-- ROK Ahumados — schema de la base de datos
-- Tabla única de pedidos. Cuando crezca, se irán agregando otras (clientes, recetas, etc).

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,                       -- formato "RK-XXXXXX"
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,
  address         TEXT NOT NULL,
  apartment       TEXT,
  neighborhood    TEXT NOT NULL,
  notes           TEXT,
  delivery_at     TIMESTAMPTZ NOT NULL,
  delivery_slot   TEXT NOT NULL,                          -- "12-14", "14-16", etc
  items           JSONB NOT NULL,                         -- [{proteinKey, label, qty}]
  subtotal        INTEGER NOT NULL,                       -- en pesos enteros
  shipping        INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'paid',           -- 'paid'|'preparing'|'out_for_delivery'|'delivered'
  mp_payment_id   TEXT,                                   -- id del pago en Mercado Pago (null antes de pagar)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_delivery_at_idx ON orders (delivery_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
