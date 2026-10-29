import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { MessageComposer } from './components/MessageComposer';
import { DecryptedInbox } from './components/DecryptedInbox';
import { LedgerChainView } from './components/LedgerChainView';
import { IntegrityAuditor } from './components/IntegrityAuditor';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { api } from './services/api';
import { offlineQueue } from './services/offlineQueue';
import {
  MessageDto,
  SendMessageRequest,
  DecryptRequest,
  DecryptResponse,
  LedgerBlockDto,
  IntegrityReportDto,
  TamperRequest,
  SystemMetricsDto,
  BatchSyncResponse
} from './types';
import { Send, Blocks, ShieldCheck, BookOpen, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'LEDGER' | 'AUDIT' | 'DOCS'>('OPERATIONS');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);

  // Data states
  const [metrics, setMetrics] = useState<SystemMetricsDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [blocks, setBlocks] = useState<LedgerBlockDto[]>([]);
  const [auditReport, setAuditReport] = useState<IntegrityReportDto | null>(null);

  // Loading states
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync offline queue count
  const refreshQueueCount = useCallback(() => {
    setQueuedCount(offlineQueue.count());
  }, []);

  // Fetch all live data from backend
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    refreshQueueCount();

    try {
      const [metricsData, inboxData, blocksData, verifyData] = await Promise.allSettled([
        api.getMetrics(),
        api.getInbox(),
        api.getLedgerBlocks(),
        api.verifyLedger()
      ]);

      if (metricsData.status === 'fulfilled') setMetrics(metricsData.value);
      if (inboxData.status === 'fulfilled') setMessages(inboxData.value);
      if (blocksData.status === 'fulfilled') setBlocks(blocksData.value);
      if (verifyData.status === 'fulfilled') setAuditReport(verifyData.value);
    } catch (e) {
      console.error('Failed to load operational data', e);
    } finally {
      setIsRefreshing(false);
      setIsLoadingMessages(false);
      setIsLoadingBlocks(false);
    }
  }, [refreshQueueCount]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler for sending message
  const handleSendMessage = async (req: SendMessageRequest): Promise<MessageDto> => {
    const result = await api.sendMessage(req);
    // Reload inbox and ledger blocks immediately
    await loadAllData();
    return result;
  };

  // Handler for offline queueing
  const handleEnqueueOffline = (req: SendMessageRequest) => {
    offlineQueue.enqueue(req);
    refreshQueueCount();
  };

  // Handler for decrypting message
  const handleDecryptMessage = async (req: DecryptRequest): Promise<DecryptResponse> => {
    return api.decryptMessage(req);
  };

  // Handler for running cryptographic audit
  const handleRunAudit = async (): Promise<IntegrityReportDto> => {
    setIsAuditing(true);
    try {
      const rep = await api.verifyLedger();
      setAuditReport(rep);
      const metricsData = await api.getMetrics();
      setMetrics(metricsData);
      return rep;
    } finally {
      setIsAuditing(false);
    }
  };

  // Handler for executing tampering
  const handleExecuteTamper = async (req: TamperRequest): Promise<string> => {
    const res = await api.executeTamper(req);
    await loadAllData();
    return res;
  };

  // Handler for repairing ledger
  const handleRepairLedger = async (): Promise<string> => {
    const res = await api.repairLedger();
    await loadAllData();
    return res;
  };

  // Handler for synchronizing offline queue
  const handleSyncBatch = async (): Promise<BatchSyncResponse> => {
    const queuedItems = offlineQueue.getQueue();
    const batchReq = { queuedMessages: queuedItems };
    const res = await api.syncQueue(batchReq);
    offlineQueue.clear();
    refreshQueueCount();
    await loadAllData();
    return res;
  };

  return (
    <div className="min-h-screen bg-graphite-950 text-ivory flex flex-col font-sans">
      {/* Tactical Top Header */}
      <Header
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(prev => !prev)}
        queuedCount={queuedCount}
        onOpenQueueModal={() => setIsQueueModalOpen(true)}
        onRefreshAll={loadAllData}
        isRefreshing={isRefreshing}
      />

      {/* Main Operational Container */}
      <main className="max-w-7xl mx-auto px-4 py-4 w-full flex-1 space-y-4">
        {/* HUD Metrics Bar */}
        <MetricsBar metrics={metrics} queuedCount={queuedCount} />

        {/* Tab Navigation */}
        <div className="border-b border-graphite-700 flex space-x-2">
          <button
            onClick={() => setActiveTab('OPERATIONS')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
              activeTab === 'OPERATIONS'
                ? 'border-olive text-ivory bg-graphite-900'
                : 'border-transparent text-graphite-400 hover:text-ivory hover:border-graphite-600'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-olive" />
            <span>TACTICAL C2 OPERATIONS</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
              activeTab === 'LEDGER'
                ? 'border-olive text-ivory bg-graphite-900'
                : 'border-transparent text-graphite-400 hover:text-ivory hover:border-graphite-600'
            }`}
          >
            <Blocks className="w-3.5 h-3.5 text-olive" />
            <span>HASH-LINKED LEDGER ({blocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
              activeTab === 'AUDIT'
                ? 'border-olive text-ivory bg-graphite-900'
                : 'border-transparent text-graphite-400 hover:text-ivory hover:border-graphite-600'
            }`}
          >
            {auditReport && !auditReport.isValid ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rust-light" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-olive" />
            )}
            <span>INTEGRITY & ADVERSARIAL LAB</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCS')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
              activeTab === 'DOCS'
                ? 'border-olive text-ivory bg-graphite-900'
                : 'border-transparent text-graphite-400 hover:text-ivory hover:border-graphite-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-olive" />
            <span>PROTOCOL & ARCHITECTURE</span>
          </button>
        </div>

        {/* Tab 1: Tactical C2 Operations (Composer + Inbox) */}
        {activeTab === 'OPERATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <MessageComposer
                isOnline={isOnline}
                onSendMessage={handleSendMessage}
                onEnqueueOffline={handleEnqueueOffline}
              />
            </div>
            <div className="lg:col-span-7">
              <DecryptedInbox
                messages={messages}
                onDecrypt={handleDecryptMessage}
                isLoading={isLoadingMessages}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Ledger Chain View */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-4">
            <LedgerChainView
              blocks={blocks}
              isLoading={isLoadingBlocks}
              onRefresh={loadAllData}
            />
          </div>
        )}

        {/* Tab 3: Cryptographic Integrity & Adversarial Lab */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-4">
            <IntegrityAuditor
              report={auditReport}
              onRunAudit={handleRunAudit}
              onExecuteTamper={handleExecuteTamper}
              onRepairLedger={handleRepairLedger}
              isAuditing={isAuditing}
            />
          </div>
        )}

        {/* Tab 4: System Architecture & Protocol Documentation */}
        {activeTab === 'DOCS' && (
          <div className="bg-graphite-850 border border-graphite-700 rounded-sm p-5 space-y-4 font-mono text-xs text-graphite-300">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-700">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-olive" />
                <h2 className="text-sm font-semibold tracking-wider uppercase text-ivory font-sans">
                  FIELDLINK System Specifications & Defense Evaluation
                </h2>
              </div>
              <span className="text-[10px] text-rust-light border border-rust-border px-2 py-0.5 rounded bg-rust-dim">
                B.TECH MAJOR PROJECT PROTOTYPE // 29 OCT 2026
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Specification 1: Cryptographic Engine */}
              <div className="p-3 bg-graphite-900 border border-graphite-700 rounded-sm space-y-2">
                <h3 className="font-bold text-olive-light text-xs font-sans uppercase">
                  1. Authenticated Encryption (AES-256-GCM)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-graphite-400 text-[11px]">
                  <li><span className="text-ivory">Cipher:</span> AES/GCM/NoPadding (256-bit derived key)</li>
                  <li><span className="text-ivory">Nonce/IV:</span> Fresh 96-bit (12-byte) cryptographically secure random IV per encryption</li>
                  <li><span className="text-ivory">Authentication Tag:</span> 128-bit AEAD tag providing confidentiality AND authenticity</li>
                  <li><span className="text-ivory">Key Handling:</span> Key ring slots with runtime derivation (SHA-256 HKDF/PBKDF2); zero hardcoded keys</li>
                  <li><span className="text-ivory">Storage Separation:</span> Ciphertext and IV stored in dedicated table; zero plaintext committed to disk</li>
                </ul>
              </div>

              {/* Specification 2: Hash-Linked Ledger */}
              <div className="p-3 bg-graphite-900 border border-graphite-700 rounded-sm space-y-2">
                <h3 className="font-bold text-olive-light text-xs font-sans uppercase">
                  2. Hash-Linked Blockchain Simulation
                </h3>
                <ul className="list-disc list-inside space-y-1 text-graphite-400 text-[11px]">
                  <li><span className="text-ivory">Genesis Block:</span> Block 0 anchored with 64 zero-byte previousHash</li>
                  <li><span className="text-ivory">Block Linkage:</span> <code className="text-graphite-300">block[n].previousHash = block[n-1].currentHash</code></li>
                  <li><span className="text-ivory">Payload Hash:</span> SHA-256 of (Ciphertext + IV); proves data immutability without storing plaintext</li>
                  <li><span className="text-ivory">Block Header Hash:</span> SHA-256(index | prevHash | timestamp | payloadHash | nonce | sender | recipient)</li>
                  <li><span className="text-ivory">Audit Verifier:</span> Full recursive verification detects exact block corruption</li>
                </ul>
              </div>

              {/* Specification 3: Tactical Network Resilience */}
              <div className="p-3 bg-graphite-900 border border-graphite-700 rounded-sm space-y-2">
                <h3 className="font-bold text-olive-light text-xs font-sans uppercase">
                  3. Tactical Radio Silence & Offline Queue
                </h3>
                <ul className="list-disc list-inside space-y-1 text-graphite-400 text-[11px]">
                  <li><span className="text-ivory">Radio Silence Simulation:</span> Operators sever uplinks in hostile electronic warfare environments</li>
                  <li><span className="text-ivory">Local Outbox:</span> Transmissions cached locally in browser persistent store</li>
                  <li><span className="text-ivory">Batch Sync:</span> Synchronizes pending transmissions chronologically upon uplink restoration</li>
                  <li><span className="text-ivory">Conflict Resolution:</span> Detects duplicate message IDs or replayed nonces, rejecting malicious replays</li>
                </ul>
              </div>

              {/* Specification 4: Replay & Adversarial Defense */}
              <div className="p-3 bg-graphite-900 border border-graphite-700 rounded-sm space-y-2">
                <h3 className="font-bold text-olive-light text-xs font-sans uppercase">
                  4. Cryptographic Replay & Tamper Defense
                </h3>
                <ul className="list-disc list-inside space-y-1 text-graphite-400 text-[11px]">
                  <li><span className="text-ivory">Replay Filter:</span> Unique nonce signature tracking (sender + recipient + seqNonce + IV)</li>
                  <li><span className="text-ivory">HTTP 409 Guard:</span> Re-transmitted message IDs rejected with security alert</li>
                  <li><span className="text-ivory">Tamper Alarms:</span> Modifying ciphertext triggers AES-GCM tag mismatch and ledger mismatch</li>
                  <li><span className="text-ivory">Restoration:</span> Recalculates cryptographic integrity after demonstration drills</li>
                </ul>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-3 border-t border-graphite-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3 text-graphite-400">
                <span>BACKEND CORE: Spring Boot 3 + Java 21</span>
                <span>•</span>
                <span>DATABASE: H2 Persistent Store</span>
                <span>•</span>
                <span>FRONTEND: React + Vite + TypeScript + Tailwind</span>
              </div>

              <a
                href="http://localhost:8080/swagger-ui.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1 bg-graphite-800 hover:bg-olive hover:text-graphite-950 border border-graphite-600 rounded-sm text-ivory transition-colors"
              >
                <span>OPEN SWAGGER UI DOCS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        queue={offlineQueue.getQueue()}
        isOnline={isOnline}
        onSyncBatch={handleSyncBatch}
        onClearQueue={() => {
          offlineQueue.clear();
          refreshQueueCount();
        }}
      />

      {/* Operational Footer */}
      <footer className="border-t border-graphite-700 bg-graphite-950 px-4 py-2 text-[10px] font-mono text-graphite-500 flex flex-wrap items-center justify-between gap-2">
        <div>
          FIELDLINK OPERATIONAL TERMINAL // SECURE MILITARY COMMUNICATION
        </div>
        <div>
          LOCAL HASH-LINKED LEDGER SIMULATION // TARGET: 29 OCT 2026 EVALUATION
        </div>
      </footer>
    </div>
  );
};
