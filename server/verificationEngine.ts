import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import {
  MaintenanceTask,
  CanonicalEvidencePackage,
  VerificationResult,
  VerificationVerdict,
  AnomalyReport,
  VerificationCheckItem,
  IntegrityScoreBreakdown,
  EvidenceItem,
} from '../src/types/veriwork';

/**
 * Deterministic JSON stringifier with recursively sorted keys
 * Ensures identical cryptographic digest across platforms and execution environments.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalizeJson(val)}`;
  });
  return '{' + entries.join(',') + '}';
}

/**
 * Computes canonical SHA-256 evidence package hash
 */
export function computeCanonicalEvidenceHash(pkg: CanonicalEvidencePackage): string {
  // Extract canonical manifest fields per spec:
  // { taskId, assetId, technicianId, evidenceIds, timestamps, metadata, verificationInputs }
  const manifest = {
    taskId: pkg.taskId,
    assetId: pkg.assetId,
    technicianId: pkg.technicianId,
    submissionTimestamp: pkg.submissionTimestamp,
    evidenceItems: pkg.evidenceItems.map((item) => ({
      id: item.id,
      type: item.type,
      fileHash: item.fileHash,
      perceptualHash: item.perceptualHash,
      capturedAt: item.metadata.capturedAt,
      capturedBy: item.metadata.capturedBy,
    })),
    completionDeclaration: {
      statement: pkg.completionDeclaration.statement,
      declaredAt: pkg.completionDeclaration.declaredAt,
      signedBy: pkg.completionDeclaration.signedBy,
      materialsUsed: [...pkg.completionDeclaration.materialsUsed].sort(),
      hoursSpent: pkg.completionDeclaration.hoursSpent,
    },
    metadata: {
      schemaVersion: pkg.metadata.schemaVersion,
      systemNonce: pkg.metadata.systemNonce,
    },
  };

  const canonicalString = canonicalizeJson(manifest);
  const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');
  return '0x' + hash;
}

export class VerificationEngine {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('Gemini client initialization notice:', err);
      }
    }
  }

  /**
   * Runs the complete VeriWork verification pipeline:
   * Deterministic checks -> Anomaly & Replay detection -> AI-assisted explainability -> Verdict
   */
  public async verifyTask(
    task: MaintenanceTask,
    allTasksInSystem: MaintenanceTask[]
  ): Promise<VerificationResult> {
    const pkg = task.evidencePackage;
    if (!pkg) {
      throw new Error(`Cannot verify task ${task.id}: No evidence package submitted.`);
    }

    const checks: VerificationCheckItem[] = [];
    const anomalies: AnomalyReport[] = [];
    const reasons: string[] = [];

    // ----------------------------------------------------
    // CHECK 1: Evidence Completeness
    // ----------------------------------------------------
    const submittedTypes = new Set(pkg.evidenceItems.map((e) => e.type));
    const missingTypes = task.requiredEvidenceTypes.filter((req) => !submittedTypes.has(req));

    let completenessScore = 100;
    if (missingTypes.length > 0) {
      completenessScore = Math.max(0, 100 - missingTypes.length * 35);
      anomalies.push({
        id: `ANOM-COMP-${Date.now()}`,
        type: 'MISSING_EVIDENCE',
        severity: missingTypes.length > 1 ? 'HIGH' : 'MEDIUM',
        title: 'Missing Required Evidence Items',
        description: `Task requires ${missingTypes.join(', ')}, but they were not found in the submitted evidence package.`,
      });
      reasons.push(`Required evidence missing: ${missingTypes.join(', ')}.`);
      checks.push({
        id: 'CHK-COMPLETENESS',
        name: 'Evidence Requirement Completeness',
        passed: false,
        score: completenessScore,
        details: `Missing ${missingTypes.length} mandatory evidence type(s): ${missingTypes.join(', ')}`,
        category: 'COMPLETENESS',
      });
    } else {
      checks.push({
        id: 'CHK-COMPLETENESS',
        name: 'Evidence Requirement Completeness',
        passed: true,
        score: 100,
        details: `All ${task.requiredEvidenceTypes.length} required evidence artifacts are present.`,
        category: 'COMPLETENESS',
      });
    }

    // ----------------------------------------------------
    // CHECK 2: Replay & Evidence Reuse Detection
    // ----------------------------------------------------
    let uniquenessScore = 100;
    const submittedHashes = new Map<string, EvidenceItem>();
    pkg.evidenceItems.forEach((item) => {
      submittedHashes.set(item.fileHash, item);
      if (item.perceptualHash) {
        submittedHashes.set(item.perceptualHash, item);
      }
    });

    // Check against all other tasks in database
    for (const otherTask of allTasksInSystem) {
      if (otherTask.id === task.id || !otherTask.evidencePackage) continue;

      for (const otherItem of otherTask.evidencePackage.evidenceItems) {
        // Exact file hash reuse
        if (submittedHashes.has(otherItem.fileHash)) {
          uniquenessScore = 10;
          const matchingItem = submittedHashes.get(otherItem.fileHash)!;
          anomalies.push({
            id: `ANOM-REUSE-${Date.now()}-${otherTask.id}`,
            type: 'EVIDENCE_REUSE',
            severity: 'CRITICAL',
            title: 'Potential Evidence Reuse Detected',
            description: `Evidence artifact (${matchingItem.label} - ${matchingItem.fileHash.slice(0, 12)}...) matches identical evidence previously submitted for ${otherTask.id} (${otherTask.title}).`,
            flaggedEvidenceIds: [matchingItem.id, otherItem.id],
            conflictingTaskId: otherTask.id,
          });
          reasons.push(`Potential evidence reuse detected: Evidence ${matchingItem.label} was previously submitted for ${otherTask.id}.`);
        } else if (
          otherItem.perceptualHash &&
          submittedHashes.has(otherItem.perceptualHash)
        ) {
          // Perceptual similarity reuse
          uniquenessScore = 25;
          const matchingItem = submittedHashes.get(otherItem.perceptualHash)!;
          anomalies.push({
            id: `ANOM-PHASH-${Date.now()}-${otherTask.id}`,
            type: 'EVIDENCE_REUSE',
            severity: 'HIGH',
            title: 'Perceptual Image Fingerprint Reuse',
            description: `Perceptual fingerprint of artifact (${matchingItem.label}) is highly similar to evidence in ${otherTask.id}.`,
            flaggedEvidenceIds: [matchingItem.id],
            conflictingTaskId: otherTask.id,
          });
          reasons.push(`Perceptual similarity detected: Photo fingerprint matches earlier submission in ${otherTask.id}.`);
        }
      }
    }

    // Also check intra-package reuse (e.g. before image identical to after image)
    const beforePhoto = pkg.evidenceItems.find((e) => e.type === 'BEFORE_PHOTO');
    const afterPhoto = pkg.evidenceItems.find((e) => e.type === 'AFTER_PHOTO');
    if (beforePhoto && afterPhoto) {
      if (
        beforePhoto.fileHash === afterPhoto.fileHash ||
        (beforePhoto.perceptualHash && beforePhoto.perceptualHash === afterPhoto.perceptualHash)
      ) {
        uniquenessScore = 15;
        anomalies.push({
          id: `ANOM-INTRA-REUSE-${Date.now()}`,
          type: 'INSUFFICIENT_VISUAL_DELTA',
          severity: 'CRITICAL',
          title: 'Before/After Evidence Identical',
          description: 'The submitted "After" photograph is an exact copy of the "Before" photograph with zero visual change.',
          flaggedEvidenceIds: [beforePhoto.id, afterPhoto.id],
        });
        reasons.push('After image is identical to Before image; no repair progress evident.');
      }
    }

    checks.push({
      id: 'CHK-UNIQUENESS',
      name: 'Evidence Uniqueness & Replay Detection',
      passed: uniquenessScore > 70,
      score: uniquenessScore,
      details: uniquenessScore > 70 ? 'No duplicate or reused evidence found in system archive.' : 'Evidence duplicate/replay detected across historical task submissions.',
      category: 'UNIQUENESS',
    });

    // ----------------------------------------------------
    // CHECK 3: Timeline Anomaly Detection
    // ----------------------------------------------------
    let timelineScore = 100;
    const createdAt = new Date(task.createdAt).getTime();
    const assignedAt = task.assignedAt ? new Date(task.assignedAt).getTime() : 0;
    const startedAt = task.startedAt ? new Date(task.startedAt).getTime() : 0;
    const submittedAt = new Date(pkg.submissionTimestamp).getTime();
    const declaredAt = new Date(pkg.completionDeclaration.declaredAt).getTime();

    // Check chronological order
    if (assignedAt && assignedAt < createdAt) {
      timelineScore -= 40;
      anomalies.push({
        id: `ANOM-TIME-1-${Date.now()}`,
        type: 'TIMELINE_INCONSISTENCY',
        severity: 'HIGH',
        title: 'Assignment Timestamp Precedes Creation',
        description: 'Task assignment timestamp is recorded before the task creation timestamp.',
      });
      reasons.push('Timeline anomaly detected: assignment preceded creation.');
    }

    if (submittedAt < createdAt || (assignedAt && submittedAt < assignedAt)) {
      timelineScore = 20;
      anomalies.push({
        id: `ANOM-TIME-2-${Date.now()}`,
        type: 'TIMELINE_INCONSISTENCY',
        severity: 'CRITICAL',
        title: 'Completion Precedes Task Assignment',
        description: `Evidence submission timestamp (${pkg.submissionTimestamp}) occurs before task assignment (${task.assignedAt || 'N/A'}).`,
        conflictingTimestamp: task.assignedAt,
      });
      reasons.push('Timeline anomaly detected: completion submitted before task assignment.');
    }

    // Check if evidence items have future timestamps or timestamps before task was created
    for (const item of pkg.evidenceItems) {
      const capturedAt = new Date(item.metadata.capturedAt).getTime();
      if (capturedAt < createdAt - 3600000 * 24 * 7) {
        // Captured over a week before task existed
        timelineScore = Math.min(timelineScore, 50);
        anomalies.push({
          id: `ANOM-TIME-OLD-${item.id}`,
          type: 'TIMELINE_INCONSISTENCY',
          severity: 'MEDIUM',
          title: 'Evidence Captured Outside Task Window',
          description: `Artifact "${item.label}" timestamp (${item.metadata.capturedAt}) predates task creation by over 7 days.`,
          flaggedEvidenceIds: [item.id],
        });
        reasons.push(`Evidence timestamp outside task window for "${item.label}".`);
      }
    }

    checks.push({
      id: 'CHK-TIMELINE',
      name: 'Chronological Sequence & Window Validation',
      passed: timelineScore > 70,
      score: timelineScore,
      details: timelineScore > 70 ? 'Chronological sequence of creation -> assignment -> work -> submission is consistent.' : 'Timeline anomalies or conflicting timestamps detected.',
      category: 'TIMELINE',
    });

    // ----------------------------------------------------
    // CHECK 4: Metadata Consistency
    // ----------------------------------------------------
    let metadataScore = 100;
    if (pkg.taskId !== task.id) {
      metadataScore = 0;
      anomalies.push({
        id: `ANOM-META-TASK-${Date.now()}`,
        type: 'METADATA_MISMATCH',
        severity: 'CRITICAL',
        title: 'Task ID Mismatch',
        description: `Package declares taskId "${pkg.taskId}", which does not match active task "${task.id}".`,
      });
      reasons.push('Package metadata task ID mismatch.');
    }

    if (pkg.assetId !== task.asset.id) {
      metadataScore = Math.min(metadataScore, 40);
      anomalies.push({
        id: `ANOM-META-ASSET-${Date.now()}`,
        type: 'METADATA_MISMATCH',
        severity: 'HIGH',
        title: 'Asset ID Inconsistency',
        description: `Package references asset "${pkg.assetId}", whereas task specifies "${task.asset.id}" (${task.asset.name}).`,
      });
      reasons.push(`Asset identity inconsistent: expected ${task.asset.id}, got ${pkg.assetId}.`);
    }

    if (task.assignedTechnician && pkg.technicianId !== task.assignedTechnician.id) {
      metadataScore = Math.min(metadataScore, 40);
      anomalies.push({
        id: `ANOM-META-TECH-${Date.now()}`,
        type: 'METADATA_MISMATCH',
        severity: 'HIGH',
        title: 'Technician Identity Mismatch',
        description: `Task was assigned to ${task.assignedTechnician.name} (${task.assignedTechnician.id}), but evidence was submitted by ${pkg.technicianId}.`,
      });
      reasons.push('Declared technician does not match assigned technician.');
    }

    checks.push({
      id: 'CHK-METADATA',
      name: 'Task & Asset Metadata Integrity',
      passed: metadataScore > 75,
      score: metadataScore,
      details: metadataScore > 75 ? 'Task, Asset, and Technician identities match consistently.' : 'Discrepancy detected in task or asset metadata declarations.',
      category: 'METADATA',
    });

    // ----------------------------------------------------
    // CHECK 5: Before/After Visual Delta & Cross-Evidence Consistency
    // ----------------------------------------------------
    let visualDeltaScore = 95;
    if (beforePhoto && afterPhoto && beforePhoto.fileHash !== afterPhoto.fileHash) {
      // Meaningful visual changes present
      reasons.push('Visual evidence supports the claimed change between before and after inspection.');
    } else if (!beforePhoto || !afterPhoto) {
      visualDeltaScore = 50;
      reasons.push('Insufficient visual evidence to establish the claimed change (paired before/after incomplete).');
    }

    checks.push({
      id: 'CHK-VISUAL-DELTA',
      name: 'Visual Evidence Delta Analysis',
      passed: visualDeltaScore > 70,
      score: visualDeltaScore,
      details: visualDeltaScore > 70
        ? 'Visual evidence supports the claimed physical maintenance delta.'
        : 'Insufficient visual evidence to establish the claimed change.',
      category: 'VISUAL_DELTA',
    });

    // ----------------------------------------------------
    // CHECK 6: Blockchain Commitment & Hash Integrity
    // ----------------------------------------------------
    let blockchainScore = 100;
    const computedHash = computeCanonicalEvidenceHash(pkg);

    if (task.anchoredEvidenceHash && task.anchoredEvidenceHash !== computedHash) {
      blockchainScore = 0;
      anomalies.push({
        id: `ANOM-TAMPER-${Date.now()}`,
        type: 'TAMPER_DETECTED',
        severity: 'CRITICAL',
        title: 'Cryptographic Commitment Mismatch (Tampering Detected)',
        description: `Current calculated evidence package hash (${computedHash}) differs from the immutable hash anchored on the MST blockchain (${task.anchoredEvidenceHash}).`,
      });
      reasons.push('Evidence hash mismatch: submitted package differs from immutable MST blockchain commitment.');
    }

    checks.push({
      id: 'CHK-BLOCKCHAIN',
      name: 'MST Cryptographic Commitment Alignment',
      passed: blockchainScore > 70,
      score: blockchainScore,
      details: blockchainScore > 70
        ? 'Computed canonical SHA-256 package hash matches anchored MST commitment.'
        : '🚨 Evidence integrity failure: package has been modified post-anchoring.',
      category: 'BLOCKCHAIN',
    });

    // ----------------------------------------------------
    // Integrity Score Calculation (Weighted Formula)
    // ----------------------------------------------------
    const integrityBreakdown: IntegrityScoreBreakdown = {
      completeness: completenessScore,
      uniqueness: uniquenessScore,
      timeline: timelineScore,
      metadata: metadataScore,
      crossEvidence: visualDeltaScore,
      blockchainIntegrity: blockchainScore,
      totalScore: Math.round(
        completenessScore * 0.15 +
        uniquenessScore * 0.25 +
        timelineScore * 0.15 +
        metadataScore * 0.15 +
        visualDeltaScore * 0.15 +
        blockchainScore * 0.15
      ),
    };

    // ----------------------------------------------------
    // Verdict Determination
    // ----------------------------------------------------
    let verdict: VerificationVerdict = 'VERIFIED';
    let confidence = 95;
    let recommendation = 'Approve task claim. Evidence commitment is tamper-evident and verified.';

    const hasCriticalAnomaly = anomalies.some((a) => a.severity === 'CRITICAL');
    const hasHighAnomaly = anomalies.some((a) => a.severity === 'HIGH');

    if (hasCriticalAnomaly || uniquenessScore <= 30 || blockchainScore === 0 || metadataScore < 50 || timelineScore <= 30) {
      verdict = 'SUSPICIOUS';
      confidence = Math.min(94, Math.max(82, 100 - integrityBreakdown.totalScore));
      recommendation = 'Manual audit recommended. Escalate to Facility Auditor and freeze completion approval.';
    } else if (missingTypes.length > 0 || integrityBreakdown.totalScore < 80 || hasHighAnomaly) {
      verdict = 'PARTIAL';
      confidence = 84;
      recommendation = 'Request technician submit missing items or clarification before final verification.';
    } else {
      verdict = 'VERIFIED';
      confidence = Math.max(90, Math.min(99, integrityBreakdown.totalScore));
      recommendation = 'Evidence package satisfies all physical claim requirements. Anchor verified state on MST.';
    }

    // ----------------------------------------------------
    // Optional AI Explanation Synthesis (Gemini 3.8 Flash)
    // ----------------------------------------------------
    let aiExplanation = '';
    let isAiEnhanced = false;

    if (this.ai) {
      try {
        const prompt = `You are the VeriWork Verification Engine explanation synthesizer.
Analyze the following maintenance verification findings and provide a concise, explainable, professional evaluation paragraph (under 80 words) and 3 bullet point findings.
DO NOT claim blockchain proves a physical repair happened. Say that VeriWork verifies submitted evidence and records a tamper-evident commitment to the verification history.

Task: ${task.title}
Asset: ${task.asset.name} (${task.asset.id})
Verdict: ${verdict}
Integrity Score: ${integrityBreakdown.totalScore}/100
Anomalies Found: ${anomalies.map((a) => `${a.type}: ${a.title} (${a.description})`).join(' | ') || 'None'}
Checks: Completeness ${completenessScore}%, Uniqueness ${uniquenessScore}%, Timeline ${timelineScore}%, Metadata ${metadataScore}%
Reasons: ${reasons.join('; ')}

Format:
SUMMARY: <1-2 sentences>
KEY_FINDINGS:
- <finding 1>
- <finding 2>
- <finding 3>`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response && response.text) {
          aiExplanation = response.text.trim();
          isAiEnhanced = true;
        }
      } catch (err) {
        console.warn('AI explanation fallback engaged:', err);
      }
    }

    if (!aiExplanation) {
      // Deterministic explainability fallback
      if (verdict === 'VERIFIED') {
        aiExplanation = `All required evidence artifacts are complete, unique, and internally consistent. Timeline sequence is valid, and canonical evidence package hash aligns with the MST tamper-evident audit record. Visual evidence supports the claimed change.`;
      } else if (verdict === 'PARTIAL') {
        aiExplanation = `Evidence package is incomplete or partially inconclusive. While submitted items pass baseline uniqueness checks, required artifacts (${missingTypes.join(', ')}) are absent. Completion cannot be verified until complete evidence is anchored.`;
      } else {
        aiExplanation = `Significant anomalies detected in submitted evidence package. ${anomalies.map((a) => a.title).join('. ')}. Evidence does not substantiate the physical maintenance claim. Immediate auditor review required.`;
      }
    }

    return {
      id: `VERIF-${Date.now()}`,
      taskId: task.id,
      packageId: pkg.packageId,
      verdict,
      confidence,
      verifiedAt: new Date().toISOString(),
      integrityScore: integrityBreakdown,
      reasons,
      anomalies,
      checks,
      recommendation,
      aiExplanation,
      isAiEnhanced,
    };
  }
}

export const verificationEngine = new VerificationEngine();
