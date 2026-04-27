public struct RuntimeAutomationSession: Hashable, Codable, Sendable {
    public var id: String
    public var appIdentifier: String
    public var snapshot: RuntimeTreeSnapshot
    public var logs: [RuntimeAutomationLogEntry]

    public init(
        id: String,
        appIdentifier: String,
        snapshot: RuntimeTreeSnapshot,
        logs: [RuntimeAutomationLogEntry] = []
    ) {
        self.id = id
        self.appIdentifier = appIdentifier
        self.snapshot = snapshot
        self.logs = logs
    }
}

public struct RuntimeAutomationLaunchConfiguration: Hashable, Codable, Sendable {
    public var appIdentifier: String
    public var fixtureName: String

    public init(
        appIdentifier: String,
        fixtureName: String
    ) {
        self.appIdentifier = appIdentifier
        self.fixtureName = fixtureName
    }
}

public struct RuntimeAutomationSemanticQuery: Hashable, Codable, Sendable {
    public var role: UITreeRole?
    public var text: String?
    public var identifier: UITreeIdentifier?

    public init(
        role: UITreeRole? = nil,
        text: String? = nil,
        identifier: UITreeIdentifier? = nil
    ) {
        self.role = role
        self.text = text
        self.identifier = identifier
    }
}

public enum RuntimeAutomationCommand: Hashable, Codable, Sendable {
    case launch(RuntimeAutomationLaunchConfiguration)
    case close(sessionID: String? = nil)
    case tap(RuntimeAutomationSemanticQuery)
    case fill(RuntimeAutomationSemanticQuery, text: String)
    case type(RuntimeAutomationSemanticQuery, text: String)
    case wait(RuntimeAutomationSemanticQuery)
    case query(RuntimeAutomationSemanticQuery)
    case inspect(RuntimeAutomationSemanticQuery)
    case semanticSnapshot(sessionID: String? = nil)
    case screenshot(name: String? = nil)
    case logs(sessionID: String? = nil)
}

public struct RuntimeAutomationRequest: Hashable, Codable, Sendable {
    public var id: String
    public var command: RuntimeAutomationCommand

    public init(
        id: String,
        command: RuntimeAutomationCommand
    ) {
        self.id = id
        self.command = command
    }
}

public struct RuntimeAutomationResponse: Hashable, Codable, Sendable {
    public enum Result: Hashable, Codable, Sendable {
        case launched(RuntimeAutomationSession)
        case closed
        case interactionCompleted(snapshot: RuntimeTreeSnapshot, logs: [RuntimeAutomationLogEntry])
        case queryMatches([UITreeNode])
        case semanticTree(SemanticUITree)
        case screenshot(RuntimeAutomationScreenshotMetadata)
        case logs([RuntimeAutomationLogEntry])
    }

    public var requestID: String
    public var result: Result

    public init(
        requestID: String,
        result: Result
    ) {
        self.requestID = requestID
        self.result = result
    }
}

public enum RuntimeAutomationEvent: Hashable, Codable, Sendable {
    case sessionOpened(RuntimeAutomationSession)
    case snapshotUpdated(RuntimeTreeSnapshot)
    case logsUpdated([RuntimeAutomationLogEntry])
    case sessionClosed
}

public struct RuntimeAutomationLogEntry: Hashable, Codable, Sendable {
    public enum Level: String, Hashable, Codable, Sendable {
        case debug
        case info
        case warning
        case error
    }

    public var level: Level
    public var message: String

    public init(
        level: Level,
        message: String
    ) {
        self.level = level
        self.message = message
    }
}

public struct RuntimeAutomationScreenshotMetadata: Hashable, Codable, Sendable {
    public var name: String
    public var format: String
    public var byteCount: Int

    public init(
        name: String,
        format: String,
        byteCount: Int
    ) {
        self.name = name
        self.format = format
        self.byteCount = byteCount
    }
}

public enum RuntimeAutomationError: Hashable, Codable, Sendable, Error {
    case sessionNotFound
    case invalidQuery
    case unsupportedCommand
    case interactionFailed(String)
}
