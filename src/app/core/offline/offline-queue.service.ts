import { Injectable } from '@angular/core';
import { NivelCumplimiento } from '../../shared/util/calculos';
import { TipoComida } from '../api/seed-data';

export interface RegistroPendienteCola {
  readonly id: string;
  readonly pacienteId: string;
  readonly fecha: string;
  readonly tipoComida: TipoComida;
  readonly nombreComida: string;
  readonly cumplimiento: NivelCumplimiento;
  readonly nota?: string;
  readonly encoladoEn: number; // timestamp para garantizar orden FIFO
}

const DB_NAME = 'nutriruta_offline_db';
const DB_VERSION = 1;
const STORE_COLA = 'registros_pendientes';

/**
 * Cola persistente en IndexedDB nativo (sin librerías externas).
 * Restricción Ley 1581 de 2012 (Colombia):
 * - NUNCA guarda historia clínica, valoraciones ni datos de sesión.
 * - Solo almacena registros diarios de comidas pendientes de sincronizar.
 * - Cada registro se elimina de IndexedDB tan pronto se sincroniza o al cerrar sesión.
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  #memoriaFallback: RegistroPendienteCola[] = [];

  async encolar(registro: RegistroPendienteCola): Promise<void> {
    const db = await this.#abrirDb();
    if (!db) {
      this.#memoriaFallback = [
        ...this.#memoriaFallback.filter((item) => item.id !== registro.id),
        registro,
      ];
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readwrite');
      const store = tx.objectStore(STORE_COLA);
      store.put(registro);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async obtenerTodosFifo(): Promise<RegistroPendienteCola[]> {
    const db = await this.#abrirDb();
    if (!db) {
      return [...this.#memoriaFallback].sort((a, b) => a.encoladoEn - b.encoladoEn);
    }

    return new Promise<RegistroPendienteCola[]>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readonly');
      const store = tx.objectStore(STORE_COLA);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        const lista = (req.result as RegistroPendienteCola[]) ?? [];
        lista.sort((a, b) => a.encoladoEn - b.encoladoEn);
        resolve(lista);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  }

  async eliminarPorId(id: string): Promise<void> {
    const db = await this.#abrirDb();
    if (!db) {
      this.#memoriaFallback = this.#memoriaFallback.filter((item) => item.id !== id);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readwrite');
      const store = tx.objectStore(STORE_COLA);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async limpiarCola(): Promise<void> {
    this.#memoriaFallback = [];
    const db = await this.#abrirDb();
    if (!db) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readwrite');
      const store = tx.objectStore(STORE_COLA);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async #abrirDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') {
      return null;
    }

    return new Promise<IDBDatabase | null>((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_COLA)) {
            db.createObjectStore(STORE_COLA, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}
