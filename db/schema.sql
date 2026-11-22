-- =============================================================
-- Mercado Artesanal · Esquema de base de datos (PostgreSQL)
-- Se ejecuta una sola vez en el SQL Editor de Supabase.
-- Para empezar de cero, primero corre db/drop.sql.
-- =============================================================

-- -------------------------------------------------------------
-- USUARIO: cualquier persona con cuenta. Todos pueden comprar.
-- Es productor quien tiene un registro en PRODUCTOR.
-- -------------------------------------------------------------
CREATE TABLE usuario (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  telefono      VARCHAR(15),
  rol           VARCHAR(10)  NOT NULL DEFAULT 'usuario'
                CHECK (rol IN ('usuario', 'admin')),
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- COMUNIDAD: localidad de Oaxaca de donde es el taller.
-- -------------------------------------------------------------
CREATE TABLE comunidad (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  municipio VARCHAR(120) NOT NULL,
  distrito  VARCHAR(120),
  region    VARCHAR(60)  NOT NULL,
  UNIQUE (nombre, municipio)
);

-- -------------------------------------------------------------
-- CATEGORIA: ramas artesanales según la clasificación de FONART.
-- -------------------------------------------------------------
CREATE TABLE categoria (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  descripcion TEXT
);

-- -------------------------------------------------------------
-- PRODUCTOR: el taller de un usuario. Un usuario tiene 0 o 1 taller.
-- -------------------------------------------------------------
CREATE TABLE productor (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id          BIGINT       NOT NULL UNIQUE REFERENCES usuario (id),
  comunidad_id        BIGINT       NOT NULL REFERENCES comunidad (id),
  nombre_taller       VARCHAR(120) NOT NULL,
  biografia           TEXT,
  foto_url            TEXT,
  whatsapp            VARCHAR(15)  NOT NULL
                      CHECK (whatsapp ~ '^[0-9]{10,15}$'),  -- solo dígitos, con lada: 529511234567
  direccion_taller    TEXT         NOT NULL,                -- origen para Envia.com y para "recoger en taller"
  cp_taller           CHAR(5)      NOT NULL CHECK (cp_taller ~ '^[0-9]{5}$'),
  estado_verificacion VARCHAR(10)  NOT NULL DEFAULT 'pendiente'
                      CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- PRODUCTO
--   modo_venta 'fijo'  : se compra en la página; precio final; stock obligatorio.
--   modo_venta 'tratar': se consulta por WhatsApp; precio es el "desde";
--                        stock NULL significa que se hace sobre pedido.
-- -------------------------------------------------------------
CREATE TABLE producto (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  productor_id BIGINT        NOT NULL REFERENCES productor (id),
  categoria_id BIGINT        NOT NULL REFERENCES categoria (id),
  nombre       VARCHAR(150)  NOT NULL,
  slug         VARCHAR(170)  NOT NULL UNIQUE,
  descripcion  TEXT,
  modo_venta   VARCHAR(6)    NOT NULL CHECK (modo_venta IN ('fijo', 'tratar')),
  precio       NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  stock        INTEGER       CHECK (stock >= 0),
  material     VARCHAR(150),
  tecnica      VARCHAR(150),
  peso_g       INTEGER       CHECK (peso_g > 0),          -- para cotizar con Envia.com
  alto_cm      NUMERIC(6,1)  CHECK (alto_cm > 0),
  ancho_cm     NUMERIC(6,1)  CHECK (ancho_cm > 0),
  largo_cm     NUMERIC(6,1)  CHECK (largo_cm > 0),
  activo       BOOLEAN       NOT NULL DEFAULT TRUE,       -- se desactiva en vez de borrarse
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT producto_fijo_con_stock CHECK (modo_venta = 'tratar' OR stock IS NOT NULL)
);

-- -------------------------------------------------------------
-- IMAGEN_PRODUCTO: rutas de Supabase Storage. Una sola principal por producto.
-- -------------------------------------------------------------
CREATE TABLE imagen_producto (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id  BIGINT   NOT NULL REFERENCES producto (id) ON DELETE CASCADE,
  url          TEXT     NOT NULL,
  orden        SMALLINT NOT NULL DEFAULT 0,
  es_principal BOOLEAN  NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX imagen_una_principal ON imagen_producto (producto_id) WHERE es_principal;

-- -------------------------------------------------------------
-- CONSULTA: registra el clic al enlace wa.me (no el mensaje).
-- -------------------------------------------------------------
CREATE TABLE consulta (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id BIGINT      NOT NULL REFERENCES producto (id),
  usuario_id  BIGINT      REFERENCES usuario (id) ON DELETE SET NULL,  -- NULL si no inició sesión
  origen      VARCHAR(12) NOT NULL CHECK (origen IN ('boton_tratar', 'link_dudas')),
  canal       VARCHAR(3)  NOT NULL CHECK (canal IN ('web', 'app')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- OPCION_ENTREGA: formas de entrega que ofrece cada taller.
-- -------------------------------------------------------------
CREATE TABLE opcion_entrega (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  productor_id  BIGINT        NOT NULL REFERENCES productor (id),
  tipo          VARCHAR(14)   NOT NULL CHECK (tipo IN ('envia', 'costo_fijo', 'recoger_taller')),
  costo_fijo    NUMERIC(10,2) CHECK (costo_fijo >= 0),
  instrucciones TEXT,
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  UNIQUE (productor_id, tipo),
  CONSTRAINT opcion_costo_fijo CHECK (tipo <> 'costo_fijo' OR costo_fijo IS NOT NULL)
);

-- -------------------------------------------------------------
-- PEDIDO: siempre de un solo productor.
-- -------------------------------------------------------------
CREATE TABLE pedido (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comprador_id BIGINT        NOT NULL REFERENCES usuario (id),
  productor_id BIGINT        NOT NULL REFERENCES productor (id),
  estado       VARCHAR(14)   NOT NULL DEFAULT 'pendiente_pago'
               CHECK (estado IN ('pendiente_pago', 'pagado', 'enviado', 'entregado', 'cancelado')),
  subtotal     NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  costo_envio  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
  total        NUMERIC(10,2) NOT NULL,
  nota         TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT pedido_total CHECK (total = subtotal + costo_envio)
);

-- -------------------------------------------------------------
-- DETALLE_PEDIDO: nombre y precio se copian para que el historial
-- no cambie si el producto se edita o se desactiva.
-- -------------------------------------------------------------
CREATE TABLE detalle_pedido (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id       BIGINT        NOT NULL REFERENCES pedido (id) ON DELETE CASCADE,
  producto_id     BIGINT        NOT NULL REFERENCES producto (id),
  nombre_producto VARCHAR(150)  NOT NULL,
  cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal        NUMERIC(10,2) NOT NULL,
  CONSTRAINT detalle_subtotal CHECK (subtotal = cantidad * precio_unitario)
);

-- -------------------------------------------------------------
-- PAGO: Mercado Pago en sandbox. Un pedido puede tener varios
-- intentos. La liquidación al artesano es simulada.
-- -------------------------------------------------------------
CREATE TABLE pago (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id           BIGINT        NOT NULL REFERENCES pedido (id),
  proveedor           VARCHAR(20)   NOT NULL DEFAULT 'mercadopago',
  mp_preference_id    VARCHAR(80),
  mp_payment_id       VARCHAR(40)   UNIQUE,
  estado              VARCHAR(12)   NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  monto               NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  comision_plataforma NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (comision_plataforma >= 0),
  monto_artesano      NUMERIC(10,2) NOT NULL,
  liquidado_simulado  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT pago_reparto CHECK (monto_artesano = monto - comision_plataforma)
);

-- -------------------------------------------------------------
-- ENVIO: dirección capturada en el checkout. En 'recoger_taller'
-- los campos de dirección y paquetería quedan en NULL.
-- -------------------------------------------------------------
CREATE TABLE envio (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id          BIGINT        NOT NULL UNIQUE REFERENCES pedido (id) ON DELETE CASCADE,
  opcion_entrega_id  BIGINT        NOT NULL REFERENCES opcion_entrega (id),
  costo              NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
  paqueteria         VARCHAR(40),   -- fedex, estafeta, redpack...
  servicio           VARCHAR(60),   -- "Estándar", "Express"...
  destinatario       VARCHAR(120),
  telefono           VARCHAR(15),
  calle              VARCHAR(150),
  colonia            VARCHAR(120),
  ciudad             VARCHAR(120),
  entidad_federativa VARCHAR(60),
  cp                 CHAR(5)       CHECK (cp ~ '^[0-9]{5}$'),
  guia               VARCHAR(60),
  tracking_url       TEXT,
  estado_envio       VARCHAR(14)   NOT NULL DEFAULT 'pendiente'
                     CHECK (estado_envio IN ('pendiente', 'guia_generada', 'en_transito', 'entregado'))
);

-- -------------------------------------------------------------
-- Índices para las llaves foráneas (PostgreSQL no los crea solo)
-- -------------------------------------------------------------
CREATE INDEX idx_productor_comunidad ON productor (comunidad_id);
CREATE INDEX idx_producto_productor  ON producto (productor_id);
CREATE INDEX idx_producto_categoria  ON producto (categoria_id);
CREATE INDEX idx_imagen_producto     ON imagen_producto (producto_id);
CREATE INDEX idx_consulta_producto   ON consulta (producto_id);
CREATE INDEX idx_pedido_comprador    ON pedido (comprador_id);
CREATE INDEX idx_pedido_productor    ON pedido (productor_id);
CREATE INDEX idx_detalle_pedido      ON detalle_pedido (pedido_id);
CREATE INDEX idx_pago_pedido         ON pago (pedido_id);
