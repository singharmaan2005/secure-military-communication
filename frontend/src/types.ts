export interface MessageDto {
  messageId: string;
  senderCallsign: string;
  recipientCallsign: string;
  classification: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET';
  priority: 'ROUTINE' | 'PRIORITY' | 'FLASH';
  cipherText: string;
  ivNonce: string;
  authTagLength: number;
  keyIdentifier: string;
  payloadHash: string;
  blockIndex: number;
  blockHash: string;
  createdAt: string;
}

export interface SendMessageRequest {
  messageId?: string;
  senderCallsign: string;
  recipientCallsign: string;
  classification?: string;
  priority?: string;
  plainTextContent: string;
  tacticalKey?: string;
  keyIdentifier?: string;
  sequenceNonce?: number;
}

export interface DecryptRequest {
  messageId: string;
  tacticalKey: string;
}

export interface DecryptResponse {
  messageId: string;
  decryptedText: string | null;
  authTagVerified: boolean;
  keyIdentifier: string | null;
  classification: string | null;
  priority: string | null;
  error: string | null;
}

export interface LedgerBlockDto {
  blockIndex: number;
  previousHash: string;
  currentHash: string;
  payloadHash: string;
  messageId: string;
  senderCallsign: string;
  recipientCallsign: string;
  sequenceNonce: number;
  timestamp: string;
  blockType: 'GENESIS' | 'TACTICAL_TRANSMISSION';
}

export interface BlockAuditDetail {
  blockIndex: number;
  hashValid: boolean;
  prevHashValid: boolean;
  payloadHashValid: boolean;
  recordedHash: string;
  expectedHash: string;
  recordedPrevHash: string;
  expectedPrevHash: string;
  recordedPayloadHash: string;
  expectedPayloadHash: string;
  diagnosis: string;
}

export interface IntegrityReportDto {
  isValid: boolean;
  totalBlocks: number;
  firstCorruptedBlockIndex: number | null;
  compromisedBlocksCount: number;
  statusSummary: string;
  auditDetails: BlockAuditDetail[];
}

export interface TamperRequest {
  tamperType: 'CORRUPT_BLOCK_HASH' | 'CORRUPT_PAYLOAD' | 'REPLAY_ATTACK';
  targetBlockIndex?: number;
  targetMessageId?: string;
  injectedValue?: string;
}

export interface SystemMetricsDto {
  totalMessages: number;
  ledgerHeight: number;
  chainIntegrityValid: boolean;
  replayAttemptsBlocked: number;
  tamperedEventsDetected: number;
  activeUnitsCount: number;
  systemUptime: string;
  classificationLabel: string;
  ledgerTypeLabel: string;
}

export interface BatchSyncRequest {
  queuedMessages: SendMessageRequest[];
}

export interface BatchSyncResponse {
  totalReceived: number;
  successfullySynced: number;
  duplicatesBlocked: number;
  auditLogs: string[];
  currentLedgerHeight: number;
}

export interface QueuedOfflineMessage extends SendMessageRequest {
  localId: string;
  queuedAt: string;
}
