public enum RuntimeTransportEnvelope: Hashable, Codable, Sendable {
    case request(RuntimeTransportRequest)
    case response(RuntimeTransportResponse)
    case event(RuntimeTransportEvent)
}

public enum RuntimeTransportRequest: Hashable, Codable, Sendable {
    case launch(id: String, configuration: RuntimeAutomationLaunchConfiguration)
    case command(id: String, sessionID: String, expectedRevision: Int, command: RuntimeAutomationCommand)
    case inspectSession(id: String, sessionID: String)
    case close(id: String, sessionID: String)

    public var id: String {
        switch self {
        case let .launch(id, _),
             let .command(id, _, _, _),
             let .inspectSession(id, _),
             let .close(id, _):
            id
        }
    }

    public var sessionID: String? {
        switch self {
        case .launch:
            nil
        case let .command(_, sessionID, _, _),
             let .inspectSession(_, sessionID),
             let .close(_, sessionID):
            sessionID
        }
    }
}

public struct RuntimeTransportResponse: Hashable, Codable, Sendable {
    public enum Result: Hashable, Codable, Sendable {
        case launched(RuntimeTransportSessionDescriptor)
        case commandCompleted(RuntimeAutomationResponse.Result)
        case inspected(RuntimeAutomationSession)
        case closed
        case failed
    }

    public var id: String
    public var sessionID: String?
    public var result: Result
    public var revision: Int?
    public var diagnostic: RuntimeTransportDiagnostic?
    public var sessionInspection: RuntimeAutomationSession?

    public init(
        id: String,
        sessionID: String? = nil,
        result: Result,
        revision: Int? = nil,
        diagnostic: RuntimeTransportDiagnostic? = nil,
        sessionInspection: RuntimeAutomationSession? = nil
    ) {
        self.id = id
        self.sessionID = sessionID
        self.result = result
        self.revision = revision
        self.diagnostic = diagnostic
        self.sessionInspection = sessionInspection
    }
}

public enum RuntimeTransportEvent: Hashable, Codable, Sendable {
    case sessionOpened(RuntimeTransportSessionDescriptor)
    case semanticTreeUpdated(sessionID: String, snapshot: RuntimeTreeSnapshot)
    case logsUpdated(sessionID: String, logs: [RuntimeAutomationLogEntry])
    case artifactBundleUpdated(sessionID: String, artifactBundle: RuntimeArtifactBundle)
    case sessionClosed(sessionID: String)
    case diagnostic(RuntimeTransportDiagnostic)

    public var sessionID: String? {
        switch self {
        case let .sessionOpened(descriptor):
            descriptor.id
        case let .semanticTreeUpdated(sessionID, _),
             let .logsUpdated(sessionID, _),
             let .artifactBundleUpdated(sessionID, _),
             let .sessionClosed(sessionID):
            sessionID
        case let .diagnostic(diagnostic):
            diagnostic.sessionID
        }
    }

    public var revision: Int? {
        switch self {
        case let .sessionOpened(descriptor):
            descriptor.revision
        case let .semanticTreeUpdated(_, snapshot):
            snapshot.revision
        case .logsUpdated, .artifactBundleUpdated, .sessionClosed, .diagnostic:
            nil
        }
    }
}

public struct RuntimeTransportDiagnostic: Hashable, Codable, Sendable {
    public enum Code: String, Hashable, Codable, Sendable {
        case connectionFailure
        case timeout
        case unsupportedCommand
        case protocolViolation
        case staleRevision
    }

    public var code: Code
    public var message: String
    public var sessionID: String?
    public var requestID: String?
    public var payload: [String: String]

    public init(
        code: Code,
        message: String,
        sessionID: String? = nil,
        requestID: String? = nil,
        payload: [String: String] = [:]
    ) {
        self.code = code
        self.message = message
        self.sessionID = sessionID
        self.requestID = requestID
        self.payload = payload
    }
}

public struct RuntimeTransportSessionDescriptor: Hashable, Codable, Sendable {
    public var id: String
    public var appIdentifier: String
    public var lifecycleState: RuntimeAppLifecycle.State
    public var revision: Int

    public init(
        id: String,
        appIdentifier: String,
        lifecycleState: RuntimeAppLifecycle.State,
        revision: Int
    ) {
        self.id = id
        self.appIdentifier = appIdentifier
        self.lifecycleState = lifecycleState
        self.revision = revision
    }
}

public protocol RuntimeTransportConnection: Sendable {
    mutating func send(_ envelope: RuntimeTransportEnvelope) throws
    mutating func receive() throws -> RuntimeTransportEnvelope?
    mutating func close() throws
}
