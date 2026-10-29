import React, { useState } from 'react';
import { Blocks, ArrowRight, Shield, X, RefreshCw } from 'lucide-react';
import { LedgerBlockDto } from '../types';

interface LedgerChainViewProps {
  blocks: LedgerBlockDto[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const LedgerChainView: React.FC<LedgerChainViewProps> = ({
  blocks,
  isLoading,
  onRefresh,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlockDto | null>(null);

  return (
    <div className="bg-graphite-850 border border-graphite-700 rounded-sm p-4">
      {/* Header and Simulation Disclaimer */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-graphite-700 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Blocks className="w-4 h-4 text-olive" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-ivory">
            Hash-Linked Ledger Simulation
          </h2>
          <span className="text-[10px] font-mono text-graphite-400 bg-graphite-900 border border-graphite-700 px-1.5 py-0.5 rounded">
            HEIGHT: {blocks.length} BLOCKS
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-graphite-400">
          <div className="flex items-center space-x-1.5">
            <span className="text-olive">●</span>
            <span>AUTHENTIC SHA-256 BLOCKCHAIN LINKAGE (LOCAL SIMULATION)</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1 hover:text-ivory text-graphite-400 hover:bg-graphite-800 rounded border border-graphite-700"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chain Stream Container */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-graphite-400 animate-pulse">
          AUDITING LEDGER BLOCKS...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Horizontal / Flow Scroll of Blocks */}
          <div className="flex items-stretch space-x-3 overflow-x-auto pb-3 pt-1">
            {blocks.map((b, idx) => {
              const isGenesis = b.blockIndex === 0;

              return (
                <div key={b.blockIndex} className="flex items-center space-x-3 flex-shrink-0">
                  <div
                    onClick={() => setSelectedBlock(b)}
                    className={`cursor-pointer w-64 bg-graphite-900 border rounded-sm p-3 transition-all hover:border-olive ${
                      isGenesis
                        ? 'border-olive-border bg-graphite-900'
                        : 'border-graphite-700 hover:bg-graphite-850'
                    }`}
                  >
                    {/* Block Title & Index */}
                    <div className="flex items-center justify-between border-b border-graphite-800 pb-1.5 mb-2">
                      <span className="text-xs font-mono font-bold text-ivory">
                        Block #{b.blockIndex}
                      </span>
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded border ${
                        isGenesis
                          ? 'border-olive text-olive-light bg-olive-dim'
                          : 'border-graphite-700 text-graphite-400 bg-graphite-850'
                      }`}>
                        {b.blockType}
                      </span>
                    </div>

                    {/* Hashes Snippets */}
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div>
                        <span className="text-graphite-500 block">PREVIOUS HASH:</span>
                        <span className="text-graphite-300 truncate block">
                          {isGenesis ? '0000000000... (ROOT)' : `${b.previousHash.substring(0, 16)}...`}
                        </span>
                      </div>

                      <div>
                        <span className="text-graphite-500 block">CURRENT HASH:</span>
                        <span className="text-olive-light font-bold truncate block">
                          {b.currentHash.substring(0, 16)}...
                        </span>
                      </div>

                      <div>
                        <span className="text-graphite-500 block">PAYLOAD SHA-256:</span>
                        <span className="text-ivory truncate block">
                          {b.payloadHash.substring(0, 16)}...
                        </span>
                      </div>

                      <div className="flex justify-between text-graphite-500 pt-1 border-t border-graphite-800">
                        <span>{b.senderCallsign}</span>
                        <span>{new Date(b.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chain Link Arrow */}
                  {idx < blocks.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-graphite-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] font-mono text-graphite-500 text-right">
            * Click any block to view full SHA-256 hash digests and cryptographic proof parameters.
          </p>
        </div>
      )}

      {/* Block Inspector Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-graphite-950/80 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-graphite-900 border border-graphite-600 rounded-sm max-w-xl w-full p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-graphite-700">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-olive" />
                <h3 className="font-bold text-ivory uppercase">
                  Block #{selectedBlock.blockIndex} Deep Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-graphite-400 hover:text-ivory"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-graphite-400 block text-[10px]">CURRENT BLOCK SHA-256 HASH:</span>
                <div className="bg-graphite-950 p-2 border border-graphite-700 rounded-sm text-olive-light break-all select-all">
                  {selectedBlock.currentHash}
                </div>
              </div>

              <div>
                <span className="text-graphite-400 block text-[10px]">PREVIOUS BLOCK HASH (CHAIN LINK):</span>
                <div className="bg-graphite-950 p-2 border border-graphite-700 rounded-sm text-graphite-300 break-all select-all">
                  {selectedBlock.previousHash}
                </div>
              </div>

              <div>
                <span className="text-graphite-400 block text-[10px]">PAYLOAD SHA-256 HASH (CIPHERTEXT SEAL):</span>
                <div className="bg-graphite-950 p-2 border border-graphite-700 rounded-sm text-ivory break-all select-all">
                  {selectedBlock.payloadHash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-graphite-300">
                <div>Message ID: <span className="text-ivory font-bold">{selectedBlock.messageId}</span></div>
                <div>Sequence Nonce: <span className="text-ivory">{selectedBlock.sequenceNonce}</span></div>
                <div>Sender: <span className="text-ivory">{selectedBlock.senderCallsign}</span></div>
                <div>Recipient: <span className="text-ivory">{selectedBlock.recipientCallsign}</span></div>
                <div>Timestamp: <span className="text-ivory">{new Date(selectedBlock.timestamp).toLocaleString()}</span></div>
                <div>Block Type: <span className="text-olive-light">{selectedBlock.blockType}</span></div>
              </div>

              <div className="p-2.5 bg-graphite-950 border border-graphite-800 rounded-sm text-[10px] text-graphite-400 space-y-1">
                <span className="text-graphite-300 font-bold block">CRYPTOGRAPHIC FORMULA PROOF:</span>
                <code>currentHash = SHA-256(index | prevHash | timestamp | payloadHash | nonce | sender | recipient)</code>
                <p className="text-graphite-500 pt-1">
                  Tampering with any single character of the previous block or payload ciphertext invalidates this cryptographic seal.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-3 py-1 bg-graphite-800 hover:bg-graphite-700 border border-graphite-600 rounded-sm text-ivory text-xs font-mono"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
