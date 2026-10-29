import React from 'react';
import { Send, Blocks, ShieldCheck, ShieldAlert, Ban, Clock } from 'lucide-react';
import { SystemMetricsDto } from '../types';

interface MetricsBarProps {
  metrics: SystemMetricsDto | null;
  queuedCount: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, queuedCount }) => {
  const isChainValid = metrics ? metrics.chainIntegrityValid : true;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Metric 1: Total Messages Transmitted */}
      <div className="bg-graphite-850 border border-graphite-700 p-3 rounded-sm">
        <div className="flex items-center justify-between text-graphite-400 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider">Payloads Encrypted</span>
          <Send className="w-3.5 h-3.5 text-olive" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold font-mono text-ivory">
            {metrics?.totalMessages ?? 0}
          </span>
          <span className="text-[10px] text-graphite-400 font-mono">SEPARATE STORE</span>
        </div>
      </div>

      {/* Metric 2: Ledger Height */}
      <div className="bg-graphite-850 border border-graphite-700 p-3 rounded-sm">
        <div className="flex items-center justify-between text-graphite-400 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider">Ledger Height</span>
          <Blocks className="w-3.5 h-3.5 text-olive" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold font-mono text-ivory">
            {metrics?.ledgerHeight ?? 1}
          </span>
          <span className="text-[10px] text-graphite-400 font-mono">BLOCKS</span>
        </div>
      </div>

      {/* Metric 3: Cryptographic Integrity Status */}
      <div className={`p-3 rounded-sm border ${
        isChainValid
          ? 'bg-graphite-850 border-olive-border'
          : 'bg-rust-dim border-rust'
      }`}>
        <div className="flex items-center justify-between text-graphite-400 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider">Chain Integrity</span>
          {isChainValid ? (
            <ShieldCheck className="w-3.5 h-3.5 text-olive-light" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-rust-light" />
          )}
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-base font-bold font-mono ${
            isChainValid ? 'text-olive-light' : 'text-rust-light'
          }`}>
            {isChainValid ? 'VERIFIED' : 'COMPROMISED'}
          </span>
          <span className="text-[10px] text-graphite-400 font-mono">SHA-256</span>
        </div>
      </div>

      {/* Metric 4: Replay Attacks Blocked */}
      <div className="bg-graphite-850 border border-graphite-700 p-3 rounded-sm">
        <div className="flex items-center justify-between text-graphite-400 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider">Replays Blocked</span>
          <Ban className="w-3.5 h-3.5 text-rust-light" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold font-mono text-ivory">
            {metrics?.replayAttemptsBlocked ?? 0}
          </span>
          <span className="text-[10px] text-graphite-400 font-mono">GUARDED</span>
        </div>
      </div>

      {/* Metric 5: Offline Outbox Queue */}
      <div className="bg-graphite-850 border border-graphite-700 p-3 rounded-sm col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-graphite-400 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider">Offline Outbox</span>
          <Clock className="w-3.5 h-3.5 text-graphite-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-xl font-bold font-mono ${queuedCount > 0 ? 'text-rust-light' : 'text-ivory'}`}>
            {queuedCount}
          </span>
          <span className="text-[10px] text-graphite-400 font-mono">QUEUED</span>
        </div>
      </div>
    </div>
  );
};
