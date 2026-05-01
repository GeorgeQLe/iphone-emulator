public struct RuntimeInMemoryTransport: RuntimeTransportConnection {
    public private(set) var coordinator: RuntimeTransportSessionCoordinator
    public private(set) var isClosed: Bool
    private var pendingEnvelopes: [RuntimeTransportEnvelope]
    private var deliveredEventCount: Int

    public init(coordinator: RuntimeTransportSessionCoordinator = RuntimeTransportSessionCoordinator()) {
        self.coordinator = coordinator
        self.isClosed = false
        self.pendingEnvelopes = []
        self.deliveredEventCount = coordinator.events.count
    }

    public mutating func send(_ envelope: RuntimeTransportEnvelope) throws {
        guard !isClosed else {
            pendingEnvelopes.append(
                .event(
                    .diagnostic(
                        RuntimeTransportDiagnostic(
                            code: .connectionFailure,
                            message: "Runtime transport is closed."
                        )
                    )
                )
            )
            return
        }

        guard case let .request(request) = envelope else {
            pendingEnvelopes.append(
                .event(
                    .diagnostic(
                        RuntimeTransportDiagnostic(
                            code: .protocolViolation,
                            message: "Runtime in-memory transport only accepts request envelopes."
                        )
                    )
                )
            )
            return
        }

        let response = try coordinator.handle(request)
        pendingEnvelopes.append(.response(response))
        appendCoordinatorEvents()
    }

    public mutating func receive() throws -> RuntimeTransportEnvelope? {
        guard !pendingEnvelopes.isEmpty else {
            return nil
        }
        return pendingEnvelopes.removeFirst()
    }

    public mutating func close() throws {
        if let sessionID = coordinator.session?.id {
            let response = try coordinator.handle(.close(id: "transport-close", sessionID: sessionID))
            pendingEnvelopes.append(.response(response))
            appendCoordinatorEvents()
        }
        isClosed = true
    }

    private mutating func appendCoordinatorEvents() {
        guard coordinator.events.count > deliveredEventCount else {
            return
        }

        for event in coordinator.events[deliveredEventCount...] {
            pendingEnvelopes.append(.event(event))
        }
        deliveredEventCount = coordinator.events.count
    }
}
