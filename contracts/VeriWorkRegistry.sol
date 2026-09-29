// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VeriWorkRegistry
 * @dev Evidence-Based Verification of Physical Maintenance Claims Registry
 * Anchors canonical evidence commitments, workflow state transitions,
 * verification verdicts, and dispute challenges on the MST EVM Blockchain.
 *
 * NOTE: Large physical artifacts, high-res photos, and raw telemetry remain OFF-CHAIN.
 * Only the cryptographic commitments (SHA-256 / keccak256 digests) and state transitions
 * are permanently recorded on-chain for tamper-evident independent auditability.
 */
contract VeriWorkRegistry {

    enum TaskWorkflowState {
        CREATED,
        ASSIGNED,
        IN_PROGRESS,
        EVIDENCE_SUBMITTED,
        UNDER_VERIFICATION,
        VERIFIED,
        PARTIAL,
        SUSPICIOUS,
        CLOSED
    }

    enum VerificationVerdict {
        NONE,
        VERIFIED,
        PARTIAL,
        SUSPICIOUS
    }

    enum ChallengeStatus {
        NO_CHALLENGE,
        OPEN,
        RESOLVED
    }

    struct MaintenanceTask {
        string taskId;
        string assetId;
        string technicianId;
        TaskWorkflowState state;
        bytes32 evidenceHash;
        VerificationVerdict verdict;
        uint256 createdAt;
        uint256 committedAt;
        uint256 verifiedAt;
        uint256 closedAt;
        bool exists;
    }

    struct EvidenceCommitment {
        string taskId;
        string packageId;
        bytes32 evidenceHash;
        uint256 timestamp;
        address committedBy;
        string technicianId;
    }

    struct VerificationRecord {
        string taskId;
        bytes32 evidenceHash;
        VerificationVerdict verdict;
        uint8 integrityScore; // 0 - 100
        uint256 timestamp;
        address verifiedBy;
        string verificationEngineVersion;
    }

    struct Challenge {
        string taskId;
        address challenger;
        string reason;
        ChallengeStatus status;
        uint256 raisedAt;
        uint256 resolvedAt;
        string resolutionNotes;
    }

    // Task ID => MaintenanceTask
    mapping(string => MaintenanceTask) private tasks;
    
    // Task ID => EvidenceCommitment
    mapping(string => EvidenceCommitment) private commitments;

    // Task ID => VerificationRecord
    mapping(string => VerificationRecord) private verificationRecords;

    // Task ID => Challenge
    mapping(string => Challenge) private challenges;

    // Ordered list of all task IDs
    string[] private taskIds;

    // Total anchored commitments counter
    uint256 public totalCommitments;
    uint256 public totalVerifications;
    uint256 public totalChallenges;

    address public owner;

    // Events as per specification
    event TaskCreated(string indexed taskId, string assetId, uint256 timestamp, address indexed creator);
    event TaskAssigned(string indexed taskId, string technicianId, uint256 timestamp, address indexed assigner);
    event TaskStarted(string indexed taskId, uint256 timestamp, address indexed technician);
    event EvidenceCommitted(string indexed taskId, string packageId, bytes32 indexed evidenceHash, uint256 timestamp, address indexed submitter);
    event VerificationRecorded(string indexed taskId, bytes32 indexed evidenceHash, VerificationVerdict verdict, uint8 integrityScore, uint256 timestamp);
    event TaskClosed(string indexed taskId, uint256 timestamp, address indexed closer);
    event ChallengeRaised(string indexed taskId, address indexed challenger, string reason, uint256 timestamp);
    event ChallengeResolved(string indexed taskId, address indexed resolver, string resolutionNotes, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "VeriWork: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Creates a new physical maintenance task with assigned asset
     */
    function createTask(string memory _taskId, string memory _assetId) external {
        require(!tasks[_taskId].exists, "VeriWork: task already exists");
        require(bytes(_taskId).length > 0, "VeriWork: empty task id");
        require(bytes(_assetId).length > 0, "VeriWork: empty asset id");

        tasks[_taskId] = MaintenanceTask({
            taskId: _taskId,
            assetId: _assetId,
            technicianId: "",
            state: TaskWorkflowState.CREATED,
            evidenceHash: bytes32(0),
            verdict: VerificationVerdict.NONE,
            createdAt: block.timestamp,
            committedAt: 0,
            verifiedAt: 0,
            closedAt: 0,
            exists: true
        });

        taskIds.push(_taskId);

        emit TaskCreated(_taskId, _assetId, block.timestamp, msg.sender);
    }

    /**
     * @dev Assigns a task to a technician (valid transition: CREATED -> ASSIGNED)
     */
    function assignTask(string memory _taskId, string memory _technicianId) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(task.state == TaskWorkflowState.CREATED, "VeriWork: invalid state for assignment");
        require(bytes(_technicianId).length > 0, "VeriWork: invalid technician id");

        task.technicianId = _technicianId;
        task.state = TaskWorkflowState.ASSIGNED;

        emit TaskAssigned(_taskId, _technicianId, block.timestamp, msg.sender);
    }

    /**
     * @dev Technician starts work on site (valid transition: ASSIGNED -> IN_PROGRESS)
     */
    function startTask(string memory _taskId) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(task.state == TaskWorkflowState.ASSIGNED, "VeriWork: task must be assigned before start");

        task.state = TaskWorkflowState.IN_PROGRESS;

        emit TaskStarted(_taskId, block.timestamp, msg.sender);
    }

    /**
     * @dev Submits canonical evidence package hash commitment (valid transition: IN_PROGRESS -> EVIDENCE_SUBMITTED)
     */
    function submitEvidenceCommitment(
        string memory _taskId,
        string memory _packageId,
        bytes32 _evidenceHash
    ) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(task.state == TaskWorkflowState.IN_PROGRESS, "VeriWork: invalid state for evidence submission");
        require(_evidenceHash != bytes32(0), "VeriWork: empty evidence hash");

        commitments[_taskId] = EvidenceCommitment({
            taskId: _taskId,
            packageId: _packageId,
            evidenceHash: _evidenceHash,
            timestamp: block.timestamp,
            committedBy: msg.sender,
            technicianId: task.technicianId
        });

        task.evidenceHash = _evidenceHash;
        task.committedAt = block.timestamp;
        task.state = TaskWorkflowState.EVIDENCE_SUBMITTED;
        totalCommitments++;

        emit EvidenceCommitted(_taskId, _packageId, _evidenceHash, block.timestamp, msg.sender);
    }

    /**
     * @dev Records verified explainable verdict produced by the VeriWork Verification Engine
     */
    function recordVerification(
        string memory _taskId,
        bytes32 _evidenceHash,
        VerificationVerdict _verdict,
        uint8 _integrityScore,
        string memory _engineVersion
    ) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(
            task.state == TaskWorkflowState.EVIDENCE_SUBMITTED || 
            task.state == TaskWorkflowState.UNDER_VERIFICATION ||
            task.state == TaskWorkflowState.VERIFIED ||
            task.state == TaskWorkflowState.PARTIAL ||
            task.state == TaskWorkflowState.SUSPICIOUS,
            "VeriWork: invalid state for verification"
        );
        require(task.evidenceHash == _evidenceHash, "VeriWork: evidence hash mismatch with initial commitment");

        verificationRecords[_taskId] = VerificationRecord({
            taskId: _taskId,
            evidenceHash: _evidenceHash,
            verdict: _verdict,
            integrityScore: _integrityScore,
            timestamp: block.timestamp,
            verifiedBy: msg.sender,
            verificationEngineVersion: _engineVersion
        });

        task.verdict = _verdict;
        task.verifiedAt = block.timestamp;

        if (_verdict == VerificationVerdict.VERIFIED) {
            task.state = TaskWorkflowState.VERIFIED;
        } else if (_verdict == VerificationVerdict.PARTIAL) {
            task.state = TaskWorkflowState.PARTIAL;
        } else {
            task.state = TaskWorkflowState.SUSPICIOUS;
        }

        totalVerifications++;

        emit VerificationRecorded(_taskId, _evidenceHash, _verdict, _integrityScore, block.timestamp);
    }

    /**
     * @dev Facility manager or auditor challenges a verification verdict
     */
    function challengeVerification(string memory _taskId, string memory _reason) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(
            task.state == TaskWorkflowState.VERIFIED ||
            task.state == TaskWorkflowState.PARTIAL ||
            task.state == TaskWorkflowState.SUSPICIOUS,
            "VeriWork: only verified/reviewed claims can be challenged"
        );
        require(bytes(_reason).length > 0, "VeriWork: challenge reason required");

        challenges[_taskId] = Challenge({
            taskId: _taskId,
            challenger: msg.sender,
            reason: _reason,
            status: ChallengeStatus.OPEN,
            raisedAt: block.timestamp,
            resolvedAt: 0,
            resolutionNotes: ""
        });

        totalChallenges++;

        emit ChallengeRaised(_taskId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Resolves an open challenge with resolution notes
     */
    function resolveChallenge(string memory _taskId, string memory _resolutionNotes) external {
        Challenge storage challenge = challenges[_taskId];
        require(challenge.status == ChallengeStatus.OPEN, "VeriWork: no open challenge found");
        require(bytes(_resolutionNotes).length > 0, "VeriWork: resolution notes required");

        challenge.status = ChallengeStatus.RESOLVED;
        challenge.resolvedAt = block.timestamp;
        challenge.resolutionNotes = _resolutionNotes;

        emit ChallengeResolved(_taskId, msg.sender, _resolutionNotes, block.timestamp);
    }

    /**
     * @dev Closes a task once verified and accepted
     */
    function closeTask(string memory _taskId) external {
        MaintenanceTask storage task = tasks[_taskId];
        require(task.exists, "VeriWork: task not found");
        require(
            task.state == TaskWorkflowState.VERIFIED || task.state == TaskWorkflowState.PARTIAL,
            "VeriWork: cannot close unverified or suspicious task"
        );
        require(challenges[_taskId].status != ChallengeStatus.OPEN, "VeriWork: cannot close task with open challenge");

        task.state = TaskWorkflowState.CLOSED;
        task.closedAt = block.timestamp;

        emit TaskClosed(_taskId, block.timestamp, msg.sender);
    }

    // ==========================================
    // VIEW / AUDIT HELPERS
    // ==========================================

    function getTask(string memory _taskId) external view returns (MaintenanceTask memory) {
        require(tasks[_taskId].exists, "VeriWork: task does not exist");
        return tasks[_taskId];
    }

    function getCommitment(string memory _taskId) external view returns (EvidenceCommitment memory) {
        return commitments[_taskId];
    }

    function getVerification(string memory _taskId) external view returns (VerificationRecord memory) {
        return verificationRecords[_taskId];
    }

    function getChallenge(string memory _taskId) external view returns (Challenge memory) {
        return challenges[_taskId];
    }

    function getAllTaskIds() external view returns (string[] memory) {
        return taskIds;
    }
}
