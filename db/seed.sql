-- =============================================================
-- Mercado Artesanal · Datos iniciales (catálogos)
-- Se corre en el SQL Editor de Supabase DESPUÉS de schema.sql.
-- Se puede correr más de una vez: no duplica registros.
-- =============================================================

-- Ramas artesanales según la clasificación de FONART
INSERT INTO categoria (nombre, slug, descripcion) VALUES
  ('Alfarería y cerámica',      'alfareria-y-ceramica',      'Piezas de barro modelado y cocido: barro negro, barro verde, figuras y loza.'),
  ('Textiles',                  'textiles',                  'Tejidos en telar de pedal y de cintura, bordados y prendas de lana o algodón.'),
  ('Madera',                    'madera',                    'Talla y pintura en madera: alebrijes de copal, máscaras y utensilios.'),
  ('Fibras vegetales',          'fibras-vegetales',          'Cestería y tejido de palma, carrizo, tule y otras fibras.'),
  ('Metalistería',              'metalisteria',              'Trabajo en hojalata, hierro forjado, cobre y otros metales.'),
  ('Joyería y orfebrería',      'joyeria-y-orfebreria',      'Piezas de oro, plata y filigrana.'),
  ('Cartonería y papel',        'cartoneria-y-papel',        'Figuras de cartón y papel, papel picado.'),
  ('Talabartería y peletería',  'talabarteria-y-peleteria',  'Artículos de piel y cuero: bolsas, cinturones y sillas de montar.'),
  ('Maque y laca',              'maque-y-laca',              'Objetos de madera o guaje decorados con laca.'),
  ('Cerería',                   'cereria',                   'Velas y ceras decoradas para uso ceremonial y ornamental.'),
  ('Lapidaria y cantería',      'lapidaria-y-canteria',      'Labrado de piedra y cantera.')
ON CONFLICT (slug) DO NOTHING;

-- Comunidades artesanales de Oaxaca (región = una de las 8 regiones del estado)
INSERT INTO comunidad (nombre, municipio, distrito, region) VALUES
  ('San Bartolo Coyotepec',          'San Bartolo Coyotepec',          'Centro',     'Valles Centrales'),
  ('Santa María Atzompa',            'Santa María Atzompa',            'Centro',     'Valles Centrales'),
  ('San Antonio Arrazola',           'Santa Cruz Xoxocotlán',          'Centro',     'Valles Centrales'),
  ('Teotitlán del Valle',            'Teotitlán del Valle',            'Tlacolula',  'Valles Centrales'),
  ('San Juan Guelavía',              'San Juan Guelavía',              'Tlacolula',  'Valles Centrales'),
  ('San Martín Tilcajete',           'San Martín Tilcajete',           'Ocotlán',    'Valles Centrales'),
  ('Santo Tomás Jalieza',            'Santo Tomás Jalieza',            'Ocotlán',    'Valles Centrales'),
  ('San Antonino Castillo Velasco',  'San Antonino Castillo Velasco',  'Ocotlán',    'Valles Centrales'),
  ('Ocotlán de Morelos',             'Ocotlán de Morelos',             'Ocotlán',    'Valles Centrales'),
  ('Juchitán de Zaragoza',           'Juchitán de Zaragoza',           'Juchitán',   'Istmo')
ON CONFLICT (nombre, municipio) DO NOTHING;
