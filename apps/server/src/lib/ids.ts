import { v7 as uuidv7 } from "uuid";

/** PK de todas las tablas: UUID v7, ordenable por tiempo de creación. */
export const newId = (): string => uuidv7();
