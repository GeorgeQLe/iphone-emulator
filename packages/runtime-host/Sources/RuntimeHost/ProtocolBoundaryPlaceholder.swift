public struct ProtocolBoundaryPlaceholder {
    public enum Transport: Sendable {
        case jsonRPC
        case webSocket
    }

    public var transport: Transport

    public init(transport: Transport = .jsonRPC) {
        self.transport = transport
    }
}
