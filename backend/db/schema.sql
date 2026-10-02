-- PharmaLink database schema
-- Running this file DROPS and recreates every table (npm run db:schema).

DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS pharmacies;

-- ---------------------------------------------------------------------------
-- Pharmacies in the network
-- ---------------------------------------------------------------------------
CREATE TABLE pharmacies (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT             NOT NULL,
    address       TEXT             NOT NULL,
    sector        TEXT,
    district      TEXT,
    phone         TEXT,
    latitude      DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude     DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    opens_at      TIME,
    closes_at     TIME,
    is_24h        BOOLEAN          NOT NULL DEFAULT FALSE,
    -- Which existing pharmacy system this pharmacy's stock data comes from
    -- (e.g. 'pos_api', 'csv_export', 'spreadsheet'). PharmaLink reads from the
    -- pharmacy's own system instead of replacing it.
    source_system TEXT             NOT NULL DEFAULT 'manual',
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Medicine catalogue (shared by every pharmacy)
-- ---------------------------------------------------------------------------
CREATE TABLE medicines (
    id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                  TEXT    NOT NULL UNIQUE,   -- display name, e.g. "Paracetamol 500mg Tablets"
    generic_name          TEXT    NOT NULL,
    brand_name            TEXT,
    category              TEXT    NOT NULL,
    dosage_form           TEXT    NOT NULL,          -- tablet, capsule, syrup, cream ...
    strength              TEXT,
    pack_size             TEXT,                      -- what the price refers to, e.g. "Strip of 10"
    requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
    description           TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Inventory: what each pharmacy stocks, at what price
-- ---------------------------------------------------------------------------
CREATE TABLE inventory (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pharmacy_id    INTEGER NOT NULL REFERENCES pharmacies (id) ON DELETE CASCADE,
    medicine_id    INTEGER NOT NULL REFERENCES medicines  (id) ON DELETE CASCADE,
    price          INTEGER NOT NULL CHECK (price >= 0),      -- in RWF, per pack
    quantity       INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    external_sku   TEXT,                                     -- the item's ID in the pharmacy's own system
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),       -- when we last received this row
    UNIQUE (pharmacy_id, medicine_id)
);

CREATE INDEX idx_inventory_medicine  ON inventory (medicine_id, price);
CREATE INDEX idx_medicines_category  ON medicines (lower(category));

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Great-circle distance in kilometres between two points (haversine formula).
CREATE OR REPLACE FUNCTION distance_km(
    lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT 6371 * 2 * asin(least(1, sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2) +
        cos(radians(lat1)) * cos(radians(lat2)) *
        power(sin(radians(lng2 - lng1) / 2), 2)
    )));
$$;

-- Is a pharmacy open right now (Kigali time)? Handles hours that pass midnight.
CREATE OR REPLACE FUNCTION pharmacy_is_open(
    is_24h BOOLEAN, opens_at TIME, closes_at TIME
) RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
    SELECT CASE
        WHEN is_24h THEN TRUE
        WHEN opens_at IS NULL OR closes_at IS NULL THEN NULL
        WHEN opens_at <= closes_at
            THEN (now() AT TIME ZONE 'Africa/Kigali')::time BETWEEN opens_at AND closes_at
        ELSE (now() AT TIME ZONE 'Africa/Kigali')::time >= opens_at
          OR (now() AT TIME ZONE 'Africa/Kigali')::time <= closes_at
    END;
$$;
