import React, { useState } from 'react';
import { Inbox, KeyRound, Unlock, Lock, ShieldCheck, ShieldAlert, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { MessageDto, DecryptRequest, DecryptResponse } from '../types';

interface DecryptedInboxProps {
  messages: MessageDto[];
  onDecrypt: (req: DecryptRequest) => Promise<DecryptResponse>;
  isLoading: boolean;
}

const PRESET_KEYS = [
  { id: 'KEY-TACTICAL-ALPHA', label: 'Slot 1: ALPHA-C2 Key', secret: 'TACTICAL-KEY-ORION-ALPHA-2026' },
  { id: 'KEY-FORWARD-BRAVO', label: 'Slot 2: RECON-PATROL Key', secret: 'RECON-PATROL-SECRET-BRAVO-2026' },
  { id: 'KEY-COMMAND-ROOT', label: 'Slot 3: COMMAND-HQ Key', secret: 'SUPREME-COMMAND-CP-KEY-2026' },
  { id: 'WRONG-KEY-SIM', label: 'Simulate Unauthorized / Wrong Key', secret: 'UNAUTHORIZED-ADVERSARY-KEY' }
];

export const DecryptedInbox: React.FC<DecryptedInboxProps> = ({
  messages,
  onDecrypt,
  isLoading,
}) => {
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [selectedKeyMap, setSelectedKeyMap] = useState<Record<string, string>>({});
  const [customKeyMap, setCustomKeyMap] = useState<Record<string, string>>({});
  const [decryptedStateMap, setDecryptedStateMap] = useState<Record<string, DecryptResponse>>({});
  const [decryptingMap, setDecryptingMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const filteredMessages = messages.filter((m) => {
    if (recipientFilter === 'ALL') return true;
    return m.recipientCallsign === recipientFilter;
  });

  const getKeyForMessage = (m: MessageDto) => {
    const selected = selectedKeyMap[m.messageId];
    if (selected === 'CUSTOM') {
      return customKeyMap[m.messageId] || '';
    }
    if (selected) {
      const found = PRESET_KEYS.find(k => k.id === selected);
      return found ? found.secret : '';
    }
    // Default to matching key identifier
    const defaultFound = PRESET_KEYS.find(k => k.id === m.keyIdentifier);
    return defaultFound ? defaultFound.secret : PRESET_KEYS[0].secret;
  };

  const handleDecrypt = async (m: MessageDto) => {
    const key = getKeyForMessage(m);
    setDecryptingMap((prev) => ({ ...prev, [m.messageId]: true }));

    try {
      const res = await onDecrypt({
        messageId: m.messageId,
        tacticalKey: key
      });
      setDecryptedStateMap((prev) => ({ ...prev, [m.messageId]: res }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Decryption failed';
      setDecryptedStateMap((prev) => ({
        ...prev,
        [m.messageId]: {
          messageId: m.messageId,
          decryptedText: null,
          authTagVerified: false,
          keyIdentifier: null,
          classification: null,
          priority: null,
          error: errMsg
        }
      }));
    } finally {
      setDecryptingMap((prev) => ({ ...prev, [m.messageId]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-graphite-850 border border-graphite-700 rounded-sm p-4">
      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-graphite-700 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Inbox className="w-4 h-4 text-olive" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-ivory">
            Tactical Message Intercept / Inbox
          </h2>
          <span className="text-[10px] font-mono text-graphite-400 bg-graphite-900 border border-graphite-700 px-1.5 py-0.5 rounded">
            {filteredMessages.length} STORED
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-graphite-400" />
          <select
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="bg-graphite-900 border border-graphite-600 rounded-sm px-2 py-1 text-xs font-mono text-ivory focus:border-olive focus:outline-none"
          >
            <option value="ALL">ALL RECIPIENTS</option>
            <option value="FORWARD-OP-1">FORWARD-OP-1</option>
            <option value="ALPHA-BASE">ALPHA-BASE</option>
            <option value="RECON-EAGLE">RECON-EAGLE</option>
            <option value="TACTICAL-CP">TACTICAL-CP</option>
            <option value="COMMAND-HQ">COMMAND-HQ</option>
          </select>
        </div>
      </div>

      {/* Message List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-graphite-400 animate-pulse">
          FETCHING ENCRYPTED STORE & VERIFYING HASHES...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-graphite-700 rounded-sm">
          <p className="text-xs font-mono text-graphite-400">
            No transmissions recorded for filter [{recipientFilter}]. Compose and transmit a message above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((m) => {
            const decState = decryptedStateMap[m.messageId];
            const isDecrypting = decryptingMap[m.messageId];
            const isExpanded = !!expandedMap[m.messageId];
            const selectedKey = selectedKeyMap[m.messageId] || m.keyIdentifier;

            return (
              <div
                key={m.messageId}
                className="bg-graphite-900 border border-graphite-700 rounded-sm overflow-hidden"
              >
                {/* Message Header Strip */}
                <div className="px-3 py-2 border-b border-graphite-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-ivory">{m.messageId}</span>
                    <span className="text-graphite-500">|</span>
                    <span className="text-graphite-300">
                      {m.senderCallsign} &rarr; <span className="text-ivory font-bold">{m.recipientCallsign}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded border ${
                      m.classification === 'SECRET'
                        ? 'bg-rust-dim border-rust text-rust-light'
                        : 'bg-graphite-800 border-graphite-600 text-graphite-300'
                    }`}>
                      {m.classification}
                    </span>

                    <span className={`px-1.5 py-0.5 rounded border ${
                      m.priority === 'FLASH'
                        ? 'bg-rust-dim border-rust text-rust-light font-bold'
                        : 'bg-graphite-800 border-graphite-600 text-graphite-300'
                    }`}>
                      {m.priority}
                    </span>

                    <span className="text-olive-light bg-graphite-850 px-1.5 py-0.5 border border-graphite-700 rounded">
                      Block #{m.blockIndex ?? '?'}
                    </span>

                    <span className="text-graphite-400">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </span>

                    <button
                      onClick={() => toggleExpand(m.messageId)}
                      className="p-1 hover:text-ivory text-graphite-400"
                      title="Toggle cryptographic details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Stored Payload & Cryptographic Proof */}
                <div className="p-3 text-xs font-mono space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-graphite-400 text-[11px]">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-olive" />
                        <span>STORED CIPHERTEXT (AES-256-GCM)</span>
                      </span>
                      <span className="text-[10px] text-graphite-500">
                        IV (96-bit): {m.ivNonce.substring(0, 10)}...
                      </span>
                    </div>
                    <div className="bg-graphite-950 border border-graphite-800 p-2 rounded-sm text-graphite-400 text-[11px] break-all font-mono">
                      {m.cipherText}
                    </div>
                  </div>

                  {/* Deep Cryptographic Proof when expanded */}
                  {isExpanded && (
                    <div className="p-2.5 bg-graphite-950 border border-graphite-800 rounded-sm text-[10px] text-graphite-400 space-y-1 font-mono">
                      <div>Payload SHA-256 (Ledger Seal): <span className="text-ivory font-bold">{m.payloadHash}</span></div>
                      <div>Block Current Hash: <span className="text-graphite-300">{m.blockHash}</span></div>
                      <div>Key Identifier Ring: <span className="text-olive-light">{m.keyIdentifier}</span></div>
                      <div>Full Fresh IV Nonce: <span className="text-graphite-300">{m.ivNonce}</span></div>
                    </div>
                  )}

                  {/* Decrypted Payload Display if Available */}
                  {decState && (
                    <div className="pt-2">
                      {decState.authTagVerified && decState.decryptedText ? (
                        <div className="p-2.5 bg-olive-dim border border-olive rounded-sm space-y-1">
                          <div className="flex items-center space-x-1.5 text-olive-light font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-olive" />
                            <span>DECRYPTION SUCCESSFUL // AES-GCM 128-BIT AUTH TAG VERIFIED</span>
                          </div>
                          <div className="text-ivory font-mono text-xs bg-graphite-950 p-2 rounded-sm border border-graphite-700">
                            {decState.decryptedText}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-rust-dim border border-rust rounded-sm space-y-1">
                          <div className="flex items-center space-x-1.5 text-rust-light font-bold text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rust" />
                            <span>AUTHENTICATION FAILURE / CIPHERTEXT TAMPERED</span>
                          </div>
                          <p className="text-[11px] text-rust-light">
                            {decState.error || 'Authentication tag mismatch. Invalid key or data modified.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decryption Key Selector & Action */}
                  <div className="pt-2 border-t border-graphite-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                      <KeyRound className="w-3.5 h-3.5 text-graphite-400" />
                      <select
                        value={selectedKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedKeyMap(prev => ({ ...prev, [m.messageId]: val }));
                        }}
                        className="bg-graphite-950 border border-graphite-700 rounded-sm px-2 py-1 text-[11px] font-mono text-graphite-300 focus:border-olive focus:outline-none flex-1"
                      >
                        {PRESET_KEYS.map((k) => (
                          <option key={k.id} value={k.id}>{k.label}</option>
                        ))}
                        <option value="CUSTOM">Custom Key Entry</option>
                      </select>

                      {selectedKey === 'CUSTOM' && (
                        <input
                          type="password"
                          placeholder="Passkey"
                          value={customKeyMap[m.messageId] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomKeyMap(prev => ({ ...prev, [m.messageId]: val }));
                          }}
                          className="bg-graphite-950 border border-graphite-700 rounded-sm px-2 py-1 text-[11px] font-mono text-ivory w-28 focus:border-olive focus:outline-none"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleDecrypt(m)}
                      disabled={isDecrypting}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-graphite-800 hover:bg-olive hover:text-graphite-950 border border-graphite-600 rounded-sm text-xs font-mono text-ivory transition-colors"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>{isDecrypting ? 'VERIFYING...' : 'DECRYPT TRANSMISSION'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
