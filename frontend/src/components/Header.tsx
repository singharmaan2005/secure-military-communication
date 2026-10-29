import React from 'react';
import { Shield, Radio, Wifi, WifiOff, RefreshCw, FileCode2 } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  queuedCount: number;
  onOpenQueueModal: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  onToggleOnline,
  queuedCount,
  onOpenQueueModal,
  onRefreshAll,
  isRefreshing,
}) => {
  return (
    <header className="border-b border-graphite-600 bg-graphite-950 sticky top-0 z-30">
      {/* Tactical Top Classification Banner */}
      <div className="bg-graphite-900 border-b border-graphite-700 px-4 py-1 flex items-center justify-between text-xs tracking-wider">
        <div className="flex items-center space-x-3 text-graphite-400 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-olive animate-pulse"></span>
          <span className="text-ivory font-semibold">FIELDLINK CORE // C2 NODE</span>
          <span className="hidden sm:inline text-graphite-500">|</span>
          <span className="hidden sm:inline text-rust-light">RESTRICTED // SIMULATION</span>
          <span className="hidden md:inline text-graphite-500">|</span>
          <span className="hidden md:inline text-graphite-400">B.TECH MAJOR PROJECT 2026</span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-graphite-400">
          <span className="hidden lg:inline text-graphite-400">CIPHER: AES-256-GCM / SHA-256</span>
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-olive hover:text-ivory transition-colors"
            title="Open OpenAPI / Swagger Documentation"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span className="underline">SWAGGER UI</span>
          </a>
        </div>
      </div>

      {/* Main Operational Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 border border-olive bg-graphite-800 flex items-center justify-center rounded-sm">
            <Shield className="w-5 h-5 text-olive" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-ivory">FIELDLINK</h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-graphite-600 bg-graphite-850 text-graphite-300">
                LOCAL SIMULATION
              </span>
            </div>
            <p className="text-xs text-graphite-400 font-mono">
              Secure Military Communication Using Blockchain and Encryption
            </p>
          </div>
        </div>

        {/* Operational Controls */}
        <div className="flex items-center space-x-3">
          {/* Tactical Network Status Mode Toggle */}
          <button
            onClick={onToggleOnline}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
              isOnline
                ? 'bg-olive-dim border-olive text-ivory'
                : 'bg-rust-dim border-rust text-ivory'
            }`}
            title="Click to toggle between Online Uplink and Radio Silence / Offline Simulation"
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-olive-light" />
                <span>UPLINK: ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rust-light" />
                <span>RADIO SILENCE: OFFLINE</span>
              </>
            )}
          </button>

          {/* Offline Queue Badge Button */}
          <button
            onClick={onOpenQueueModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
              queuedCount > 0
                ? 'bg-graphite-800 border-rust text-rust-light hover:bg-graphite-700'
                : 'bg-graphite-850 border-graphite-600 text-graphite-300 hover:bg-graphite-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>OUTBOX QUEUE</span>
            {queuedCount > 0 && (
              <span className="bg-rust text-ivory px-1.5 py-0.2 rounded-sm text-[10px] font-bold">
                {queuedCount}
              </span>
            )}
          </button>

          {/* Refresh Telemetry */}
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-2 border border-graphite-600 bg-graphite-850 hover:bg-graphite-800 text-graphite-300 hover:text-ivory rounded-sm transition-colors"
            title="Refresh Ledger and System Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-olive' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
