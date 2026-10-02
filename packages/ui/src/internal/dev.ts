/**
 * DEV-Flag. Vite ersetzt `import.meta.env.DEV` statisch, im Produktions-Build
 * fallen alle DEV-Bloecke heraus.
 */
export const DEV: boolean = import.meta.env?.DEV ?? true;
