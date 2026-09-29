import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { demoStore, DEMO_USERS, DEMO_ASSETS } from './server/demoStore';
import { blockchainService } from './server/blockchainService';
import { computeCanonicalEvidenceHash, verificationEngine } from './server/verificationEngine';
import {
  MaintenanceTask,
  CanonicalEvidencePackage,
  TaskStatus,
  AuditEvent,
  RequiredEvidenceType,
  PriorityLevel,
} from './src/types/veriwork';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// REST API ROUTES
// ==========================================

// Dashboard stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const metrics = demoStore.getDashboardMetrics();
    const network = blockchainService.getNetworkInfo();
    res.json({ success: true, metrics, network });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get all tasks
app.get('/api/tasks', (_req: Request, res: Response) => {
  try {
    const tasks = demoStore.getAllTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get single task by ID
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new maintenance task
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, assetId, priority, requiredActions, requiredEvidenceTypes, createdBy } = req.body;

    if (!title || !assetId) {
      return res.status(400).json({ success: false, error: 'Title and Asset ID are required' });
    }

    const asset = Object.values(DEMO_ASSETS).find((a) => a.id === assetId) || {
      id: assetId,
      name: `Asset ${assetId}`,
      type: 'Industrial Asset',
      location: 'Main Facility',
      building: 'Block A',
      facility: 'Central Campus',
    };

    const taskId = `TASK-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const creator = createdBy || DEMO_USERS.manager;

    // Anchor creation on MST blockchain
    const tx = await blockchainService.createTaskOnChain(taskId, asset.id, creator.walletAddress);

    const newTask: MaintenanceTask = {
      id: taskId,
      title,
      description: description || '',
      asset,
      priority: (priority as PriorityLevel) || 'MEDIUM',
      status: 'CREATED',
      createdBy: creator,
      createdAt: nowIso,
      requiredActions: requiredActions && requiredActions.length > 0
        ? requiredActions
        : ['Inspect equipment', 'Perform physical maintenance', 'Submit before and after evidence'],
      requiredEvidenceTypes: (requiredEvidenceTypes as RequiredEvidenceType[]) || ['BEFORE_PHOTO', 'AFTER_PHOTO'],
      auditHistory: [
        {
          id: `AUD-${Date.now()}`,
          taskId,
          timestamp: nowIso,
          action: 'Task Created',
          actor: creator.name,
          actorRole: creator.role,
          description: `Physical maintenance task registered for asset ${asset.name}.`,
          toStatus: 'CREATED',
          blockchainTxRef: tx.txHash,
        },
      ],
    };

    demoStore.addTask(newTask);

    res.status(201).json({ success: true, task: newTask, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Assign task to technician (State: CREATED -> ASSIGNED)
app.post('/api/tasks/:id/assign', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (task.status !== 'CREATED') {
      return res.status(400).json({
        success: false,
        error: `Invalid state transition: Cannot assign task in state "${task.status}". Expected "CREATED".`,
      });
    }

    const { technicianId } = req.body;
    const technician = Object.values(DEMO_USERS).find((u) => u.id === technicianId) || DEMO_USERS.technician1;
    const nowIso = new Date().toISOString();

    const tx = await blockchainService.assignTaskOnChain(task.id, technician.id);

    const updated = demoStore.updateTask(task.id, {
      status: 'ASSIGNED',
      assignedTechnician: technician,
      assignedAt: nowIso,
    });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Task Assigned',
      actor: DEMO_USERS.manager.name,
      actorRole: 'FACILITY_MANAGER',
      description: `Task assigned to certified technician ${technician.name} (${technician.id}).`,
      fromStatus: 'CREATED',
      toStatus: 'ASSIGNED',
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Start task (State: ASSIGNED -> IN_PROGRESS)
app.post('/api/tasks/:id/start', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (task.status !== 'ASSIGNED') {
      return res.status(400).json({
        success: false,
        error: `Invalid state transition: Cannot start work in state "${task.status}". Expected "ASSIGNED".`,
      });
    }

    const nowIso = new Date().toISOString();
    const tx = await blockchainService.startTaskOnChain(task.id);

    const updated = demoStore.updateTask(task.id, {
      status: 'IN_PROGRESS',
      startedAt: nowIso,
    });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Work Started On-Site',
      actor: task.assignedTechnician?.name || 'Technician',
      actorRole: 'TECHNICIAN',
      description: `Technician arrived on-site at ${task.asset.location} and commenced work.`,
      fromStatus: 'ASSIGNED',
      toStatus: 'IN_PROGRESS',
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Submit evidence package (State: IN_PROGRESS -> EVIDENCE_SUBMITTED)
app.post('/api/tasks/:id/evidence', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: `Invalid state transition: Cannot submit evidence in state "${task.status}". Expected "IN_PROGRESS".`,
      });
    }

    const evidencePackage: CanonicalEvidencePackage = req.body.evidencePackage;
    if (!evidencePackage || !evidencePackage.evidenceItems || evidencePackage.evidenceItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Valid canonical evidence package required.' });
    }

    const nowIso = new Date().toISOString();
    evidencePackage.submissionTimestamp = evidencePackage.submissionTimestamp || nowIso;

    // Calculate canonical SHA-256 hash of the evidence manifest
    const canonicalHash = computeCanonicalEvidenceHash(evidencePackage);

    // Anchor cryptographic commitment on MST blockchain
    const commitment = await blockchainService.commitEvidenceOnChain(
      task.id,
      evidencePackage.packageId,
      canonicalHash,
      task.assignedTechnician?.walletAddress
    );

    const updated = demoStore.updateTask(task.id, {
      status: 'EVIDENCE_SUBMITTED',
      submittedAt: nowIso,
      evidencePackage,
      currentEvidenceHash: canonicalHash,
      anchoredEvidenceHash: canonicalHash,
      blockchainCommitment: commitment,
      isTampered: false,
    });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Evidence Package Submitted & Anchored',
      actor: task.assignedTechnician?.name || 'Technician',
      actorRole: 'TECHNICIAN',
      description: `Off-chain evidence bundle anchored on MST. Canonical Hash: ${canonicalHash.slice(0, 16)}...`,
      fromStatus: 'IN_PROGRESS',
      toStatus: 'EVIDENCE_SUBMITTED',
      blockchainTxRef: commitment.txHash,
      evidenceHashSnapshot: canonicalHash,
    });

    res.json({ success: true, task: updated, commitment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Run Verification Engine (State: EVIDENCE_SUBMITTED -> UNDER_VERIFICATION -> VERIFIED/PARTIAL/SUSPICIOUS)
app.post('/api/tasks/:id/verify', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (
      task.status !== 'EVIDENCE_SUBMITTED' &&
      task.status !== 'UNDER_VERIFICATION' &&
      task.status !== 'VERIFIED' &&
      task.status !== 'PARTIAL' &&
      task.status !== 'SUSPICIOUS'
    ) {
      return res.status(400).json({
        success: false,
        error: `Cannot verify task in state "${task.status}". Evidence package must be submitted first.`,
      });
    }

    const allTasks = demoStore.getAllTasks();

    // Mark UNDER_VERIFICATION
    demoStore.updateTask(task.id, { status: 'UNDER_VERIFICATION' });

    // Execute VeriWork Verification Engine
    const verificationResult = await verificationEngine.verifyTask(task, allTasks);

    const finalStatus: TaskStatus = verificationResult.verdict; // 'VERIFIED' | 'PARTIAL' | 'SUSPICIOUS'

    // Anchor verification verdict on MST blockchain
    const tx = await blockchainService.recordVerificationOnChain(
      task.id,
      task.currentEvidenceHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      verificationResult.verdict,
      verificationResult.integrityScore.totalScore
    );

    const nowIso = new Date().toISOString();
    const updated = demoStore.updateTask(task.id, {
      status: finalStatus,
      verificationVerdict: verificationResult.verdict,
      verifiedAt: nowIso,
      verificationResult,
      blockchainCommitment: blockchainService.getCommitment(task.id) || task.blockchainCommitment,
    });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: `Verification Completed: ${verificationResult.verdict}`,
      actor: 'VeriWork Engine',
      actorRole: 'AUDITOR',
      description: `Evaluation finished with integrity score ${verificationResult.integrityScore.totalScore}/100 and confidence ${verificationResult.confidence}%. Verdict committed to MST.`,
      fromStatus: 'UNDER_VERIFICATION',
      toStatus: finalStatus,
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, verificationResult, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Challenge verification (Facility Manager or Auditor)
app.post('/api/tasks/:id/challenge', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const { reason, challengerName, challengerRole } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Challenge reason is required.' });
    }

    const challenger = challengerName || DEMO_USERS.manager.name;
    const role = challengerRole || 'FACILITY_MANAGER';
    const nowIso = new Date().toISOString();

    const tx = await blockchainService.challengeTaskOnChain(task.id, reason);

    const challenge = {
      id: `CHAL-${Date.now()}`,
      taskId: task.id,
      challenger,
      challengerRole: role,
      challengedAt: nowIso,
      reason,
      status: 'OPEN' as const,
      blockchainTxRef: tx.txHash,
    };

    const updated = demoStore.updateTask(task.id, { challenge });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Verification Claim Challenged',
      actor: challenger,
      actorRole: role,
      description: `Dispute opened. Reason: "${reason}". State anchored on MST.`,
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, challenge, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Resolve challenge
app.post('/api/tasks/:id/resolve-challenge', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task || !task.challenge) {
      return res.status(404).json({ success: false, error: 'No active challenge found for task.' });
    }

    const { resolutionNotes } = req.body;
    const nowIso = new Date().toISOString();

    const tx = await blockchainService.resolveChallengeOnChain(task.id, resolutionNotes || 'Challenge resolved after audit review.');

    const resolvedChallenge = {
      ...task.challenge,
      status: 'RESOLVED' as const,
      resolvedAt: nowIso,
      resolvedBy: DEMO_USERS.auditor.name,
      resolutionNotes: resolutionNotes || 'Challenge audited and resolved.',
    };

    const updated = demoStore.updateTask(task.id, { challenge: resolvedChallenge });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Dispute Challenge Resolved',
      actor: DEMO_USERS.auditor.name,
      actorRole: 'AUDITOR',
      description: `Dispute resolved on MST. Notes: "${resolutionNotes || 'Approved'}".`,
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, challenge: resolvedChallenge, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Close task (State: VERIFIED/PARTIAL -> CLOSED)
app.post('/api/tasks/:id/close', async (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (task.status !== 'VERIFIED' && task.status !== 'PARTIAL') {
      return res.status(400).json({
        success: false,
        error: `Cannot close task in status "${task.status}". Task must be verified or accepted.`,
      });
    }

    if (task.challenge && task.challenge.status === 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Cannot close task while a dispute challenge remains OPEN.',
      });
    }

    const nowIso = new Date().toISOString();
    const tx = await blockchainService.closeTaskOnChain(task.id);

    const updated = demoStore.updateTask(task.id, {
      status: 'CLOSED',
      closedAt: nowIso,
    });

    demoStore.addAuditLog(task.id, {
      id: `AUD-${Date.now()}`,
      taskId: task.id,
      timestamp: nowIso,
      action: 'Task Closed & Archived',
      actor: DEMO_USERS.manager.name,
      actorRole: 'FACILITY_MANAGER',
      description: 'Physical maintenance order completed and closed. Final state recorded on MST.',
      fromStatus: task.status,
      toStatus: 'CLOSED',
      blockchainTxRef: tx.txHash,
    });

    res.json({ success: true, task: updated, txHash: tx.txHash });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Live Tamper Simulation (Core Hackathon Moment)
app.post('/api/tasks/:id/tamper', (req: Request, res: Response) => {
  try {
    const { fieldToTamper } = req.body;
    const result = demoStore.simulateTamper(req.params.id, fieldToTamper || 'materialsUsed');
    res.json({
      success: true,
      task: result.task,
      originalHash: result.originalHash,
      newHash: result.newHash,
      tamperedField: result.tamperedField,
      alert: '🚨 EVIDENCE INTEGRITY FAILURE: This evidence no longer matches the commitment recorded on MST.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Restore tampered evidence
app.post('/api/tasks/:id/restore', (req: Request, res: Response) => {
  try {
    const task = demoStore.restoreEvidencePackage(req.params.id);
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Evidence Relationship Graph
app.get('/api/tasks/:id/graph', (req: Request, res: Response) => {
  try {
    const graphData = demoStore.generateEvidenceGraph(req.params.id);
    res.json({ success: true, graph: graphData });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Audit Trail
app.get('/api/tasks/:id/audit', (req: Request, res: Response) => {
  try {
    const task = demoStore.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, auditHistory: task.auditHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Blockchain Status Endpoint
app.get('/api/blockchain/status', async (_req: Request, res: Response) => {
  try {
    const status = await blockchainService.getBlockchainStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, connected: false, error: (error as Error).message });
  }
});

// Blockchain Stats & Recent Ledger Activity
app.get('/api/blockchain/stats', async (_req: Request, res: Response) => {
  try {
    const network = await blockchainService.getNetworkInfo();
    const recentTx = blockchainService.getRecentTransactions(8);
    const recentBlocks = await blockchainService.getRecentBlocks(5);
    res.json({ success: true, network, recentTransactions: recentTx, recentBlocks });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Inspect on-chain transaction
app.get('/api/blockchain/tx/:txHash', (req: Request, res: Response) => {
  try {
    const tx = blockchainService.getTransaction(req.params.txHash);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found on MST ledger' });
    }
    res.json({ success: true, transaction: tx });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Reset demo store
app.post('/api/demo/reset', (_req: Request, res: Response) => {
  try {
    demoStore.resetToDefault();
    res.json({ success: true, message: 'Demo scenarios reset to initial state' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Activate specific guided demo scenario
app.post('/api/demo/scenario', async (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.body;
    let targetTaskId = 'TASK-1042';

    if (scenarioId === '1' || scenarioId === 'GENUINE_REPAIR') {
      targetTaskId = 'TASK-1042';
      demoStore.restoreEvidencePackage('TASK-1042');
    } else if (scenarioId === '2' || scenarioId === 'MISSING_EVIDENCE') {
      targetTaskId = 'TASK-1055';
    } else if (scenarioId === '3' || scenarioId === 'EVIDENCE_REUSE') {
      targetTaskId = 'TASK-1071';
    } else if (scenarioId === '4' || scenarioId === 'TIMELINE_ANOMALY') {
      targetTaskId = 'TASK-1089';
    } else if (scenarioId === '5' || scenarioId === 'TAMPER_ATTACK') {
      targetTaskId = 'TASK-1042';
      demoStore.simulateTamper('TASK-1042', 'materialsUsed');
    } else if (scenarioId === '6' || scenarioId === 'CHALLENGE_VERIFICATION') {
      targetTaskId = 'TASK-1042';
      const task = demoStore.getTaskById('TASK-1042');
      if (task && (!task.challenge || task.challenge.status !== 'OPEN')) {
        const tx = await blockchainService.challengeTaskOnChain(
          'TASK-1042',
          'Facility Manager noticed moisture discoloration on secondary concrete footing. Requesting re-inspection.',
          DEMO_USERS.manager.walletAddress
        );
        demoStore.updateTask('TASK-1042', {
          challenge: {
            id: `CHAL-${Date.now()}`,
            taskId: 'TASK-1042',
            challenger: DEMO_USERS.manager.name,
            challengerRole: 'FACILITY_MANAGER',
            challengedAt: new Date().toISOString(),
            reason: 'Facility Manager noticed moisture discoloration on secondary concrete footing. Requesting re-inspection.',
            status: 'OPEN',
            blockchainTxRef: tx.txHash,
          },
        });
      }
    }

    const task = demoStore.getTaskById(targetTaskId);
    res.json({ success: true, targetTaskId, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================

async function startServer() {
  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VERIWORK] Server running on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[VERIWORK] Failed to start server:', err);
  process.exit(1);
});
