CREATE TABLE IF NOT EXISTS booking_folio_lines (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind in ('service', 'custom', 'discount')),

  name TEXT NOT NULL,
  description TEXT,

  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 1),
  unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),

  line_total INTEGER NOT NULL DEFAULT 0,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_folio_lines_booking_id_idx ON booking_folio_lines(booking_id);
CREATE INDEX IF NOT EXISTS booking_folio_lines_kind_idx ON booking_folio_lines(kind);
