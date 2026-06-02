import { openDB } from 'idb';
import { syncService } from './api';

const DB_NAME = 'logistics-offline';
const DB_VERSION = 1;

class OfflineSyncService {
  constructor() {
    this.db = null;
    this.isSyncing = false;
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      }
    });

    // Try to sync when online
    window.addEventListener('online', () => this.syncData());
  }

  async saveOfflineData(storeName, data) {
    if (!this.db) await this.init();
    const tx = this.db.transaction(storeName, 'readwrite');
    await tx.store.put(data);
    await tx.done;
  }

  async getOfflineData(storeName) {
    if (!this.db) await this.init();
    return await this.db.getAll(storeName);
  }

  async addToSyncQueue(entityType, entityId, operation, data) {
    if (!this.db) await this.init();
    const tx = this.db.transaction('syncQueue', 'readwrite');
    await tx.store.add({
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date().toISOString()
    });
    await tx.done;
  }

  async syncData() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // Pull latest data from server
      const lastSync = localStorage.getItem('lastSync') || new Date(0).toISOString();
      const pullResponse = await syncService.pull(lastSync);

      // Save to IndexedDB
      for (const key of ['inventory', 'routes', 'vehicles']) {
        if (pullResponse.data.data[key]) {
          const tx = this.db.transaction(key, 'readwrite');
          for (const item of pullResponse.data.data[key]) {
            await tx.store.put(item);
          }
          await tx.done;
        }
      }

      // Push pending changes
      const syncQueue = await this.db.getAll('syncQueue');
      if (syncQueue.length > 0) {
        await syncService.push(syncQueue);
        const tx = this.db.transaction('syncQueue', 'readwrite');
        await tx.store.clear();
        await tx.done;
      }

      localStorage.setItem('lastSync', new Date().toISOString());
      console.log('✅ Offline data synced successfully');
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export default new OfflineSyncService();
