-- Reparte los apellidos existentes: 2 palabras → paterno + materno; 1 o 3+ quedan como paterno.
UPDATE users
SET
  maternal_last_name = substr(trim(paternal_last_name), instr(trim(paternal_last_name), ' ') + 1),
  paternal_last_name = substr(trim(paternal_last_name), 1, instr(trim(paternal_last_name), ' ') - 1)
WHERE paternal_last_name IS NOT NULL
  AND length(trim(paternal_last_name)) - length(replace(trim(paternal_last_name), ' ', '')) = 1;
