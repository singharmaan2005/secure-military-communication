import React, { useState } from 'react';
import { Radio, X, Send, Trash2, CheckCircle2 } from 'lucide-react';
import { QueuedOfflineMessage, BatchSyncResponse } from '../types';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueuedOfflineMessage[];
  isOnline: boolean;
  onSyncBatch: () => Promise<BatchSyncResponse>;
  onClearQueue: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  isOnline,
  onSyncBatch,
  onClearQueue,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<BatchSyncResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    if (!isOnline) {
      alert('Network uplink is currently in RADIO SILENCE mode. Toggle to ONLINE first to synchronize transmissions.');
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const res = await onSyncBatch();
      setSyncResult(res);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : 'Synchronization failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-950/80 backdrop-blur-none flex items-center justify-center p-4">
      <div className="bg-graphite-900 border border-graphite-600 rounded-sm max-w-2xl w-full p-4 font-mono text-xs space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-graphite-700">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-olive" />
            <h3 className="font-bold text-ivory uppercase">
              Tactical Offline Outbox Queue ({queue.length} Pending)
            </h3>
          </div>
          <button onClick={onClose} className="text-graphite-400 hover:text-ivory">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Notice */}
        <div className={`p-2.5 rounded-sm border ${
          isOnline
            ? 'bg-olive-dim border-olive text-ivory'
            : 'bg-rust-dim border-rust text-rust-light'
        }`}>
          <div className="font-bold mb-0.5">
            {isOnline
              ? 'TACTICAL UPLINK ACTIVE // READY TO SYNCHRONIZE'
              : 'RADIO SILENCE ACTIVE // TRANSMISSIONS HELD LOCALLY'}
          </div>
          <p className="text-[11px] text-graphite-300">
            {isOnline
              ? 'Click Synchronize to batch transmit queued packets to the FIELDLINK C2 backend in timestamped order.'
              : 'Switch to ONLINE in the top navigation bar when tactical connection is restored to sync.'}
          </p>
        </div>

        {/* Queued Packets List */}
        {queue.length === 0 ? (
          <div className="py-8 text-center text-graphite-400 border border-dashed border-graphite-800 rounded-sm">
            No transmissions queued in offline storage.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 border border-graphite-800 rounded-sm p-2 bg-graphite-950">
            {queue.map((item, idx) => (
              <div
                key={item.localId}
                className="bg-graphite-900 border border-graphite-700 p-2.5 rounded-sm space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-ivory">
                    #{idx + 1} // {item.senderCallsign} &rarr; {item.recipientCallsign}
                  </span>
                  <span className="text-graphite-400 text-[10px]">
                    Queued: {new Date(item.queuedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-graphite-300 text-[11px] truncate">
                  &ldquo;{item.plainTextContent}&rdquo;
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-graphite-500 pt-0.5">
                  <span>Class: {item.classification}</span>
                  <span>|</span>
                  <span>Priority: {item.priority}</span>
                  <span>|</span>
                  <span>Key: {item.keyIdentifier}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sync Receipts and Audit Logs */}
        {syncResult && (
          <div className="p-3 bg-graphite-950 border border-olive-border rounded-sm space-y-2">
            <div className="flex items-center space-x-2 text-olive-light font-bold">
              <CheckCircle2 className="w-4 h-4 text-olive" />
              <span>
                SYNCHRONIZATION COMPLETE: {syncResult.successfullySynced} Synced, {syncResult.duplicatesBlocked} Duplicates Blocked
              </span>
            </div>
            <div className="text-[10px] text-graphite-400 space-y-0.5 max-h-32 overflow-y-auto">
              {syncResult.auditLogs.map((log, i) => (
                <div key={i} className="font-mono">{log}</div>
              ))}
            </div>
          </div>
        )}

        {syncError && (
          <div className="p-2.5 bg-rust-dim border border-rust rounded-sm text-rust-light text-xs">
            {syncError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-graphite-700">
          <button
            onClick={onClearQueue}
            disabled={queue.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-graphite-800 hover:bg-rust hover:text-ivory border border-graphite-600 rounded-sm text-xs font-mono text-graphite-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR OUTBOX</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-graphite-800 hover:bg-graphite-700 border border-graphite-600 rounded-sm text-ivory text-xs font-mono"
            >
              CLOSE
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing || queue.length === 0 || !isOnline}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors ${
                queue.length === 0 || !isOnline
                  ? 'bg-graphite-800 border-graphite-700 text-graphite-500 cursor-not-allowed'
                  : 'bg-olive hover:bg-olive-light border-olive text-graphite-950'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'SYNCHRONIZING...' : 'SYNCHRONIZE QUEUE NOW'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
