-- Create tables for SweetSalt Bahan Baku Inventory System

-- Drop tables if they already exist (optional, use with caution)
-- DROP TABLE IF EXISTS riwayat_aktivitas CASCADE;
-- DROP TABLE IF EXISTS bahan_baku CASCADE;

-- 1. Table: bahan_baku
CREATE TABLE IF NOT EXISTS bahan_baku (
    id SERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    satuan TEXT NOT NULL,
    stok NUMERIC NOT NULL DEFAULT 0 CHECK (stok >= 0),
    pakai NUMERIC NOT NULL DEFAULT 0 CHECK (pakai >= 0),
    via TEXT NOT NULL DEFAULT 'offline' CHECK (via IN ('online', 'offline')),
    kirim INTEGER NOT NULL DEFAULT 0 CHECK (kirim >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE bahan_baku ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for now (or public access)
-- Note: In a production environment, you should secure these policies with authenticated users.
CREATE POLICY "Allow public read access on bahan_baku" ON bahan_baku FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on bahan_baku" ON bahan_baku FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on bahan_baku" ON bahan_baku FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on bahan_baku" ON bahan_baku FOR DELETE USING (true);


-- 2. Table: riwayat_aktivitas
CREATE TABLE IF NOT EXISTS riwayat_aktivitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe TEXT NOT NULL CHECK (tipe IN ('pakai', 'beli')),
    bahan_id INTEGER REFERENCES bahan_baku(id) ON DELETE SET NULL,
    nama_bahan TEXT NOT NULL,
    jumlah NUMERIC NOT NULL CHECK (jumlah > 0),
    satuan TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE riwayat_aktivitas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions
CREATE POLICY "Allow public read access on riwayat_aktivitas" ON riwayat_aktivitas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on riwayat_aktivitas" ON riwayat_aktivitas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on riwayat_aktivitas" ON riwayat_aktivitas FOR DELETE USING (true);


-- 3. Seed Initial Data
INSERT INTO bahan_baku (nama, satuan, stok, pakai, via, kirim)
VALUES
    ('Dark Chocolate', 'kg', 10.0, 0.5, 'offline', 0),
    ('Milk Chocolate', 'kg', 10.0, 0.5, 'offline', 0),
    ('mentega', 'kg', 5.0, 0.3, 'offline', 0),
    ('gula', 'kg', 15.0, 0.8, 'offline', 0),
    ('telur', 'butir', 120.0, 10.0, 'offline', 0),
    ('tepung terigu', 'kg', 20.0, 1.5, 'offline', 0),
    ('baking powder', 'gram', 500.0, 15.0, 'offline', 0),
    ('baking soda', 'gram', 500.0, 15.0, 'offline', 0),
    ('sendok plastik', 'pcs', 150.0, 10.0, 'online', 3),
    ('kresek', 'pcs', 200.0, 15.0, 'online', 3),
    ('packaging', 'pcs', 100.0, 8.0, 'online', 7),
    ('stiker', 'pcs', 500.0, 20.0, 'offline', 0),
    ('topping keju', 'gram', 1000.0, 50.0, 'offline', 0),
    ('topping oreo', 'gram', 1000.0, 40.0, 'online', 4),
    ('topping matcha glaze', 'gram', 1000.0, 30.0, 'offline', 0),
    ('topping tiramisu glaze', 'gram', 1000.0, 30.0, 'offline', 0)
ON CONFLICT DO NOTHING;
