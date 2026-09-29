/**
 * VERIWORK - Type Definitions & Core Data Models
 * "Evidence-Based Verification of Physical Maintenance Claims"
 */

export type TaskStatus = 
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'EVIDENCE_SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'PARTIAL'
  | 'SUSPICIOUS'
  | 'CLOSED';

export type VerificationVerdict = 'VERIFIED' | 'PARTIAL' | 'SUSPICIOUS';

export type ChallengeStatus = 'NO_CHALLENGE' | 'OPEN' | 'RESOLVED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 'FACILITY_MANAGER' | 'TECHNICIAN' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  organization: string;
  walletAddress: string;
  avatar?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  building: string;
  facility: string;
  installDate?: string;
  specifications?: Record<string, string>;
}

export type RequiredEvidenceType = 
  | 'BEFORE_PHOTO'
  | 'AFTER_PHOTO'
  | 'TECHNICIAN_ID'
  | 'TIMESTAMP_PROOF'
  | 'COMPLETION_DECLARATION'
  | 'SENSOR_TELEMETRY';

export interface EvidenceItem {
  id: string;
  type: RequiredEvidenceType;
  label: string;
  description: string;
  fileHash: string; // SHA-256 of the artifact/evidence
  perceptualHash?: string; // pHash / perceptual fingerprint for similarity/reuse detection
  dataUrl?: string; // visual or structured representation
  metadata: {
    capturedAt: string;
    capturedBy: string;
    gpsCoordinates?: { lat: number; lng: number };
    deviceModel?: string;
    fileSizeKb: number;
    mimeType: string;
    readings?: Record<string, number | string>;
    originalFilename?: string;
  };
}

export interface CanonicalEvidencePackage {
  packageId: string;
  taskId: string;
  assetId: string;
  technicianId: string;
  submissionTimestamp: string;
  evidenceItems: EvidenceItem[];
  completionDeclaration: {
    statement: string;
    declaredAt: string;
    signedBy: string;
    materialsUsed: string[];
    hoursSpent: number;
  };
  metadata: {
    schemaVersion: string;
    systemNonce: string;
  };
}

export interface AnomalyReport {
  id: string;
  type: 
    | 'EVIDENCE_REUSE'
    | 'MISSING_EVIDENCE'
    | 'TIMELINE_INCONSISTENCY'
    | 'METADATA_MISMATCH'
    | 'INSUFFICIENT_VISUAL_DELTA'
    | 'TAMPER_DETECTED'
    | 'EXPIRED_TIMESTAMP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  flaggedEvidenceIds?: string[];
  conflictingTaskId?: string;
  conflictingTimestamp?: string;
}

export interface IntegrityScoreBreakdown {
  completeness: number;      // 0 - 100
  uniqueness: number;        // 0 - 100
  timeline: number;          // 0 - 100
  metadata: number;          // 0 - 100
  crossEvidence: number;     // 0 - 100
  blockchainIntegrity: number; // 0 - 100
  totalScore: number;        // 0 - 100
}

export interface VerificationCheckItem {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  details: string;
  category: 'COMPLETENESS' | 'UNIQUENESS' | 'TIMELINE' | 'METADATA' | 'VISUAL_DELTA' | 'BLOCKCHAIN';
}

export interface VerificationResult {
  id: string;
  taskId: string;
  packageId: string;
  verdict: VerificationVerdict;
  confidence: number; // 0 - 100%
  verifiedAt: string;
  integrityScore: IntegrityScoreBreakdown;
  reasons: string[];
  anomalies: AnomalyReport[];
  checks: VerificationCheckItem[];
  recommendation: string;
  aiExplanation?: string;
  isAiEnhanced?: boolean;
}

export interface BlockchainCommitment {
  txHash: string;
  blockNumber: number;
  blockTimestamp: string;
  gasUsed: number;
  network: string; // e.g. 'MST DevNet / EVM'
  contractAddress: string;
  evidenceHash: string; // SHA-256 canonical hash anchored on chain
  verdictRecorded: VerificationVerdict | 'UNVERIFIED' | 'PENDING';
  committedBy: string;
  state: 'CONFIRMED' | 'PENDING' | 'TAMPER_DETECTED';
  explorerUrl?: string;
}

export interface Challenge {
  id: string;
  taskId: string;
  challenger: string;
  challengerRole: UserRole;
  challengedAt: string;
  reason: string;
  status: ChallengeStatus;
  resolutionNote?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  blockchainTxRef?: string;
}

export interface AuditEvent {
  id: string;
  taskId: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: UserRole;
  description: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  blockchainTxRef?: string;
  evidenceHashSnapshot?: string;
  metadata?: Record<string, unknown>;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  asset: Asset;
  priority: PriorityLevel;
  status: TaskStatus;
  verificationVerdict?: VerificationVerdict;
  assignedTechnician?: User;
  createdBy: User;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  closedAt?: string;
  requiredActions: string[];
  requiredEvidenceTypes: RequiredEvidenceType[];
  evidencePackage?: CanonicalEvidencePackage;
  currentEvidenceHash?: string;
  anchoredEvidenceHash?: string;
  isTampered?: boolean;
  tamperFieldModified?: string;
  verificationResult?: VerificationResult;
  blockchainCommitment?: BlockchainCommitment;
  challenge?: Challenge;
  auditHistory: AuditEvent[];
}

export interface EvidenceGraphNode {
  id: string;
  label: string;
  type: 'TASK' | 'ASSET' | 'TECHNICIAN' | 'EVIDENCE' | 'VERIFICATION' | 'COMMITMENT' | 'ALERT';
  status?: string;
  subtitle?: string;
  meta?: Record<string, unknown>;
  isFlagged?: boolean;
  x?: number;
  y?: number;
}

export interface EvidenceGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isWarning?: boolean;
  isDashed?: boolean;
}

export interface EvidenceGraphData {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
}

export interface DashboardMetrics {
  activeTasks: number;
  evidenceSubmitted: number;
  verifiedCount: number;
  partialCount: number;
  suspiciousCount: number;
  openChallenges: number;
  blockchainCommitments: number;
  evidenceReuseAlerts: number;
  averageIntegrityScore: number;
}
