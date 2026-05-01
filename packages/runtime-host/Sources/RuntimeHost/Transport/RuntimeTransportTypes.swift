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

public struct RuntimeTransportSessionCoordinator {
    public private(set) var events: [RuntimeTransportEvent]
    private var automationCoordinator: RuntimeAutomationCoordinator

    public init(events: [RuntimeTransportEvent] = []) {
        self.events = events
        self.automationCoordinator = RuntimeAutomationCoordinator()
    }

    public mutating func handle(_ request: RuntimeTransportRequest) throws -> RuntimeTransportResponse {
        switch request {
        case let .launch(id, configuration):
            let launchConfiguration = normalized(configuration)
            let response = try automationCoordinator.handle(
                RuntimeAutomationRequest(id: id, command: .launch(launchConfiguration))
            )
            guard case let .launched(session) = response.result else {
                return diagnosticResponse(
                    id: id,
                    sessionID: nil,
                    code: .protocolViolation,
                    message: "Launch did not produce a session."
                )
            }
            let descriptor = RuntimeTransportSessionDescriptor(session: session)
            events.append(.semanticTreeUpdated(sessionID: session.id, snapshot: session.snapshot))
            return RuntimeTransportResponse(
                id: id,
                sessionID: session.id,
                result: .launched(descriptor),
                revision: session.snapshot.revision
            )
        case let .command(id, sessionID, expectedRevision, command):
            guard let session = automationCoordinator.session, session.id == sessionID else {
                return diagnosticResponse(
                    id: id,
                    sessionID: sessionID,
                    code: .protocolViolation,
                    message: "No live runtime session exists for the requested session identifier.",
                    payload: ["sessionID": sessionID]
                )
            }
            guard expectedRevision == session.snapshot.revision else {
                return diagnosticResponse(
                    id: id,
                    sessionID: sessionID,
                    code: .staleRevision,
                    message: "Command expected a stale semantic revision.",
                    payload: [
                        "expectedRevision": String(session.snapshot.revision),
                        "receivedRevision": String(expectedRevision),
                    ]
                )
            }
            if case let .unsupported(commandName) = command {
                return diagnosticResponse(
                    id: id,
                    sessionID: sessionID,
                    code: .unsupportedCommand,
                    message: "\(commandName) is not supported by the runtime transport.",
                    payload: ["command": commandName]
                )
            }
            let response = try automationCoordinator.handle(
                RuntimeAutomationRequest(id: id, command: command)
            )
            let revision = automationCoordinator.session?.snapshot.revision
            if let snapshot = automationCoordinator.session?.snapshot {
                events.append(.semanticTreeUpdated(sessionID: sessionID, snapshot: snapshot))
            }
            return RuntimeTransportResponse(
                id: id,
                sessionID: sessionID,
                result: .commandCompleted(response.result),
                revision: revision
            )
        case let .inspectSession(id, sessionID):
            guard let session = automationCoordinator.session, session.id == sessionID else {
                return diagnosticResponse(
                    id: id,
                    sessionID: sessionID,
                    code: .protocolViolation,
                    message: "No live runtime session exists for inspection.",
                    payload: ["sessionID": sessionID]
                )
            }
            return RuntimeTransportResponse(
                id: id,
                sessionID: sessionID,
                result: .inspected(session),
                revision: session.snapshot.revision,
                sessionInspection: session
            )
        case let .close(id, sessionID):
            guard automationCoordinator.session?.id == sessionID else {
                return diagnosticResponse(
                    id: id,
                    sessionID: sessionID,
                    code: .protocolViolation,
                    message: "No live runtime session exists to close.",
                    payload: ["sessionID": sessionID]
                )
            }
            _ = try automationCoordinator.handle(
                RuntimeAutomationRequest(id: id, command: .close(sessionID: sessionID))
            )
            events.append(.sessionClosed(sessionID: sessionID))
            return RuntimeTransportResponse(
                id: id,
                sessionID: sessionID,
                result: .closed
            )
        }
    }

    private func normalized(
        _ configuration: RuntimeAutomationLaunchConfiguration
    ) -> RuntimeAutomationLaunchConfiguration {
        let defaultDevice = RuntimeDeviceSettings()
        let transportDefaultDevice = RuntimeDeviceSettings(
            viewport: RuntimeDeviceViewport(width: 390, height: 844, scale: 1)
        )
        return RuntimeAutomationLaunchConfiguration(
            appIdentifier: configuration.appIdentifier,
            fixtureName: configuration.fixtureName,
            device: configuration.device == defaultDevice ? transportDefaultDevice : configuration.device,
            networkFixtures: configuration.networkFixtures,
            nativeCapabilities: configuration.nativeCapabilities
        )
    }

    private func diagnosticResponse(
        id: String,
        sessionID: String?,
        code: RuntimeTransportDiagnostic.Code,
        message: String,
        payload: [String: String] = [:]
    ) -> RuntimeTransportResponse {
        RuntimeTransportResponse(
            id: id,
            sessionID: sessionID,
            result: .failed,
            diagnostic: RuntimeTransportDiagnostic(
                code: code,
                message: message,
                sessionID: sessionID,
                requestID: id,
                payload: payload
            )
        )
    }
}

private extension RuntimeTransportSessionDescriptor {
    init(session: RuntimeAutomationSession) {
        self.init(
            id: session.id,
            appIdentifier: session.appIdentifier,
            lifecycleState: session.snapshot.lifecycleState,
            revision: session.snapshot.revision
        )
    }
}
