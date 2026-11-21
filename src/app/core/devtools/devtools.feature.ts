import { isDevMode } from '@angular/core';
import { withDevtools, withDevToolsStub } from '@angular-architects/ngrx-toolkit';

/**
 * Conecta el SignalStore a Redux DevTools únicamente en modo desarrollo.
 */
export function withNutriRutaDevtools(nombreStore: string) {
  return isDevMode() ? withDevtools(nombreStore) : withDevToolsStub(nombreStore);
}
