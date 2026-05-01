public struct RuntimeTransportSessionCoordinator: Sendable {
    public private(set) var events: [RuntimeTransportEvent]
    private var automationCoordinator: RuntimeAutomationCoordinator

    public var session: RuntimeAutomationSession? {
        automationCoordinator.session
    }

    public init(events: [RuntimeTransportEvent] = []) {
        self.events = events
        self.automationCoordinator = RuntimeAutomationCoordinator()
    }

    public mutating func handle(_ request: RuntimeTransportRequest) throws -> RuntimeTransportResponse {
        switch request {
        case let .launch(id, configuration):
            return try launch(id: id, configuration: configuration)
        case let .command(id, sessionID, expectedRevision, command):
            return try handleCommand(id: id, sessionID: sessionID, expectedRevision: expectedRevision, command: command)
        case let .inspectSession(id, sessionID):
            return inspectSession(id: id, sessionID: sessionID)
        case let .close(id, sessionID):
            return try close(id: id, sessionID: sessionID)
        }
    }

    private mutating func launch(
        id: String,
        configuration: RuntimeAutomationLaunchConfiguration
    ) throws -> RuntimeTransportResponse {
        guard automationCoordinator.session == nil else {
            return diagnosticResponse(
                id: id,
                sessionID: automationCoordinator.session?.id,
                code: .protocolViolation,
                message: "A live runtime session is already open."
            )
        }

        let response = try automationCoordinator.handle(
            RuntimeAutomationRequest(id: id, command: .launch(normalized(configuration)))
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
        events.append(.sessionOpened(descriptor))
        events.append(.semanticTreeUpdated(sessionID: session.id, snapshot: session.snapshot))

        return RuntimeTransportResponse(
            id: id,
            sessionID: session.id,
            result: .launched(descriptor),
            revision: session.snapshot.revision
        )
    }

    private mutating func handleCommand(
        id: String,
        sessionID: String,
        expectedRevision: Int,
        command: RuntimeAutomationCommand
    ) throws -> RuntimeTransportResponse {
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
                    "currentRevision": String(session.snapshot.revision),
                    "expectedRevision": String(expectedRevision),
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
        if let logs = automationCoordinator.session?.logs {
            events.append(.logsUpdated(sessionID: sessionID, logs: logs))
        }
        if let artifactBundle = automationCoordinator.session?.artifactBundle {
            events.append(.artifactBundleUpdated(sessionID: sessionID, artifactBundle: artifactBundle))
        }

        return RuntimeTransportResponse(
            id: id,
            sessionID: sessionID,
            result: .commandCompleted(response.result),
            revision: revision
        )
    }

    private func inspectSession(id: String, sessionID: String) -> RuntimeTransportResponse {
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
    }

    private mutating func close(id: String, sessionID: String) throws -> RuntimeTransportResponse {
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
