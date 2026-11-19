-- Chocolatada 2026 (acordado 2026-11-17): evento del 21 de noviembre para 400 niños. El Bingo II
-- pasa a ser una de sus actividades.
INSERT INTO
    `projects` (
        `id`,
        `type`,
        `name`,
        `start_date`,
        `beneficiary_count`
    )
VALUES (
        '019a6b10-4c2e-7d35-8f1a-5b7c9e0d2a41',
        'EVENT',
        'Chocolatada 2026',
        '2026-11-21',
        400
    );
--> statement-breakpoint
UPDATE `activities`
SET
    `project_id` = '019a6b10-4c2e-7d35-8f1a-5b7c9e0d2a41'
WHERE
    `project_id` IS NULL;
