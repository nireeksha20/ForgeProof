import {
  MaintenanceTask,
  User,
  Asset,
  CanonicalEvidencePackage,
  VerificationResult,
  EvidenceGraphData,
  EvidenceGraphNode,
  EvidenceGraphEdge,
  AuditEvent,
  DashboardMetrics,
  Challenge,
} from '../src/types/veriwork';
import { computeCanonicalEvidenceHash, verificationEngine } from './verificationEngine';
import { blockchainService } from './blockchainService';

export const DEMO_USERS: Record<string, User> = {
  manager: {
    id: 'USR-MGR-01',
    name: 'Elena Rostova',
    role: 'FACILITY_MANAGER',
    organization: 'Apex Campus Infrastructure Ltd',
    walletAddress: '0x4A13b6D535E348651a24d553E477b89569766907',
  },
  technician1: {
    id: 'TECH-09',
    name: 'Marcus Vance',
    role: 'TECHNICIAN',
    organization: 'Metro Electro-Mechanical Services',
    walletAddress: '0x992B7cfB790aD8534C152B34B9C49A5462D6E771',
  },
  technician2: {
    id: 'TECH-14',
    name: 'Sarah Chen',
    role: 'TECHNICIAN',
    organization: 'Apex Facility Internal Staff',
    walletAddress: '0x23aF0860A831a296B033A031F25fC2F2192737D8',
  },
  auditor: {
    id: 'AUD-03',
    name: 'Dr. Aris Thorne',
    role: 'AUDITOR',
    organization: 'Independent VeriWork Auditing Board',
    walletAddress: '0xDE995166F42a6F4A853a48e7eF1D32b212351234',
  },
};

export const DEMO_ASSETS: Record<string, Asset> = {
  pump07: {
    id: 'ASSET-PUMP-07',
    name: 'Primary Chilled Water Booster Pump #7',
    type: 'Centrifugal Industrial Pump',
    location: 'Basement Level B2, Mechanical Room West',
    building: 'Engineering Block 4',
    facility: 'Central Campus Complex',
    specifications: {
      flowRate: '450 GPM',
      maxPressure: '120 PSI',
      motorPower: '18.5 kW',
    },
  },
  hvac12: {
    id: 'ASSET-HVAC-12',
    name: 'Rooftop Air Handling Unit AHU-12',
    type: 'HVAC Air Purification Unit',
    location: 'Roof Deck Sector C',
    building: 'Science & Research Tower',
    facility: 'Central Campus Complex',
    specifications: {
      filterGrade: 'MERV-14 Hepa',
      airVolume: '8500 CFM',
    },
  },
  elevator03: {
    id: 'ASSET-ELEV-03',
    name: 'High-Speed Traction Hoist Motor - Car #3',
    type: 'Permanent Magnet Gearless Elevator Motor',
    location: 'Machine Penthouse Floor 18',
    building: 'Executive Plaza',
    facility: 'Central Campus Complex',
    specifications: {
      speedRating: '3.5 m/s',
      ratedLoad: '1600 kg',
    },
  },
  fireExt09: {
    id: 'ASSET-FIRE-09',
    name: 'Co2 Fire Suppression System & Extinguisher Bank',
    type: 'High-Pressure Safety Suppression',
    location: 'Floor 3 Server Data Center Corridor',
    building: 'Technology Pavilion',
    facility: 'Central Campus Complex',
    specifications: {
      cylinderCharge: '45 kg Co2',
      pressureCheckInterval: 'Quarterly',
    },
  },
  conduit44: {
    id: 'ASSET-ELEC-44',
    name: 'Main Substation Busway & Distribution Conduit',
    type: '480V 3-Phase Busway Junction',
    location: 'Substation Yard East',
    building: 'Grid Ingress Building',
    facility: 'Central Campus Complex',
    specifications: {
      voltage: '480V / 277V',
      ratedAmperage: '1200A',
    },
  },
};

export class DemoStore {
  private tasks: Map<string, MaintenanceTask> = new Map();
  private auditLogs: Map<string, AuditEvent[]> = new Map();

  constructor() {
    this.seedInitialScenarios();
  }

  public resetToDefault() {
    this.tasks.clear();
    this.auditLogs.clear();
    this.seedInitialScenarios();
  }

  private seedInitialScenarios() {
    const now = Date.now();
    const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();

    // ==============================================================
    // SCENARIO 1: TASK-1042 - Genuine Repair (VERIFIED)
    // ==============================================================
    const task1042Pkg: CanonicalEvidencePackage = {
      packageId: 'PKG-1042-EVD',
      taskId: 'TASK-1042',
      assetId: 'ASSET-PUMP-07',
      technicianId: 'TECH-09',
      submissionTimestamp: iso(3600000 * 2), // 2 hours ago
      evidenceItems: [
        {
          id: 'EVD-1042-01',
          type: 'BEFORE_PHOTO',
          label: 'Flange Joint Active Leakage (Before)',
          description: 'High-resolution photo showing water dripping at 1.2 L/min from gasket flange with standing pool on concrete base.',
          fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          perceptualHash: 'phash_pump_leak_9a8f2130e1',
          metadata: {
            capturedAt: iso(3600000 * 3.5),
            capturedBy: 'TECH-09',
            gpsCoordinates: { lat: 37.7749, lng: -122.4194 },
            deviceModel: 'FLIR E8-XT Pro Industrial Camera',
            fileSizeKb: 3420,
            mimeType: 'image/jpeg',
            readings: { pressureLeakPsi: 42, ambientTempC: 21.4 },
          },
        },
        {
          id: 'EVD-1042-02',
          type: 'AFTER_PHOTO',
          label: 'Torqued Flange with New EPDM Gasket (After)',
          description: 'Photo showing newly installed blue EPDM gasket torqued to 85 Nm, bone dry flange surface and clean wiped floor.',
          fileHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          perceptualHash: 'phash_pump_repaired_3c4d7e9b01',
          metadata: {
            capturedAt: iso(3600000 * 2.2),
            capturedBy: 'TECH-09',
            gpsCoordinates: { lat: 37.7749, lng: -122.4194 },
            deviceModel: 'FLIR E8-XT Pro Industrial Camera',
            fileSizeKb: 3580,
            mimeType: 'image/jpeg',
            readings: { operatingPressurePsi: 95, leakDetected: 0 },
          },
        },
        {
          id: 'EVD-1042-03',
          type: 'TECHNICIAN_ID',
          label: 'NFC Badge Verification & Identity Proof',
          description: 'Cryptographically signed NFC credential from technician smart card.',
          fileHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          metadata: {
            capturedAt: iso(3600000 * 3.8),
            capturedBy: 'TECH-09',
            fileSizeKb: 12,
            mimeType: 'application/json',
            readings: { badgeId: 'NFC-TECH-09-VANCE', certExpires: '2027-12-31' },
          },
        },
        {
          id: 'EVD-1042-04',
          type: 'TIMESTAMP_PROOF',
          label: 'NTP Time-Lock Cryptographic Attestation',
          description: 'NIST Stratum-1 RFC 3161 cryptographic timestamp token anchor.',
          fileHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          metadata: {
            capturedAt: iso(3600000 * 2.1),
            capturedBy: 'NTP-NIST-SERVER',
            fileSizeKb: 8,
            mimeType: 'application/pkcs7-signature',
          },
        },
        {
          id: 'EVD-1042-05',
          type: 'COMPLETION_DECLARATION',
          label: 'Technician Work Order Sign-Off & Declaration',
          description: 'Official digital declaration stating work was performed according to ASME standards.',
          fileHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          metadata: {
            capturedAt: iso(3600000 * 2.05),
            capturedBy: 'TECH-09',
            fileSizeKb: 45,
            mimeType: 'application/pdf',
          },
        },
      ],
      completionDeclaration: {
        statement: 'I declare under penalty of contractor de-authorization that the flange joint on Primary Chilled Water Booster Pump #7 was disassembled, old deteriorated gasket removed, mating surfaces chemically cleaned, new 4-inch EPDM gasket installed, and torqued in star pattern to 85 Nm. 30-minute hydrostatic run showed zero pressure drop.',
        declaredAt: iso(3600000 * 2.05),
        signedBy: 'TECH-09 (Marcus Vance)',
        materialsUsed: ['EPDM High-Temp Flange Gasket 4-inch', 'Grade-8 Stainless Bolts (8x)', 'Thread Lubricant'],
        hoursSpent: 1.8,
      },
      metadata: {
        schemaVersion: '1.0.0-canonical',
        systemNonce: 'NONCE-1042-99812',
      },
    };

    const task1042CanonicalHash = computeCanonicalEvidenceHash(task1042Pkg);
    const task1042TxHash = '0x8f4d1e992b8a7c645231e0b54321fedcba0987654321abcdef0123456789abcd';

    const task1042: MaintenanceTask = {
      id: 'TASK-1042',
      title: 'Water Leakage Repair on Chilled Booster Pump',
      description: 'Severe water leak detected near basement pump 7. Requires inspection, seal replacement, hydrostatic verification, and before/after evidence.',
      asset: DEMO_ASSETS.pump07,
      priority: 'HIGH',
      status: 'VERIFIED',
      verificationVerdict: 'VERIFIED',
      assignedTechnician: DEMO_USERS.technician1,
      createdBy: DEMO_USERS.manager,
      createdAt: iso(3600000 * 5),
      assignedAt: iso(3600000 * 4.2),
      startedAt: iso(3600000 * 3.8),
      submittedAt: iso(3600000 * 2),
      verifiedAt: iso(3600000 * 1.9),
      requiredActions: [
        'Inspect leakage origin and measure pressure drop',
        'Replace flange seal gasket with ASME certified material',
        'Torque bolts to specification in star sequence',
        'Conduct 30-min hydrostatic pressure test',
        'Submit canonical before and after photographic evidence',
      ],
      requiredEvidenceTypes: [
        'BEFORE_PHOTO',
        'AFTER_PHOTO',
        'TECHNICIAN_ID',
        'TIMESTAMP_PROOF',
        'COMPLETION_DECLARATION',
      ],
      evidencePackage: task1042Pkg,
      currentEvidenceHash: task1042CanonicalHash,
      anchoredEvidenceHash: task1042CanonicalHash,
      isTampered: false,
      verificationResult: {
        id: 'VERIF-1042',
        taskId: 'TASK-1042',
        packageId: 'PKG-1042-EVD',
        verdict: 'VERIFIED',
        confidence: 96,
        verifiedAt: iso(3600000 * 1.9),
        integrityScore: {
          completeness: 100,
          uniqueness: 100,
          timeline: 95,
          metadata: 100,
          crossEvidence: 95,
          blockchainIntegrity: 100,
          totalScore: 98,
        },
        reasons: [
          'All 5 required evidence artifacts are present and cryptographically signed.',
          'Evidence is unique; no historical duplicate or replay found.',
          'Chronological sequence creation -> assignment -> work -> submission is valid.',
          'Asset and technician identities match task record.',
          'Visual evidence supports the claimed physical change between before and after inspection.',
          'Canonical evidence package hash successfully anchored on MST block #140224.',
        ],
        anomalies: [],
        checks: [
          { id: 'CHK-1', name: 'Evidence Requirement Completeness', passed: true, score: 100, details: 'All 5 mandatory items submitted.', category: 'COMPLETENESS' },
          { id: 'CHK-2', name: 'Evidence Uniqueness & Replay Detection', passed: true, score: 100, details: 'Zero duplicate artifacts detected across historical registry.', category: 'UNIQUENESS' },
          { id: 'CHK-3', name: 'Chronological Sequence & Window', passed: true, score: 95, details: 'Sequence is consistent with on-site work times.', category: 'TIMELINE' },
          { id: 'CHK-4', name: 'Task & Asset Metadata Integrity', passed: true, score: 100, details: 'Asset ASSET-PUMP-07 and Tech TECH-09 verified.', category: 'METADATA' },
          { id: 'CHK-5', name: 'Visual Evidence Delta Analysis', passed: true, score: 95, details: 'Visual evidence supports the claimed change.', category: 'VISUAL_DELTA' },
          { id: 'CHK-6', name: 'MST Cryptographic Commitment Alignment', passed: true, score: 100, details: 'Exact SHA-256 match with MST on-chain record.', category: 'BLOCKCHAIN' },
        ],
        recommendation: 'Approve task claim. Evidence commitment is tamper-evident and verified.',
        aiExplanation: 'VeriWork verifies submitted evidence and records a tamper-evident commitment to the verification history. All required photographic, cryptographic, and metadata artifacts corroborate the claimed physical gasket replacement. Hydrostatic sensor readings and visual delta show leak remediation.',
        isAiEnhanced: true,
      },
      blockchainCommitment: {
        txHash: task1042TxHash,
        blockNumber: 140224,
        blockTimestamp: iso(3600000 * 1.9),
        gasUsed: 62410,
        network: 'MST EVM Network (Chain ID: 13371)',
        contractAddress: '0x71C94B2a6136d4A93c04229614f1d43fE67140B8',
        evidenceHash: task1042CanonicalHash,
        verdictRecorded: 'VERIFIED',
        committedBy: DEMO_USERS.technician1.walletAddress,
        state: 'CONFIRMED',
        explorerUrl: `https://explorer.mst-network.io/tx/${task1042TxHash}`,
      },
      auditHistory: [
        {
          id: 'AUD-1042-1',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 5),
          action: 'Task Created',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Maintenance claim registered for pump seal leakage.',
          fromStatus: undefined,
          toStatus: 'CREATED',
        },
        {
          id: 'AUD-1042-2',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 4.2),
          action: 'Task Assigned',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Assigned to certified contractor Marcus Vance (TECH-09).',
          fromStatus: 'CREATED',
          toStatus: 'ASSIGNED',
        },
        {
          id: 'AUD-1042-3',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 3.8),
          action: 'Work Started',
          actor: 'Marcus Vance',
          actorRole: 'TECHNICIAN',
          description: 'Technician checked in at Basement B2 pump station.',
          fromStatus: 'ASSIGNED',
          toStatus: 'IN_PROGRESS',
        },
        {
          id: 'AUD-1042-4',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 2),
          action: 'Evidence Package Submitted',
          actor: 'Marcus Vance',
          actorRole: 'TECHNICIAN',
          description: '5 evidence artifacts bundled into canonical manifest PKG-1042-EVD.',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'EVIDENCE_SUBMITTED',
          evidenceHashSnapshot: task1042CanonicalHash,
        },
        {
          id: 'AUD-1042-5',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 1.95),
          action: 'Verification Pipeline Executed',
          actor: 'VeriWork Engine',
          actorRole: 'AUDITOR',
          description: 'Completeness, replay, timeline, and visual delta tests passed with 98% integrity score.',
          fromStatus: 'EVIDENCE_SUBMITTED',
          toStatus: 'UNDER_VERIFICATION',
        },
        {
          id: 'AUD-1042-6',
          taskId: 'TASK-1042',
          timestamp: iso(3600000 * 1.9),
          action: 'Commitment Anchored on MST',
          actor: 'VeriWork Smart Contract',
          actorRole: 'AUDITOR',
          description: `Evidence hash ${task1042CanonicalHash.slice(0, 16)}... committed to MST Block #140224.`,
          fromStatus: 'UNDER_VERIFICATION',
          toStatus: 'VERIFIED',
          blockchainTxRef: task1042TxHash,
        },
      ],
    };

    // ==============================================================
    // SCENARIO 2: TASK-1055 - Missing Evidence (PARTIAL)
    // ==============================================================
    const task1055Pkg: CanonicalEvidencePackage = {
      packageId: 'PKG-1055-EVD',
      taskId: 'TASK-1055',
      assetId: 'ASSET-HVAC-12',
      technicianId: 'TECH-14',
      submissionTimestamp: iso(3600000 * 1.2),
      evidenceItems: [
        {
          id: 'EVD-1055-01',
          type: 'BEFORE_PHOTO',
          label: 'Dust-Clogged Hepa Air Filter Bank (Before)',
          description: 'Pre-replacement view of contaminated pleated media.',
          fileHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
          perceptualHash: 'phash_hvac_filter_dirty_44',
          metadata: {
            capturedAt: iso(3600000 * 2),
            capturedBy: 'TECH-14',
            fileSizeKb: 2800,
            mimeType: 'image/jpeg',
          },
        },
        {
          id: 'EVD-1055-02',
          type: 'AFTER_PHOTO',
          label: 'New MERV-14 Hepa Filter Pack Installed (After)',
          description: 'Post-replacement view showing pristine clean filter cartridges.',
          fileHash: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
          perceptualHash: 'phash_hvac_filter_clean_77',
          metadata: {
            capturedAt: iso(3600000 * 1.3),
            capturedBy: 'TECH-14',
            fileSizeKb: 2950,
            mimeType: 'image/jpeg',
          },
        },
        // NOTICE: Missing TECHNICIAN_ID proof and COMPLETION_DECLARATION
      ],
      completionDeclaration: {
        statement: '', // Missing formal statement
        declaredAt: iso(3600000 * 1.2),
        signedBy: '',
        materialsUsed: ['MERV-14 Hepa Filter Box (4x)'],
        hoursSpent: 1.0,
      },
      metadata: {
        schemaVersion: '1.0.0-canonical',
        systemNonce: 'NONCE-1055-33120',
      },
    };

    const task1055CanonicalHash = computeCanonicalEvidenceHash(task1055Pkg);
    const task1055TxHash = '0x1234abcd5678ef90123456789abcdef0123456789abcdef0123456789abcdef0';

    const task1055: MaintenanceTask = {
      id: 'TASK-1055',
      title: 'Quarterly Air Filter Replacement AHU-12',
      description: 'Replace HEPA intake filters on rooftop AHU-12. Requires before photo, after photo, technician identity attestation, and signed declaration.',
      asset: DEMO_ASSETS.hvac12,
      priority: 'MEDIUM',
      status: 'PARTIAL',
      verificationVerdict: 'PARTIAL',
      assignedTechnician: DEMO_USERS.technician2,
      createdBy: DEMO_USERS.manager,
      createdAt: iso(3600000 * 6),
      assignedAt: iso(3600000 * 4),
      startedAt: iso(3600000 * 2.5),
      submittedAt: iso(3600000 * 1.2),
      verifiedAt: iso(3600000 * 1.1),
      requiredActions: [
        'Isolate air handling unit electrical disconnect',
        'Extract loaded filter cartridges',
        'Sanitize plenum track',
        'Install new MERV-14 units',
        'Sign work declaration and provide badge attestation',
      ],
      requiredEvidenceTypes: [
        'BEFORE_PHOTO',
        'AFTER_PHOTO',
        'TECHNICIAN_ID',
        'COMPLETION_DECLARATION',
      ],
      evidencePackage: task1055Pkg,
      currentEvidenceHash: task1055CanonicalHash,
      anchoredEvidenceHash: task1055CanonicalHash,
      isTampered: false,
      verificationResult: {
        id: 'VERIF-1055',
        taskId: 'TASK-1055',
        packageId: 'PKG-1055-EVD',
        verdict: 'PARTIAL',
        confidence: 84,
        verifiedAt: iso(3600000 * 1.1),
        integrityScore: {
          completeness: 50,
          uniqueness: 100,
          timeline: 90,
          metadata: 70,
          crossEvidence: 85,
          blockchainIntegrity: 100,
          totalScore: 78,
        },
        reasons: [
          'Technician identity evidence missing (TECHNICIAN_ID artifact absent).',
          'Completion declaration has no signed statement or signature hash.',
          'Before/After photographic evidence is present and visually distinct.',
        ],
        anomalies: [
          {
            id: 'ANOM-1055-1',
            type: 'MISSING_EVIDENCE',
            severity: 'HIGH',
            title: 'Technician Identity Evidence Missing',
            description: 'Task requires TECHNICIAN_ID and COMPLETION_DECLARATION, but contractor failed to attach cryptographic badge signature.',
          },
        ],
        checks: [
          { id: 'CHK-1', name: 'Evidence Requirement Completeness', passed: false, score: 50, details: 'Missing 2 mandatory evidence types.', category: 'COMPLETENESS' },
          { id: 'CHK-2', name: 'Evidence Uniqueness & Replay Detection', passed: true, score: 100, details: 'No duplicate images detected.', category: 'UNIQUENESS' },
          { id: 'CHK-3', name: 'Chronological Sequence & Window', passed: true, score: 90, details: 'Timeline order consistent.', category: 'TIMELINE' },
          { id: 'CHK-4', name: 'Task & Asset Metadata Integrity', passed: false, score: 70, details: 'Missing sign-off actor.', category: 'METADATA' },
          { id: 'CHK-5', name: 'Visual Evidence Delta Analysis', passed: true, score: 85, details: 'Visual evidence supports the claimed change.', category: 'VISUAL_DELTA' },
          { id: 'CHK-6', name: 'MST Cryptographic Commitment Alignment', passed: true, score: 100, details: 'Canonical hash matches commitment.', category: 'BLOCKCHAIN' },
        ],
        recommendation: 'Request technician submit missing technician identity and signed declaration before final verification.',
        aiExplanation: 'VeriWork verifies submitted evidence and records a tamper-evident commitment to the verification history. Filter photographs corroborate physical presence, but missing technician identity credentials and blank declaration prevent full verification.',
        isAiEnhanced: true,
      },
      blockchainCommitment: {
        txHash: task1055TxHash,
        blockNumber: 140226,
        blockTimestamp: iso(3600000 * 1.1),
        gasUsed: 54200,
        network: 'MST EVM Network (Chain ID: 13371)',
        contractAddress: '0x71C94B2a6136d4A93c04229614f1d43fE67140B8',
        evidenceHash: task1055CanonicalHash,
        verdictRecorded: 'PARTIAL',
        committedBy: DEMO_USERS.technician2.walletAddress,
        state: 'CONFIRMED',
        explorerUrl: `https://explorer.mst-network.io/tx/${task1055TxHash}`,
      },
      auditHistory: [
        {
          id: 'AUD-1055-1',
          taskId: 'TASK-1055',
          timestamp: iso(3600000 * 6),
          action: 'Task Created',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Quarterly filter service order created.',
          toStatus: 'CREATED',
        },
        {
          id: 'AUD-1055-2',
          taskId: 'TASK-1055',
          timestamp: iso(3600000 * 1.2),
          action: 'Evidence Submitted (Partial)',
          actor: 'Sarah Chen',
          actorRole: 'TECHNICIAN',
          description: 'Submitted 2 of 4 required evidence types.',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'EVIDENCE_SUBMITTED',
        },
        {
          id: 'AUD-1055-3',
          taskId: 'TASK-1055',
          timestamp: iso(3600000 * 1.1),
          action: 'Verification Recorded as PARTIAL',
          actor: 'VeriWork Engine',
          actorRole: 'AUDITOR',
          description: 'Verdict PARTIAL committed to MST blockchain.',
          fromStatus: 'UNDER_VERIFICATION',
          toStatus: 'PARTIAL',
          blockchainTxRef: task1055TxHash,
        },
      ],
    };

    // ==============================================================
    // SCENARIO 3: TASK-1071 - Suspicious Evidence Reuse (SUSPICIOUS)
    // Reuses photo hash from TASK-1042!
    // ==============================================================
    const task1071Pkg: CanonicalEvidencePackage = {
      packageId: 'PKG-1071-EVD',
      taskId: 'TASK-1071',
      assetId: 'ASSET-ELEV-03',
      technicianId: 'TECH-09',
      submissionTimestamp: iso(3600000 * 0.8),
      evidenceItems: [
        {
          id: 'EVD-1071-01',
          type: 'BEFORE_PHOTO',
          label: 'Elevator Hoist Motor Bearing (Before)',
          description: 'Submitting evidence claimed to be elevator motor inspection...',
          // REUSED HASH from TASK-1042-01!
          fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          perceptualHash: 'phash_pump_leak_9a8f2130e1',
          metadata: {
            capturedAt: iso(3600000 * 1),
            capturedBy: 'TECH-09',
            fileSizeKb: 3420,
            mimeType: 'image/jpeg',
          },
        },
        {
          id: 'EVD-1071-02',
          type: 'AFTER_PHOTO',
          label: 'Elevator Motor Re-Lubricated (After)',
          description: 'Completed re-lubrication of bearing...',
          fileHash: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
          perceptualHash: 'phash_elev_motor_fresh_88',
          metadata: {
            capturedAt: iso(3600000 * 0.85),
            capturedBy: 'TECH-09',
            fileSizeKb: 3100,
            mimeType: 'image/jpeg',
          },
        },
      ],
      completionDeclaration: {
        statement: 'Claimed elevator motor service completed.',
        declaredAt: iso(3600000 * 0.8),
        signedBy: 'TECH-09',
        materialsUsed: ['Synthetic Bearing Grease ISO-VG 220'],
        hoursSpent: 2.0,
      },
      metadata: {
        schemaVersion: '1.0.0-canonical',
        systemNonce: 'NONCE-1071-77218',
      },
    };

    const task1071CanonicalHash = computeCanonicalEvidenceHash(task1071Pkg);
    const task1071TxHash = '0xabcdef78901234567890abcdef1234567890abcdef1234567890abcdef123456';

    const task1071: MaintenanceTask = {
      id: 'TASK-1071',
      title: 'Elevator Hoist Motor Bearing Lubrication',
      description: 'Scheduled bearing re-greasing on high-speed hoist motor car 3.',
      asset: DEMO_ASSETS.elevator03,
      priority: 'CRITICAL',
      status: 'SUSPICIOUS',
      verificationVerdict: 'SUSPICIOUS',
      assignedTechnician: DEMO_USERS.technician1,
      createdBy: DEMO_USERS.manager,
      createdAt: iso(3600000 * 4),
      assignedAt: iso(3600000 * 3),
      startedAt: iso(3600000 * 1.5),
      submittedAt: iso(3600000 * 0.8),
      verifiedAt: iso(3600000 * 0.75),
      requiredActions: [
        'Inspect motor bearing vibration',
        'Inject certified synthetic lubricant',
        'Submit before and after inspection evidence',
      ],
      requiredEvidenceTypes: ['BEFORE_PHOTO', 'AFTER_PHOTO'],
      evidencePackage: task1071Pkg,
      currentEvidenceHash: task1071CanonicalHash,
      anchoredEvidenceHash: task1071CanonicalHash,
      isTampered: false,
      verificationResult: {
        id: 'VERIF-1071',
        taskId: 'TASK-1071',
        packageId: 'PKG-1071-EVD',
        verdict: 'SUSPICIOUS',
        confidence: 93,
        verifiedAt: iso(3600000 * 0.75),
        integrityScore: {
          completeness: 100,
          uniqueness: 10,
          timeline: 90,
          metadata: 50,
          crossEvidence: 40,
          blockchainIntegrity: 100,
          totalScore: 54,
        },
        reasons: [
          'Potential evidence reuse detected: Evidence artifact (e3b0c442...) was previously submitted for TASK-1042.',
          'Asset category mismatch: Chilled pump photo submitted for elevator motor task.',
        ],
        anomalies: [
          {
            id: 'ANOM-1071-REUSE',
            type: 'EVIDENCE_REUSE',
            severity: 'CRITICAL',
            title: 'Critical Evidence Replay / Cross-Task Reuse Detected',
            description: 'The exact SHA-256 binary hash and perceptual fingerprint of submitted "Before" image EVD-1071-01 was already registered on MST for TASK-1042 (Water Leakage Repair on Chilled Booster Pump).',
            conflictingTaskId: 'TASK-1042',
            flaggedEvidenceIds: ['EVD-1071-01', 'EVD-1042-01'],
          },
        ],
        checks: [
          { id: 'CHK-1', name: 'Evidence Requirement Completeness', passed: true, score: 100, details: 'All items submitted.', category: 'COMPLETENESS' },
          { id: 'CHK-2', name: 'Evidence Uniqueness & Replay Detection', passed: false, score: 10, details: '🚨 Binary duplicate detected from TASK-1042.', category: 'UNIQUENESS' },
          { id: 'CHK-3', name: 'Chronological Sequence & Window', passed: true, score: 90, details: 'Sequence valid.', category: 'TIMELINE' },
          { id: 'CHK-4', name: 'Task & Asset Metadata Integrity', passed: false, score: 50, details: 'Cross-equipment replay indicates fraudulent package.', category: 'METADATA' },
          { id: 'CHK-5', name: 'Visual Evidence Delta Analysis', passed: false, score: 40, details: 'Insufficient visual evidence to establish claimed change.', category: 'VISUAL_DELTA' },
          { id: 'CHK-6', name: 'MST Cryptographic Commitment Alignment', passed: true, score: 100, details: 'Anchored on chain.', category: 'BLOCKCHAIN' },
        ],
        recommendation: 'Manual audit recommended. Replay alert triggered. Flag contractor account and freeze payment.',
        aiExplanation: 'VeriWork verifies submitted evidence and records a tamper-evident commitment to the verification history. Deterministic evidence fingerprinting flagged an identical binary artifact submitted across disparate tasks (Pump Leakage vs Elevator Motor). Physical claim rejected.',
        isAiEnhanced: true,
      },
      blockchainCommitment: {
        txHash: task1071TxHash,
        blockNumber: 140228,
        blockTimestamp: iso(3600000 * 0.75),
        gasUsed: 59300,
        network: 'MST EVM Network (Chain ID: 13371)',
        contractAddress: '0x71C94B2a6136d4A93c04229614f1d43fE67140B8',
        evidenceHash: task1071CanonicalHash,
        verdictRecorded: 'SUSPICIOUS',
        committedBy: DEMO_USERS.technician1.walletAddress,
        state: 'CONFIRMED',
        explorerUrl: `https://explorer.mst-network.io/tx/${task1071TxHash}`,
      },
      auditHistory: [
        {
          id: 'AUD-1071-1',
          taskId: 'TASK-1071',
          timestamp: iso(3600000 * 4),
          action: 'Task Created',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Elevator motor maintenance dispatched.',
          toStatus: 'CREATED',
        },
        {
          id: 'AUD-1071-2',
          taskId: 'TASK-1071',
          timestamp: iso(3600000 * 0.8),
          action: 'Evidence Submitted',
          actor: 'Marcus Vance',
          actorRole: 'TECHNICIAN',
          description: 'Technician uploaded inspection photos.',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'EVIDENCE_SUBMITTED',
        },
        {
          id: 'AUD-1071-3',
          taskId: 'TASK-1071',
          timestamp: iso(3600000 * 0.75),
          action: 'Replay Detection Triggered',
          actor: 'VeriWork Engine',
          actorRole: 'AUDITOR',
          description: 'Replay engine flagged identical hash matching TASK-1042.',
          fromStatus: 'UNDER_VERIFICATION',
          toStatus: 'SUSPICIOUS',
          blockchainTxRef: task1071TxHash,
        },
      ],
    };

    // ==============================================================
    // SCENARIO 4: TASK-1089 - Timeline Anomaly (SUSPICIOUS)
    // Completion submitted before assignment timestamp!
    // ==============================================================
    const task1089Pkg: CanonicalEvidencePackage = {
      packageId: 'PKG-1089-EVD',
      taskId: 'TASK-1089',
      assetId: 'ASSET-FIRE-09',
      technicianId: 'TECH-14',
      // IMPOSSIBLE: Evidence submitted 5 hours ago, but task was only assigned 1 hour ago!
      submissionTimestamp: iso(3600000 * 5),
      evidenceItems: [
        {
          id: 'EVD-1089-01',
          type: 'BEFORE_PHOTO',
          label: 'Pressure Gauge Inspection (Pre-Test)',
          description: 'Gauge reading 52 bar.',
          fileHash: '3344556677889900112233445566778899001122334455667788990011223344',
          metadata: {
            capturedAt: iso(3600000 * 5.2),
            capturedBy: 'TECH-14',
            fileSizeKb: 1980,
            mimeType: 'image/jpeg',
          },
        },
        {
          id: 'EVD-1089-02',
          type: 'AFTER_PHOTO',
          label: 'Inspection Tag Affixed',
          description: 'Tag punched for Q3.',
          fileHash: '5566778899001122334455667788990011223344556677889900112233445566',
          metadata: {
            capturedAt: iso(3600000 * 5.1),
            capturedBy: 'TECH-14',
            fileSizeKb: 2100,
            mimeType: 'image/jpeg',
          },
        },
      ],
      completionDeclaration: {
        statement: 'Inspection completed before assignment.',
        declaredAt: iso(3600000 * 5),
        signedBy: 'TECH-14',
        materialsUsed: ['Certification Inspection Seal Tag'],
        hoursSpent: 0.5,
      },
      metadata: {
        schemaVersion: '1.0.0-canonical',
        systemNonce: 'NONCE-1089-11200',
      },
    };

    const task1089CanonicalHash = computeCanonicalEvidenceHash(task1089Pkg);
    const task1089TxHash = '0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff';

    const task1089: MaintenanceTask = {
      id: 'TASK-1089',
      title: 'Quarterly Fire Suppression Cylinder Certification',
      description: 'Mandatory quarterly pressure and weight inspection for server room fire suppression bank.',
      asset: DEMO_ASSETS.fireExt09,
      priority: 'CRITICAL',
      status: 'SUSPICIOUS',
      verificationVerdict: 'SUSPICIOUS',
      assignedTechnician: DEMO_USERS.technician2,
      createdBy: DEMO_USERS.manager,
      createdAt: iso(3600000 * 2), // Created 2 hours ago
      assignedAt: iso(3600000 * 1), // Assigned 1 hour ago
      startedAt: iso(3600000 * 0.9),
      submittedAt: iso(3600000 * 5), // IMPOSSIBLE: Claimed completed 5 hours ago!
      verifiedAt: iso(3600000 * 0.5),
      requiredActions: [
        'Check Co2 cylinder pressure gauge',
        'Verify emergency manual discharge pull pin',
        'Affix quarterly inspection seal tag',
      ],
      requiredEvidenceTypes: ['BEFORE_PHOTO', 'AFTER_PHOTO'],
      evidencePackage: task1089Pkg,
      currentEvidenceHash: task1089CanonicalHash,
      anchoredEvidenceHash: task1089CanonicalHash,
      isTampered: false,
      verificationResult: {
        id: 'VERIF-1089',
        taskId: 'TASK-1089',
        packageId: 'PKG-1089-EVD',
        verdict: 'SUSPICIOUS',
        confidence: 91,
        verifiedAt: iso(3600000 * 0.5),
        integrityScore: {
          completeness: 100,
          uniqueness: 100,
          timeline: 20,
          metadata: 60,
          crossEvidence: 80,
          blockchainIntegrity: 100,
          totalScore: 61,
        },
        reasons: [
          'Timeline anomaly detected: completion submitted before task assignment.',
          'Evidence submission timestamp precedes task creation by over 3 hours.',
          'Chronological causality violation flagged by deterministic verification engine.',
        ],
        anomalies: [
          {
            id: 'ANOM-1089-TIME',
            type: 'TIMELINE_INCONSISTENCY',
            severity: 'CRITICAL',
            title: 'Critical Chronological Sequence Inversion',
            description: `Work order was created at ${iso(3600000 * 2)} and assigned at ${iso(3600000 * 1)}, but submitted evidence package claims completion timestamp at ${iso(3600000 * 5)}. Causality violation indicates retrofitted or pre-recorded evidence.`,
          },
        ],
        checks: [
          { id: 'CHK-1', name: 'Evidence Requirement Completeness', passed: true, score: 100, details: 'Artifacts present.', category: 'COMPLETENESS' },
          { id: 'CHK-2', name: 'Evidence Uniqueness & Replay Detection', passed: true, score: 100, details: 'No external duplicate.', category: 'UNIQUENESS' },
          { id: 'CHK-3', name: 'Chronological Sequence & Window', passed: false, score: 20, details: '🚨 Causality inversion: completion timestamp precedes assignment.', category: 'TIMELINE' },
          { id: 'CHK-4', name: 'Task & Asset Metadata Integrity', passed: false, score: 60, details: 'Timeline conflict degrades metadata reliability.', category: 'METADATA' },
          { id: 'CHK-5', name: 'Visual Evidence Delta Analysis', passed: true, score: 80, details: 'Visual delta exists.', category: 'VISUAL_DELTA' },
          { id: 'CHK-6', name: 'MST Cryptographic Commitment Alignment', passed: true, score: 100, details: 'Anchored on chain.', category: 'BLOCKCHAIN' },
        ],
        recommendation: 'Manual audit recommended. Timeline anomaly detected. Request contractor physical re-inspection.',
        aiExplanation: 'VeriWork verifies submitted evidence and records a tamper-evident commitment to the verification history. Automated timeline analysis identified that the declared completion timestamp occurs hours prior to task assignment. Chronological inconsistency invalidates claim.',
        isAiEnhanced: true,
      },
      blockchainCommitment: {
        txHash: task1089TxHash,
        blockNumber: 140229,
        blockTimestamp: iso(3600000 * 0.5),
        gasUsed: 52100,
        network: 'MST EVM Network (Chain ID: 13371)',
        contractAddress: '0x71C94B2a6136d4A93c04229614f1d43fE67140B8',
        evidenceHash: task1089CanonicalHash,
        verdictRecorded: 'SUSPICIOUS',
        committedBy: DEMO_USERS.technician2.walletAddress,
        state: 'CONFIRMED',
        explorerUrl: `https://explorer.mst-network.io/tx/${task1089TxHash}`,
      },
      auditHistory: [
        {
          id: 'AUD-1089-1',
          taskId: 'TASK-1089',
          timestamp: iso(3600000 * 2),
          action: 'Task Created',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Emergency suppression inspection ticket created.',
          toStatus: 'CREATED',
        },
        {
          id: 'AUD-1089-2',
          taskId: 'TASK-1089',
          timestamp: iso(3600000 * 1),
          action: 'Task Assigned',
          actor: 'Elena Rostova',
          actorRole: 'FACILITY_MANAGER',
          description: 'Assigned to Sarah Chen (TECH-14).',
          toStatus: 'ASSIGNED',
        },
        {
          id: 'AUD-1089-3',
          taskId: 'TASK-1089',
          timestamp: iso(3600000 * 0.5),
          action: 'Timeline Anomaly Detected',
          actor: 'VeriWork Engine',
          actorRole: 'AUDITOR',
          description: 'Chronological causality check failed. Completion predated task.',
          toStatus: 'SUSPICIOUS',
          blockchainTxRef: task1089TxHash,
        },
      ],
    };

    // Store in-memory
    this.tasks.set(task1042.id, task1042);
    this.tasks.set(task1055.id, task1055);
    this.tasks.set(task1071.id, task1071);
    this.tasks.set(task1089.id, task1089);

    // Also register commitments in blockchain service
    blockchainService.setCommitment(task1042.id, task1042.blockchainCommitment!);
    blockchainService.setCommitment(task1055.id, task1055.blockchainCommitment!);
    blockchainService.setCommitment(task1071.id, task1071.blockchainCommitment!);
    blockchainService.setCommitment(task1089.id, task1089.blockchainCommitment!);
  }

  public getAllTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getTaskById(taskId: string): MaintenanceTask | undefined {
    return this.tasks.get(taskId);
  }

  public addTask(task: MaintenanceTask): void {
    this.tasks.set(task.id, task);
  }

  public updateTask(taskId: string, partial: Partial<MaintenanceTask>): MaintenanceTask {
    const existing = this.tasks.get(taskId);
    if (!existing) {
      throw new Error(`Task ${taskId} not found`);
    }
    const updated = { ...existing, ...partial };
    this.tasks.set(taskId, updated);
    return updated;
  }

  public addAuditLog(taskId: string, event: AuditEvent): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.auditHistory.push(event);
    }
  }

  /**
   * Tamper Simulation Demo (Hackathon Key Moment)
   * Modifies an evidence field (e.g. materials or declaration or photo hash)
   * in the off-chain package, causing canonical SHA-256 hash mismatch
   * against the immutable on-chain MST commitment.
   */
  public simulateTamper(taskId: string, fieldToTamper = 'materialsUsed'): {
    task: MaintenanceTask;
    originalHash: string;
    newHash: string;
    tamperedField: string;
  } {
    const task = this.tasks.get(taskId);
    if (!task || !task.evidencePackage) {
      throw new Error(`Cannot tamper task ${taskId}: No evidence package exists.`);
    }

    const originalHash = task.anchoredEvidenceHash || computeCanonicalEvidenceHash(task.evidencePackage);

    // Mutate the target field
    if (fieldToTamper === 'materialsUsed') {
      task.evidencePackage.completionDeclaration.materialsUsed.push('UNAUTHORIZED_SUBSTITUTE_MATERIAL_CHEAP_PVC');
    } else if (fieldToTamper === 'hoursSpent') {
      task.evidencePackage.completionDeclaration.hoursSpent += 15.5; // Inflated billing
    } else if (fieldToTamper === 'statement') {
      task.evidencePackage.completionDeclaration.statement += ' [ALTERED POST-SUBMISSION WITHOUT PERMISSION]';
    } else if (fieldToTamper === 'photoHash') {
      if (task.evidencePackage.evidenceItems[0]) {
        task.evidencePackage.evidenceItems[0].fileHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      }
    }

    // Recompute canonical hash
    const newHash = computeCanonicalEvidenceHash(task.evidencePackage);
    task.currentEvidenceHash = newHash;
    task.isTampered = true;
    task.tamperFieldModified = fieldToTamper;

    // Record audit event
    const auditEvent: AuditEvent = {
      id: `AUD-TAMPER-${Date.now()}`,
      taskId,
      timestamp: new Date().toISOString(),
      action: '🚨 Evidence Mutation Detected (Tampering Simulation)',
      actor: 'Malicious / Unauthorized Actor',
      actorRole: 'TECHNICIAN',
      description: `Off-chain field "${fieldToTamper}" was modified post-anchoring. Canonical hash altered from ${originalHash.slice(0, 16)}... to ${newHash.slice(0, 16)}...`,
      evidenceHashSnapshot: newHash,
    };
    task.auditHistory.push(auditEvent);

    return {
      task,
      originalHash,
      newHash,
      tamperedField: fieldToTamper,
    };
  }

  /**
   * Restores original evidence package to pristine verified state
   */
  public restoreEvidencePackage(taskId: string): MaintenanceTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    if (task.id === 'TASK-1042') {
      // Re-seed original 1042 state
      this.resetToDefault();
      return this.tasks.get('TASK-1042')!;
    }

    task.isTampered = false;
    task.tamperFieldModified = undefined;
    if (task.anchoredEvidenceHash) {
      task.currentEvidenceHash = task.anchoredEvidenceHash;
    }
    return task;
  }

  /**
   * Generates interactive Evidence Relationship Graph for a task:
   * Technician -> submitted -> Evidence -> supports -> Task -> concerns -> Asset
   * Also captures: Timestamp, Blockchain Commitment, and Cross-Task Reuse Edges!
   */
  public generateEvidenceGraph(taskId: string): EvidenceGraphData {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const nodes: EvidenceGraphNode[] = [];
    const edges: EvidenceGraphEdge[] = [];

    // Central Task Node
    nodes.push({
      id: task.id,
      label: task.title,
      type: 'TASK',
      status: task.status,
      subtitle: `Task ID: ${task.id} (${task.priority} Priority)`,
    });

    // Asset Node
    nodes.push({
      id: task.asset.id,
      label: task.asset.name,
      type: 'ASSET',
      subtitle: `${task.asset.type} · ${task.asset.location}`,
    });
    edges.push({
      id: `edge-${task.id}-concerns-${task.asset.id}`,
      source: task.id,
      target: task.asset.id,
      label: 'concerns asset',
    });

    // Technician Node
    if (task.assignedTechnician) {
      nodes.push({
        id: task.assignedTechnician.id,
        label: task.assignedTechnician.name,
        type: 'TECHNICIAN',
        subtitle: `${task.assignedTechnician.organization} · ${task.assignedTechnician.walletAddress.slice(0, 10)}...`,
      });
      edges.push({
        id: `edge-${task.assignedTechnician.id}-assigned-${task.id}`,
        source: task.assignedTechnician.id,
        target: task.id,
        label: 'assigned to',
      });
    }

    // Evidence Package & Items
    if (task.evidencePackage) {
      const pkgNodeId = `pkg-${task.evidencePackage.packageId}`;
      nodes.push({
        id: pkgNodeId,
        label: `Evidence Package ${task.evidencePackage.packageId}`,
        type: 'EVIDENCE',
        subtitle: `Submitted at ${new Date(task.evidencePackage.submissionTimestamp).toLocaleTimeString()}`,
      });

      if (task.assignedTechnician) {
        edges.push({
          id: `edge-${task.assignedTechnician.id}-submitted-${pkgNodeId}`,
          source: task.assignedTechnician.id,
          target: pkgNodeId,
          label: 'submitted manifest',
        });
      }

      edges.push({
        id: `edge-${pkgNodeId}-supports-${task.id}`,
        source: pkgNodeId,
        target: task.id,
        label: 'supports claim',
      });

      // Individual Evidence Items
      task.evidencePackage.evidenceItems.forEach((item, idx) => {
        const itemNodeId = `item-${item.id}`;
        const isReused = task.verificationResult?.anomalies.some(
          (a) => a.type === 'EVIDENCE_REUSE' && (a.flaggedEvidenceIds?.includes(item.id) || a.conflictingTaskId)
        );

        nodes.push({
          id: itemNodeId,
          label: item.label,
          type: 'EVIDENCE',
          subtitle: `Hash: ${item.fileHash.slice(0, 10)}... · ${item.type}`,
          isFlagged: isReused,
        });

        edges.push({
          id: `edge-${pkgNodeId}-contains-${itemNodeId}`,
          source: pkgNodeId,
          target: itemNodeId,
          label: 'contains artifact',
          isWarning: isReused,
        });

        // If this item was reused in another task or from another task, add cross-task edge!
        if (isReused) {
          const conflictingTaskId = task.verificationResult?.anomalies.find(
            (a) => a.type === 'EVIDENCE_REUSE'
          )?.conflictingTaskId;

          if (conflictingTaskId) {
            const conflictTaskNodeId = `conflict-${conflictingTaskId}`;
            nodes.push({
              id: conflictTaskNodeId,
              label: `Conflicting Task: ${conflictingTaskId}`,
              type: 'ALERT',
              subtitle: 'Identical evidence hash detected across tasks',
              isFlagged: true,
            });

            edges.push({
              id: `edge-reused-in-${itemNodeId}-${conflictTaskNodeId}`,
              source: itemNodeId,
              target: conflictTaskNodeId,
              label: '⚠️ REUSED EVIDENCE',
              isWarning: true,
              isDashed: true,
            });
          }
        }
      });
    }

    // Blockchain Commitment Node
    if (task.blockchainCommitment) {
      const commitNodeId = `mst-commit-${task.id}`;
      const isTampered = task.isTampered;
      nodes.push({
        id: commitNodeId,
        label: isTampered ? '🚨 MST Commitment Mismatch' : 'MST Tamper-Evident Commitment',
        type: 'COMMITMENT',
        subtitle: `Block #${task.blockchainCommitment.blockNumber} · Tx: ${task.blockchainCommitment.txHash.slice(0, 10)}...`,
        isFlagged: isTampered,
      });

      edges.push({
        id: `edge-${task.id}-anchored-${commitNodeId}`,
        source: task.id,
        target: commitNodeId,
        label: isTampered ? 'hash invalid' : 'anchored on chain',
        isWarning: isTampered,
      });
    }

    // Verification Verdict Node
    if (task.verificationResult) {
      const verifNodeId = `verif-result-${task.id}`;
      nodes.push({
        id: verifNodeId,
        label: `Verdict: ${task.verificationResult.verdict}`,
        type: 'VERIFICATION',
        subtitle: `Integrity Score: ${task.verificationResult.integrityScore.totalScore}% · Confidence: ${task.verificationResult.confidence}%`,
        status: task.verificationResult.verdict,
        isFlagged: task.verificationResult.verdict === 'SUSPICIOUS',
      });

      edges.push({
        id: `edge-${task.id}-verified-by-${verifNodeId}`,
        source: task.id,
        target: verifNodeId,
        label: 'evaluated by engine',
        isWarning: task.verificationResult.verdict === 'SUSPICIOUS',
      });
    }

    return { nodes, edges };
  }

  public getDashboardMetrics(): DashboardMetrics {
    const tasks = this.getAllTasks();
    let verifiedCount = 0;
    let partialCount = 0;
    let suspiciousCount = 0;
    let evidenceSubmitted = 0;
    let openChallenges = 0;
    let blockchainCommitments = 0;
    let evidenceReuseAlerts = 0;
    let totalIntegrityScore = 0;
    let scoredTasksCount = 0;

    tasks.forEach((t) => {
      if (t.status === 'VERIFIED') verifiedCount++;
      if (t.status === 'PARTIAL') partialCount++;
      if (t.status === 'SUSPICIOUS') suspiciousCount++;
      if (t.evidencePackage) evidenceSubmitted++;
      if (t.challenge && t.challenge.status === 'OPEN') openChallenges++;
      if (t.blockchainCommitment) blockchainCommitments++;

      if (t.verificationResult) {
        totalIntegrityScore += t.verificationResult.integrityScore.totalScore;
        scoredTasksCount++;
        const hasReuse = t.verificationResult.anomalies.some((a) => a.type === 'EVIDENCE_REUSE');
        if (hasReuse) evidenceReuseAlerts++;
      }
    });

    return {
      activeTasks: tasks.filter((t) => t.status !== 'CLOSED').length,
      evidenceSubmitted,
      verifiedCount,
      partialCount,
      suspiciousCount,
      openChallenges,
      blockchainCommitments,
      evidenceReuseAlerts,
      averageIntegrityScore: scoredTasksCount > 0 ? Math.round(totalIntegrityScore / scoredTasksCount) : 0,
    };
  }
}

export const demoStore = new DemoStore();
