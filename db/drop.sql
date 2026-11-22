-- Borra todas las tablas de Mercado Artesanal (y sus datos).
-- Úsalo solo para empezar de cero antes de volver a correr schema.sql.
DROP TABLE IF EXISTS
  envio, pago, detalle_pedido, pedido, opcion_entrega, consulta,
  imagen_producto, producto, productor, categoria, comunidad, usuario
CASCADE;
