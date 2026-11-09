-- Custom SQL migration file, put your code below! --
-- Bingo II - 2026 · cartillas de Nueva Esperanza (transcritas de las 2 hojas).
-- Se puede correr dos veces: no duplica personas (mismo nombre y apellidos) ni series ya cargadas en la actividad.
-- Revisar antes: nombres dudosos marcados con «??».

-- 1) Personas en Nueva Esperanza. Si ya existe alguien con el mismo nombre y apellidos, no se crea.
WITH data(first_name, last_name) AS (
  VALUES
    ('Yanina', 'Romero Mejía'),
    ('Adán', 'Romero Mejía'),
    ('Rosa', 'Calderón Abad'),
    ('Hilda', 'Farías Farías'),
    ('Dilberto', 'Yacila Farías'),          -- ??
    ('Yonit', 'Yacila Farías'),             -- ??
    ('Gilberto', 'Yacila Farías'),
    ('Yulissa', 'Farías Yacila'),
    ('Isabel', 'Castro Ipanaqué'),
    ('Sabina', 'Abalo Mena'),
    ('Gladys', 'Saavedra Calderón'),
    ('Armando', 'Saavedra Castro'),
    ('Araceli', 'Andrade Atoche'),
    ('Esther', 'Calderón Gonzales'),
    ('Yesica', 'Calderón Farías'),
    ('Nancy', 'Calderón Mena'),
    ('Felipa', 'Farías Ancajima'),
    ('María', 'Castillo Calderón'),
    ('Yorina', 'Valladares Atoche'),        -- ??
    ('Analy', 'Mena Castro'),
    ('Josefa', 'Yacila Chira'),
    ('Hilda', 'Bruno Castro'),
    ('Yeni', 'Valladares Vallona'),         -- ?? segundo apellido
    ('Cinthia', 'Mena Castro'),
    ('Marilú', 'Alfaro Alcántara'),         -- ??
    ('Laureano', 'Atoche Mariños'),         -- ?? ¿Laureano?
    ('Josefa', 'Atoche Mariños'),
    ('Emeliano', 'Atoche Mariños'),         -- ??
    ('Sara', 'Flores Guerrero'),
    ('Nicolás', 'Herrera Rosales'),
    ('Isabel', 'Monasterio Ruiz'),
    ('Magno', 'Atoche Monasterio'),         -- ??
    ('Carolina', 'Vargas Escobar'),
    ('Edwar', 'Vargas Calderón'),
    ('Joaquín', 'Atoche Gonzales'),
    ('José Santos', 'Pacherres Estévez'),
    ('Pascuala', 'Ruiz Rivera'),
    ('Soledad', 'Ortiz Cruz'),
    ('Brenda', 'Castro Rivera'),
    ('Rosa', 'Urbina Castro'),
    ('Roxana', 'Ruiz Silva'),
    ('Ismael', 'Castro Saavedra'),
    -- Francisca Sandoval Gonzales ya existe: no se crea, se usa la suya.
    ('Jean', 'Farías Mena')
)
INSERT INTO users (id, first_name, last_name, neighborhood_id)
SELECT
  -- UUID v7 como el server: 48 bits de milisegundos + azar.
  lower(
    substr(printf('%012x', cast(unixepoch('subsecond') * 1000 AS integer)), 1, 8) || '-' ||
    substr(printf('%012x', cast(unixepoch('subsecond') * 1000 AS integer)), 9, 4) || '-7' ||
    substr(hex(randomblob(2)), 2, 3) || '-' ||
    substr('89ab', 1 + abs(random()) % 4, 1) || substr(hex(randomblob(2)), 2, 3) || '-' ||
    hex(randomblob(6))
  ),
  d.first_name,
  d.last_name,
  '01a1b5a4-1f55-72f2-9967-31f121e72497' -- Nueva Esperanza
FROM data d
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE lower(u.first_name) = lower(d.first_name)
    AND lower(coalesce(u.last_name, '')) = lower(d.last_name)
);

-- 2) Cartillas. Comprador por nombre; precio = el de la actividad; vendedora = Francisca Sandoval Gonzales.
WITH data(serial, first_name, last_name) AS (
  VALUES
    ('0018', 'Yanina', 'Romero Mejía'),
    ('0005', 'Adán', 'Romero Mejía'),
    ('0030', 'Rosa', 'Calderón Abad'),
    ('0001', 'Hilda', 'Farías Farías'),
    ('0020', 'Dilberto', 'Yacila Farías'),
    ('0029', 'Yonit', 'Yacila Farías'),
    ('0002', 'Gilberto', 'Yacila Farías'),
    ('0008', 'Yulissa', 'Farías Yacila'),
    ('0004', 'Isabel', 'Castro Ipanaqué'),
    ('0003', 'Sabina', 'Abalo Mena'),
    ('0031', 'Gladys', 'Saavedra Calderón'),
    ('0006', 'Armando', 'Saavedra Castro'),
    ('0021', 'Araceli', 'Andrade Atoche'),
    ('0007', 'Esther', 'Calderón Gonzales'),
    ('0015', 'Yesica', 'Calderón Farías'),       -- pagó
    ('0009', 'Nancy', 'Calderón Mena'),
    ('0032', 'Felipa', 'Farías Ancajima'),
    ('0023', 'María', 'Castillo Calderón'),
    ('0033', 'Yorina', 'Valladares Atoche'),
    ('0013', 'Analy', 'Mena Castro'),
    ('0034', 'Josefa', 'Yacila Chira'),
    ('0010', 'Hilda', 'Bruno Castro'),
    ('0014', 'Yeni', 'Valladares Vallona'),
    ('0028', 'Cinthia', 'Mena Castro'),
    ('0027', 'Marilú', 'Alfaro Alcántara'),
    ('0025', 'Laureano', 'Atoche Mariños'),
    ('0012', 'Josefa', 'Atoche Mariños'),
    ('0026', 'Emeliano', 'Atoche Mariños'),
    ('0022', 'Sara', 'Flores Guerrero'),
    ('0036', 'Nicolás', 'Herrera Rosales'),      -- pagó
    ('0046', 'Isabel', 'Monasterio Ruiz'),
    ('0047', 'Magno', 'Atoche Monasterio'),
    ('0042', 'Carolina', 'Vargas Escobar'),
    ('0016', 'Edwar', 'Vargas Calderón'),
    ('0038', 'Joaquín', 'Atoche Gonzales'),
    ('0011', 'José Santos', 'Pacherres Estévez'),
    ('0024', 'Pascuala', 'Ruiz Rivera'),
    ('0039', 'Soledad', 'Ortiz Cruz'),
    ('0044', 'Brenda', 'Castro Rivera'),
    ('0050', 'Rosa', 'Urbina Castro'),
    ('0049', 'Roxana', 'Ruiz Silva'),
    ('0019', 'Ismael', 'Castro Saavedra'),
    ('0017', 'Francisca', 'Sandoval Gonzales'),
    ('0040', 'Jean', 'Farías Mena'),
    ('0045', 'Jean', 'Farías Mena')
)
INSERT INTO activity_items (id, activity_id, serial, buyer_id, seller_id, price)
SELECT
  lower(
    substr(printf('%012x', cast(unixepoch('subsecond') * 1000 AS integer)), 1, 8) || '-' ||
    substr(printf('%012x', cast(unixepoch('subsecond') * 1000 AS integer)), 9, 4) || '-7' ||
    substr(hex(randomblob(2)), 2, 3) || '-' ||
    substr('89ab', 1 + abs(random()) % 4, 1) || substr(hex(randomblob(2)), 2, 3) || '-' ||
    hex(randomblob(6))
  ),
  a.id,
  d.serial,
  (
    SELECT u.id FROM users u
    WHERE lower(u.first_name) = lower(d.first_name)
      AND lower(coalesce(u.last_name, '')) = lower(d.last_name)
    ORDER BY u.created_at
    LIMIT 1
  ),
  (
    SELECT s.id FROM users s
    WHERE lower(s.first_name) = 'francisca' AND lower(coalesce(s.last_name, '')) = 'sandoval gonzales'
    ORDER BY s.created_at
    LIMIT 1
  ),
  a.default_price
FROM data d
JOIN activities a ON a.name = 'Bingo II - 2026'
WHERE NOT EXISTS (
  SELECT 1 FROM activity_items i WHERE i.activity_id = a.id AND i.serial = d.serial
);
