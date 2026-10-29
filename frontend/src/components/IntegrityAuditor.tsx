import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, Bug, Wrench, CheckCircle } from 'lucide-react';
import { IntegrityReportDto, TamperRequest } from '../types';

interface IntegrityAuditorProps {
  report: IntegrityReportDto | null;
  onRunAudit: () => Promise<IntegrityReportDto>;
  onExecuteTamper: (req: TamperRequest) => Promise<string>;
  onRepairLedger: () => Promise<string>;
  isAuditing: boolean;
}

export const IntegrityAuditor: React.FC<IntegrityAuditorProps> = ({
  report,
  onRunAudit,
  onExecuteTamper,
  onRepairLedger,
  isAuditing,
}) => {
  const [tamperActionNotice, setTamperActionNotice] = useState<string | null>(null);
  const [isExecutingTamper, setIsExecutingTamper] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleTamper = async (type: 'CORRUPT_BLOCK_HASH' | 'CORRUPT_PAYLOAD' | 'REPLAY_ATTACK') => {
    setIsExecutingTamper(true);
    setTamperActionNotice(null);
    try {
      const res = await onExecuteTamper({
        tamperType: type,
        targetBlockIndex: 1, // tamper first transaction block if available
      });
      setTamperActionNotice(res);
      // Automatically re-run audit to display real-time compromise detection
      await onRunAudit();
    } catch (err: unknown) {
      setTamperActionNotice(err instanceof Error ? err.message : 'Tamper execution failed');
    } finally {
      setIsExecutingTamper(false);
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    setTamperActionNotice(null);
    try {
      const res = await onRepairLedger();
      setTamperActionNotice(res);
      await onRunAudit();
    } catch (err: unknown) {
      setTamperActionNotice(err instanceof Error ? err.message : 'Repair failed');
    } finally {
      setIsRepairing(false);
    }
  };

  const isChainValid = report ? report.isValid : true;

  return (
    <div className="bg-graphite-850 border border-graphite-700 rounded-sm p-4 space-y-4">
      {/* Header and Audit Trigger */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-graphite-700 gap-2">
        <div className="flex items-center space-x-2">
          {isChainValid ? (
            <ShieldCheck className="w-4 h-4 text-olive" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rust" />
          )}
          <h2 className="text-sm font-semibold tracking-wider uppercase text-ivory">
            Cryptographic Integrity & Tamper Defense Hub
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-olive text-graphite-950 font-bold border border-olive hover:bg-olive-light rounded-sm text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'RUNNING SHA-256 AUDIT...' : 'RUN INTEGRITY AUDIT'}</span>
          </button>
        </div>
      </div>

      {/* Main Audit Status Banner */}
      {report && (
        <div className={`p-3 rounded-sm border text-xs font-mono flex items-start justify-between gap-3 ${
          report.isValid
            ? 'bg-olive-dim border-olive text-ivory'
            : 'bg-rust-dim border-rust text-rust-light'
        }`}>
          <div>
            <div className="font-bold flex items-center space-x-1.5 text-sm mb-1">
              {report.isValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-olive-light" />
                  <span>ALL {report.totalBlocks} BLOCKS VERIFIED // IMMUTABLE</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rust-light" />
                  <span>LEDGER TAMPERING DETECTED // INTEGRITY COMPROMISED</span>
                </>
              )}
            </div>
            <p className="text-graphite-300">{report.statusSummary}</p>
          </div>

          {!report.isValid && (
            <button
              onClick={handleRepair}
              disabled={isRepairing}
              className="px-3 py-1.5 bg-rust hover:bg-rust-light text-ivory font-bold border border-rust-border rounded-sm text-xs font-mono transition-colors flex items-center space-x-1 flex-shrink-0"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isRepairing ? 'REPAIRING...' : 'RESTORE / REPAIR LEDGER'}</span>
            </button>
          )}
        </div>
      )}

      {/* Mentor Demonstration: Adversarial Red-Team Tamper Controls */}
      <div className="bg-graphite-900 border border-graphite-700 p-3 rounded-sm space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-graphite-800">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-ivory">
            <Bug className="w-3.5 h-3.5 text-rust-light" />
            <span>CONTROLLED ADVERSARIAL ATTACK SIMULATION (MENTOR DEMO)</span>
          </div>
          <span className="text-[10px] font-mono text-graphite-400">
            TESTS REAL CRYPTOGRAPHIC ALARMS
          </span>
        </div>

        <p className="text-[11px] font-mono text-graphite-400">
          Simulate hostile database infiltration to demonstrate how FIELDLINK detects unauthorized modifications:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Attack 1 */}
          <button
            onClick={() => handleTamper('CORRUPT_BLOCK_HASH')}
            disabled={isExecutingTamper}
            className="p-2 bg-graphite-950 hover:bg-graphite-850 border border-graphite-700 hover:border-rust text-left rounded-sm font-mono text-xs text-graphite-300 hover:text-ivory transition-colors"
          >
            <div className="font-bold text-rust-light mb-0.5">1. Corrupt Block Hash</div>
            <div className="text-[10px] text-graphite-500">
              Modifies block header SHA-256 in DB, breaking the hash chain link.
            </div>
          </button>

          {/* Attack 2 */}
          <button
            onClick={() => handleTamper('CORRUPT_PAYLOAD')}
            disabled={isExecutingTamper}
            className="p-2 bg-graphite-950 hover:bg-graphite-850 border border-graphite-700 hover:border-rust text-left rounded-sm font-mono text-xs text-graphite-300 hover:text-ivory transition-colors"
          >
            <div className="font-bold text-rust-light mb-0.5">2. Corrupt Stored Ciphertext</div>
            <div className="text-[10px] text-graphite-500">
              Alters encrypted payload; triggers ledger payload hash mismatch and AES-GCM AEAD tag failure.
            </div>
          </button>

          {/* Attack 3 / Reset */}
          <button
            onClick={handleRepair}
            disabled={isRepairing}
            className="p-2 bg-graphite-950 hover:bg-graphite-850 border border-graphite-700 hover:border-olive text-left rounded-sm font-mono text-xs text-graphite-300 hover:text-ivory transition-colors"
          >
            <div className="font-bold text-olive-light mb-0.5">3. Restore Clean State</div>
            <div className="text-[10px] text-graphite-500">
              Recalculates valid cryptographic hashes to restore verified status.
            </div>
          </button>
        </div>

        {tamperActionNotice && (
          <div className="p-2 bg-graphite-950 border border-graphite-700 rounded-sm text-xs font-mono text-ivory mt-2">
            {tamperActionNotice}
          </div>
        )}
      </div>

      {/* Detailed Per-Block Audit Table */}
      {report && report.auditDetails.length > 0 && (
        <div className="overflow-x-auto border border-graphite-700 rounded-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-graphite-900 border-b border-graphite-700 text-graphite-400 text-[10px] uppercase">
              <tr>
                <th className="py-2 px-3">Block #</th>
                <th className="py-2 px-3">Prev Hash Link</th>
                <th className="py-2 px-3">Header SHA-256</th>
                <th className="py-2 px-3">Payload Immutability</th>
                <th className="py-2 px-3">Audit Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-800">
              {report.auditDetails.map((detail) => {
                const isBlockSound = detail.hashValid && detail.prevHashValid && detail.payloadHashValid;

                return (
                  <tr
                    key={detail.blockIndex}
                    className={isBlockSound ? 'bg-graphite-900/40 hover:bg-graphite-900' : 'bg-rust-dim/50'}
                  >
                    <td className="py-2 px-3 font-bold text-ivory">
                      Block #{detail.blockIndex}
                    </td>

                    <td className="py-2 px-3">
                      {detail.prevHashValid ? (
                        <span className="text-olive-light font-bold">LINKED OK</span>
                      ) : (
                        <span className="text-rust-light font-bold">BROKEN</span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      {detail.hashValid ? (
                        <span className="text-olive-light font-bold">VALID</span>
                      ) : (
                        <span className="text-rust-light font-bold">ALTERED</span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      {detail.payloadHashValid ? (
                        <span className="text-olive-light font-bold">MATCHED</span>
                      ) : (
                        <span className="text-rust-light font-bold">MISMATCH</span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-[11px] text-graphite-300">
                      {detail.diagnosis}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
