-- Datos de prueba: 1 admin, 3 talleres aprobados y 10 productos.
-- Contraseña de todas las cuentas: demo12345

INSERT INTO usuario (nombre, email, password_hash, telefono, rol) VALUES
  ('Administrador',   'admin@example.com',    '$2b$10$GfEGS95pnnqJCCZpsYJkjuYLQeNq6lWLajbAxli6zjJEzEgK4Vvi2', NULL,         'admin'),
  ('Isaías Bautista', 'isaias@example.com',   '$2b$10$GfEGS95pnnqJCCZpsYJkjuYLQeNq6lWLajbAxli6zjJEzEgK4Vvi2', '9511000001', 'usuario'),
  ('Catalina Pérez',  'catalina@example.com', '$2b$10$GfEGS95pnnqJCCZpsYJkjuYLQeNq6lWLajbAxli6zjJEzEgK4Vvi2', '9511000002', 'usuario'),
  ('Marisol Fuentes', 'marisol@example.com',  '$2b$10$GfEGS95pnnqJCCZpsYJkjuYLQeNq6lWLajbAxli6zjJEzEgK4Vvi2', '9511000003', 'usuario')
ON CONFLICT (email) DO NOTHING;

INSERT INTO productor (usuario_id, comunidad_id, nombre_taller, biografia, whatsapp, direccion_taller, cp_taller, estado_verificacion)
SELECT u.id, c.id, v.taller, v.biografia, v.whatsapp, v.direccion, v.cp, 'aprobado'
  FROM (VALUES
    ('isaias@example.com',   'Teotitlán del Valle',   'Tapetes Bautista',
     'Tejedor de tapetes de lana teñida con grana cochinilla y plantas de la región.',
     '529511000001', 'Av. Juárez 12, Teotitlán del Valle', '70420'),
    ('catalina@example.com', 'San Bartolo Coyotepec', 'Barro Negro Doña Catalina',
     'Tercera generación de alfareras de barro negro bruñido a mano.',
     '529511000002', 'Calle Benito Juárez 5, San Bartolo Coyotepec', '71256'),
    ('marisol@example.com',  'San Martín Tilcajete',  'Alebrijes Fuentes',
     'Talla y pintura de alebrijes en madera de copal.',
     '529511000003', 'Calle Hidalgo 20, San Martín Tilcajete', '71506')
  ) AS v(email, comunidad, taller, biografia, whatsapp, direccion, cp)
  JOIN usuario u ON u.email = v.email
  JOIN comunidad c ON c.nombre = v.comunidad
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO producto (productor_id, categoria_id, nombre, slug, descripcion, modo_venta, precio, stock,
                      material, tecnica, peso_g, alto_cm, ancho_cm, largo_cm)
SELECT pr.id, cat.id, v.nombre, v.slug, v.descripcion, v.modo, v.precio, v.stock,
       v.material, v.tecnica, v.peso, v.alto, v.ancho, v.largo
  FROM (VALUES
    ('isaias@example.com', 'textiles', 'Tapete de grana cochinilla', 'tapete-de-grana-cochinilla',
     'Grecas de Mitla sobre fondo rojo. Se teje a la medida que pidas.', 'tratar', 9800.00, NULL::int,
     'Lana de borrego, grana cochinilla', 'Telar de pedal', 6000, 2.0, 120.0, 180.0),
    ('isaias@example.com', 'textiles', 'Camino de mesa de lana', 'camino-de-mesa-de-lana',
     'Camino de mesa tejido en telar con tintes naturales.', 'fijo', 950.00, 6,
     'Lana de borrego', 'Telar de pedal', 600, 1.0, 35.0, 150.0),
    ('isaias@example.com', 'fibras-vegetales', 'Tenate de palma', 'tenate-de-palma',
     'Canasta tejida de palma para tortillas o pan.', 'fijo', 320.00, 10,
     'Palma', 'Tejido a mano', 300, 15.0, 25.0, 25.0),
    ('catalina@example.com', 'alfareria-y-ceramica', 'Cántaro de barro negro', 'cantaro-de-barro-negro',
     'Modelado a mano, sin torno, y bruñido con piedra de cuarzo.', 'fijo', 1200.00, 4,
     'Barro de Coyotepec', 'Bruñido', 2500, 32.0, 22.0, 22.0),
    ('catalina@example.com', 'alfareria-y-ceramica', 'Jarrón calado de barro negro', 'jarron-calado-de-barro-negro',
     'Pieza calada a mano, cada una es distinta.', 'tratar', 4500.00, 1,
     'Barro de Coyotepec', 'Calado y bruñido', 3000, 40.0, 25.0, 25.0),
    ('catalina@example.com', 'alfareria-y-ceramica', 'Juego de tazas de barro negro', 'juego-de-tazas-de-barro-negro',
     'Cuatro tazas de barro negro mate.', 'fijo', 680.00, 8,
     'Barro de Coyotepec', 'Modelado a mano', 1200, 9.0, 9.0, 9.0),
    ('marisol@example.com', 'madera', 'Alebrije de jaguar', 'alebrije-de-jaguar',
     'Jaguar tallado en copal y pintado a mano con detalle fino.', 'tratar', 6500.00, 1,
     'Madera de copal', 'Talla y pintura', 1500, 30.0, 15.0, 45.0),
    ('marisol@example.com', 'madera', 'Nahual de copal chico', 'nahual-de-copal-chico',
     'Figura pequeña de nahual pintada con colores vivos.', 'fijo', 680.00, 12,
     'Madera de copal', 'Talla y pintura', 300, 12.0, 6.0, 15.0),
    ('marisol@example.com', 'madera', 'Máscara de madera tallada', 'mascara-de-madera-tallada',
     'Máscara decorativa de copal con pintura acrílica.', 'fijo', 1450.00, 3,
     'Madera de copal', 'Talla y pintura', 700, 30.0, 20.0, 10.0),
    ('marisol@example.com', 'madera', 'Alebrije a pedido', 'alebrije-a-pedido',
     'Diseñamos tu alebrije con el animal y colores que elijas.', 'tratar', 3000.00, NULL::int,
     'Madera de copal', 'Talla y pintura', NULL::int, NULL::numeric, NULL::numeric, NULL::numeric)
  ) AS v(email, cat_slug, nombre, slug, descripcion, modo, precio, stock,
         material, tecnica, peso, alto, ancho, largo)
  JOIN usuario u ON u.email = v.email
  JOIN productor pr ON pr.usuario_id = u.id
  JOIN categoria cat ON cat.slug = v.cat_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO imagen_producto (producto_id, url, orden, es_principal)
SELECT p.id, 'https://placehold.co/800x800?text=' || replace(p.nombre, ' ', '+'), 0, TRUE
  FROM producto p
 WHERE p.slug IN ('tapete-de-grana-cochinilla', 'camino-de-mesa-de-lana', 'tenate-de-palma',
                  'cantaro-de-barro-negro', 'jarron-calado-de-barro-negro', 'juego-de-tazas-de-barro-negro',
                  'alebrije-de-jaguar', 'nahual-de-copal-chico', 'mascara-de-madera-tallada', 'alebrije-a-pedido')
   AND NOT EXISTS (SELECT 1 FROM imagen_producto i WHERE i.producto_id = p.id);
