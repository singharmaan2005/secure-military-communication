import {
  MessageDto,
  SendMessageRequest,
  DecryptRequest,
  DecryptResponse,
  LedgerBlockDto,
  IntegrityReportDto,
  TamperRequest,
  SystemMetricsDto,
  BatchSyncRequest,
  BatchSyncResponse
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.message) errorDetail = body.message;
      else if (body.error) errorDetail = body.error;
    } catch {
      try {
        const text = await res.text();
        if (text) errorDetail = text;
      } catch {
        // use default error detail
      }
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getMetrics(): Promise<SystemMetricsDto> {
    const res = await fetch(`${API_BASE}/metrics`);
    return handleResponse<SystemMetricsDto>(res);
  },

  async sendMessage(req: SendMessageRequest): Promise<MessageDto> {
    const res = await fetch(`${API_BASE}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return handleResponse<MessageDto>(res);
  },

  async decryptMessage(req: DecryptRequest): Promise<DecryptResponse> {
    const res = await fetch(`${API_BASE}/messages/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return handleResponse<DecryptResponse>(res);
  },

  async getInbox(recipient?: string): Promise<MessageDto[]> {
    const url = recipient && recipient !== 'ALL'
      ? `${API_BASE}/messages/inbox?recipient=${encodeURIComponent(recipient)}`
      : `${API_BASE}/messages/inbox`;
    const res = await fetch(url);
    return handleResponse<MessageDto[]>(res);
  },

  async syncQueue(req: BatchSyncRequest): Promise<BatchSyncResponse> {
    const res = await fetch(`${API_BASE}/messages/sync-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return handleResponse<BatchSyncResponse>(res);
  },

  async getLedgerBlocks(): Promise<LedgerBlockDto[]> {
    const res = await fetch(`${API_BASE}/ledger/blocks`);
    return handleResponse<LedgerBlockDto[]>(res);
  },

  async verifyLedger(): Promise<IntegrityReportDto> {
    const res = await fetch(`${API_BASE}/ledger/verify`);
    return handleResponse<IntegrityReportDto>(res);
  },

  async executeTamper(req: TamperRequest): Promise<string> {
    const res = await fetch(`${API_BASE}/tamper/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Tamper action failed with status ${res.status}`);
    }
    return res.text();
  },

  async repairLedger(): Promise<string> {
    const res = await fetch(`${API_BASE}/tamper/restore`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Repair failed with status ${res.status}`);
    }
    return res.text();
  }
};
