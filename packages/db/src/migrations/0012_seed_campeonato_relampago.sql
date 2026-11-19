-- Custom SQL migration file, put your code below! ---- Campeonato Relámpago 2026 (acordado 2026-11-19): parte de la Chocolatada 2026, 6 equipos,
-- inscripción de S/ 200. Fecha 1 el 22/11; fecha 2 y final el 29/11.
INSERT INTO
    `activities` (
        `id`,
        `project_id`,
        `name`,
        `type`,
        `event_date`,
        `default_price`
    )
VALUES (
        '019a9f20-6b3c-7e41-9a2d-3c5e7f1b8d62',
        '019a6b10-4c2e-7d35-8f1a-5b7c9e0d2a41',
        'Campeonato Relámpago 2026',
        'CHAMPIONSHIP',
        '2026-11-22',
        200
    );