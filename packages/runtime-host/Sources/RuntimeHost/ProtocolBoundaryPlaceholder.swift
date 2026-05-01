public struct ProtocolBoundaryPlaceholder {
    public enum Transport: Sendable {
        case jsonRPC
        case webSocket
        case inMemory
    }

    public var transport: Transport

    public init(transport: Transport = .jsonRPC) {
        self.transport = transport
    }

    public func makeInMemoryTransport() -> RuntimeInMemoryTransport {
        RuntimeInMemoryTransport()
    }
}
