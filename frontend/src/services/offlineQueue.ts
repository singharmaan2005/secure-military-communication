import { QueuedOfflineMessage, SendMessageRequest } from '../types';

const STORAGE_KEY = 'fieldlink_offline_queue_v1';

export const offlineQueue = {
  getQueue(): QueuedOfflineMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to read offline queue from localStorage', e);
      return [];
    }
  },

  enqueue(req: SendMessageRequest): QueuedOfflineMessage {
    const queue = this.getQueue();
    const queuedItem: QueuedOfflineMessage = {
      ...req,
      localId: 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      queuedAt: new Date().toISOString()
    };
    queue.push(queuedItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queuedItem;
  },

  remove(localId: string) {
    const queue = this.getQueue().filter(item => item.localId !== localId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  count(): number {
    return this.getQueue().length;
  }
};
