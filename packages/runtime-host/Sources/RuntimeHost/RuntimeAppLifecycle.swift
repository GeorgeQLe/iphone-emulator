public struct RuntimeAppLifecycle {
    public enum State: Sendable {
        case inactive
        case active
        case background
    }

    public var state: State

    public init(state: State = .inactive) {
        self.state = state
    }
}
