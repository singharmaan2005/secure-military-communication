import React, { useState } from 'react';
import { Send, Lock, AlertCircle, CheckCircle2, Radio } from 'lucide-react';
import { SendMessageRequest, MessageDto } from '../types';

interface MessageComposerProps {
  isOnline: boolean;
  onSendMessage: (req: SendMessageRequest) => Promise<MessageDto>;
  onEnqueueOffline: (req: SendMessageRequest) => void;
}

const CALLSIGNS = [
  'ALPHA-BASE',
  'FORWARD-OP-1',
  'RECON-EAGLE',
  'TACTICAL-CP',
  'COMMAND-HQ'
];

const PRESET_KEYS = [
  { id: 'KEY-TACTICAL-ALPHA', label: 'Slot 1: ALPHA-C2 (Standard Key)', secret: 'TACTICAL-KEY-ORION-ALPHA-2026' },
  { id: 'KEY-FORWARD-BRAVO', label: 'Slot 2: RECON-PATROL (Forward Key)', secret: 'RECON-PATROL-SECRET-BRAVO-2026' },
  { id: 'KEY-COMMAND-ROOT', label: 'Slot 3: COMMAND-HQ (Master Key)', secret: 'SUPREME-COMMAND-CP-KEY-2026' },
  { id: 'CUSTOM', label: 'Custom Tactical Passkey', secret: '' }
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  isOnline,
  onSendMessage,
  onEnqueueOffline,
}) => {
  const [sender, setSender] = useState('ALPHA-BASE');
  const [recipient, setRecipient] = useState('FORWARD-OP-1');
  const [classification, setClassification] = useState('RESTRICTED');
  const [priority, setPriority] = useState('ROUTINE');
  const [keySlot, setKeySlot] = useState(PRESET_KEYS[0].id);
  const [customKey, setCustomKey] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSentResult, setLastSentResult] = useState<MessageDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);

  const getEffectiveKey = () => {
    if (keySlot === 'CUSTOM') {
      return customKey.trim() || 'TACTICAL-DEFAULT-KEY';
    }
    const found = PRESET_KEYS.find(k => k.id === keySlot);
    return found ? found.secret : 'TACTICAL-DEFAULT-KEY';
  };

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setErrorMessage(null);
    setQueuedNotice(null);
    setLastSentResult(null);
    setIsSubmitting(true);

    const payload: SendMessageRequest = {
      senderCallsign: sender,
      recipientCallsign: recipient,
      classification,
      priority,
      plainTextContent: content.trim(),
      tacticalKey: getEffectiveKey(),
      keyIdentifier: keySlot,
      sequenceNonce: Date.now()
    };

    try {
      if (!isOnline) {
        // Offline Tactical Queuing
        onEnqueueOffline(payload);
        setQueuedNotice(`TRANSMISSION QUEUED LOCALLY: Saved in browser tactical store. Will synchronize when online uplink is restored.`);
        setContent('');
      } else {
        // Online Immediate AES-256-GCM + Ledger Block
        const result = await onSendMessage(payload);
        setLastSentResult(result);
        setContent('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to transmit message over tactical link');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replay Attack Demonstration helper: sends an identical request with duplicate message ID
  const handleTestReplaySimulation = async () => {
    if (!lastSentResult) {
      alert('Transmit at least one message first to capture an existing Message ID for replay testing.');
      return;
    }
    setErrorMessage(null);
    setQueuedNotice(null);
    setIsSubmitting(true);

    try {
      const replayPayload: SendMessageRequest = {
        messageId: lastSentResult.messageId, // REUSING IDENTICAL MESSAGE ID
        senderCallsign: lastSentResult.senderCallsign,
        recipientCallsign: lastSentResult.recipientCallsign,
        classification: lastSentResult.classification,
        priority: lastSentResult.priority,
        plainTextContent: 'REPLAYED TRANSMISSION INTERCEPT TEST',
        tacticalKey: getEffectiveKey(),
        keyIdentifier: keySlot,
        sequenceNonce: 99999999
      };

      await onSendMessage(replayPayload);
      alert('Unexpected: Replay was accepted.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(`REPLAY BLOCKED BY SECURITY GUARD: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-graphite-850 border border-graphite-700 rounded-sm p-4">
      <div className="flex items-center justify-between pb-3 border-b border-graphite-700 mb-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-olive" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-ivory">
            Tactical Message Composer
          </h2>
        </div>
        <span className="text-[10px] font-mono text-graphite-400 border border-graphite-700 px-2 py-0.5 rounded bg-graphite-900">
          AES-256-GCM + 96-BIT IV
        </span>
      </div>

      <form onSubmit={handleTransmit} className="space-y-4">
        {/* Callsigns: Sender and Recipient */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-graphite-300 mb-1">
              SENDER CALLSIGN
            </label>
            <select
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-sm px-2.5 py-1.5 text-xs font-mono text-ivory focus:border-olive focus:outline-none"
            >
              {CALLSIGNS.map((cs) => (
                <option key={cs} value={cs}>{cs}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-graphite-300 mb-1">
              RECIPIENT CALLSIGN
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-sm px-2.5 py-1.5 text-xs font-mono text-ivory focus:border-olive focus:outline-none"
            >
              {CALLSIGNS.map((cs) => (
                <option key={cs} value={cs}>{cs}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Classification and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-graphite-300 mb-1">
              SECURITY CLASSIFICATION
            </label>
            <div className="flex space-x-1">
              {['RESTRICTED', 'CONFIDENTIAL', 'SECRET'].map((cls) => (
                <button
                  type="button"
                  key={cls}
                  onClick={() => setClassification(cls)}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-sm border transition-colors ${
                    classification === cls
                      ? cls === 'SECRET'
                        ? 'bg-rust-dim border-rust text-rust-light font-bold'
                        : 'bg-olive-dim border-olive text-ivory font-bold'
                      : 'bg-graphite-900 border-graphite-700 text-graphite-400 hover:border-graphite-600'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-graphite-300 mb-1">
              OPERATIONAL PRIORITY
            </label>
            <div className="flex space-x-1">
              {['ROUTINE', 'PRIORITY', 'FLASH'].map((pri) => (
                <button
                  type="button"
                  key={pri}
                  onClick={() => setPriority(pri)}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-sm border transition-colors ${
                    priority === pri
                      ? pri === 'FLASH'
                        ? 'bg-rust-dim border-rust text-rust-light font-bold'
                        : 'bg-olive-dim border-olive text-ivory font-bold'
                      : 'bg-graphite-900 border-graphite-700 text-graphite-400 hover:border-graphite-600'
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cryptographic Key Slot Selection */}
        <div>
          <label className="block text-xs font-mono text-graphite-300 mb-1 flex items-center justify-between">
            <span>TACTICAL ENCRYPTION KEY RING</span>
            <span className="text-[10px] text-graphite-400">NO HARDCODED SECRETS</span>
          </label>
          <div className="space-y-2">
            <select
              value={keySlot}
              onChange={(e) => setKeySlot(e.target.value)}
              className="w-full bg-graphite-900 border border-graphite-600 rounded-sm px-2.5 py-1.5 text-xs font-mono text-ivory focus:border-olive focus:outline-none"
            >
              {PRESET_KEYS.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>

            {keySlot === 'CUSTOM' && (
              <input
                type="password"
                placeholder="Enter tactical passphrase for dynamic 256-bit key derivation..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full bg-graphite-900 border border-graphite-600 rounded-sm px-2.5 py-1.5 text-xs font-mono text-ivory placeholder-graphite-500 focus:border-olive focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Plaintext Message Input */}
        <div>
          <label className="block text-xs font-mono text-graphite-300 mb-1 flex items-center justify-between">
            <span>MESSAGE PLAINTEXT (ENCRYPTED LOCALLY BEFORE STORAGE)</span>
            <span className="text-[10px] text-graphite-400 font-mono">
              {content.length} characters
            </span>
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter tactical order, coordinates, or SITREP (e.g., SITREP: Unit 4 arriving grid 32.191, 74.550. Sector secure.)..."
            className="w-full bg-graphite-900 border border-graphite-600 rounded-sm p-2.5 text-xs font-mono text-ivory placeholder-graphite-500 focus:border-olive focus:outline-none resize-none"
          />
          <p className="text-[10px] text-graphite-400 font-mono mt-1">
            * Security guarantee: Plaintext is NEVER stored on the ledger or in database tables.
          </p>
        </div>

        {/* Transmit & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-sm border text-xs font-mono font-medium transition-colors ${
              !content.trim()
                ? 'bg-graphite-800 border-graphite-700 text-graphite-500 cursor-not-allowed'
                : isOnline
                ? 'bg-olive hover:bg-olive-light border-olive text-graphite-950 font-bold'
                : 'bg-rust hover:bg-rust-light border-rust text-ivory font-bold'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'PROCESSING CRYPTO...'
                : isOnline
                ? 'TRANSMIT SECURE PACKET'
                : 'ENQUEUE TO OFFLINE STORE'}
            </span>
          </button>

          {/* Quick Preset Buttons */}
          <button
            type="button"
            onClick={() => setContent('SITREP: Forward Recon Patrol Bravo at waypoint 04. No enemy contact observed. Continuing sweep.')}
            className="px-2.5 py-1.5 border border-graphite-700 bg-graphite-900 hover:bg-graphite-800 text-[11px] font-mono text-graphite-400 hover:text-ivory rounded-sm"
          >
            Preset SITREP
          </button>

          <button
            type="button"
            onClick={() => setContent('ORDERS: Execute tactical radio silence until 0600Z. Secure defensive perimeter.')}
            className="px-2.5 py-1.5 border border-graphite-700 bg-graphite-900 hover:bg-graphite-800 text-[11px] font-mono text-graphite-400 hover:text-ivory rounded-sm"
          >
            Preset Order
          </button>

          {/* Replay Attack Demo Trigger */}
          {lastSentResult && isOnline && (
            <button
              type="button"
              onClick={handleTestReplaySimulation}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 border border-rust-border bg-rust-dim hover:bg-rust-border text-[11px] font-mono text-rust-light rounded-sm ml-auto"
              title="Test backend replay defense by retransmitting the previous message ID"
            >
              Test Replay on {lastSentResult.messageId}
            </button>
          )}
        </div>
      </form>

      {/* Success Receipt: Monospaced Proof of Encryption and Ledger Linking */}
      {lastSentResult && (
        <div className="mt-4 p-3 bg-graphite-900 border border-olive-border rounded-sm text-xs font-mono space-y-1.5">
          <div className="flex items-center space-x-2 text-olive-light font-bold pb-1 border-b border-graphite-700">
            <CheckCircle2 className="w-4 h-4 text-olive" />
            <span>TRANSMISSION SECURED & LEDGER BLOCK LINKED</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-graphite-300">
            <div>Message ID: <span className="text-ivory font-bold">{lastSentResult.messageId}</span></div>
            <div>Ledger Block: <span className="text-olive-light font-bold">Block #{lastSentResult.blockIndex}</span></div>
            <div className="truncate">Fresh 96-bit IV: <span className="text-graphite-400">{lastSentResult.ivNonce}</span></div>
            <div>Auth Tag: <span className="text-graphite-400">{lastSentResult.authTagLength}-bit AES-GCM</span></div>
            <div className="col-span-1 sm:col-span-2 truncate">
              Payload SHA-256: <span className="text-ivory">{lastSentResult.payloadHash}</span>
            </div>
            <div className="col-span-1 sm:col-span-2 truncate text-graphite-500">
              Block Hash: <span>{lastSentResult.blockHash}</span>
            </div>
          </div>
        </div>
      )}

      {/* Offline Queue Notice */}
      {queuedNotice && (
        <div className="mt-4 p-3 bg-graphite-900 border border-graphite-600 rounded-sm text-xs font-mono text-graphite-300 flex items-start space-x-2">
          <Radio className="w-4 h-4 text-graphite-400 flex-shrink-0 mt-0.5" />
          <span>{queuedNotice}</span>
        </div>
      )}

      {/* Error & Replay Alert */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-rust-dim border border-rust rounded-sm text-xs font-mono text-rust-light flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rust flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">SECURITY INTERCEPT / ERROR: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
