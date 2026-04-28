public struct RuntimeArtifactBundle: Hashable, Codable, Sendable {
    public var sessionID: String
    public var renderArtifacts: [RuntimeRenderArtifactMetadata]
    public var semanticSnapshots: [RuntimeSemanticSnapshotArtifact]
    public var logs: [RuntimeAutomationLogEntry]
    public var networkRecords: [RuntimeNetworkRequestRecord]

    public init(
        sessionID: String,
        renderArtifacts: [RuntimeRenderArtifactMetadata] = [],
        semanticSnapshots: [RuntimeSemanticSnapshotArtifact] = [],
        logs: [RuntimeAutomationLogEntry] = [],
        networkRecords: [RuntimeNetworkRequestRecord] = []
    ) {
        self.sessionID = sessionID
        self.renderArtifacts = renderArtifacts
        self.semanticSnapshots = semanticSnapshots
        self.logs = logs
        self.networkRecords = networkRecords
    }
}

public struct RuntimeRenderArtifactMetadata: Hashable, Codable, Sendable {
    public enum Kind: String, Hashable, Codable, Sendable {
        case screenshot
        case render
    }

    public var name: String
    public var kind: Kind
    public var format: String
    public var byteCount: Int
    public var viewport: RuntimeDeviceViewport

    public init(
        name: String,
        kind: Kind,
        format: String,
        byteCount: Int,
        viewport: RuntimeDeviceViewport
    ) {
        self.name = name
        self.kind = kind
        self.format = format
        self.byteCount = byteCount
        self.viewport = viewport
    }
}

public struct RuntimeSemanticSnapshotArtifact: Hashable, Codable, Sendable {
    public var name: String
    public var tree: SemanticUITree
    public var revision: Int

    public init(
        name: String,
        tree: SemanticUITree,
        revision: Int
    ) {
        self.name = name
        self.tree = tree
        self.revision = revision
    }
}
