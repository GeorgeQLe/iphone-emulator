public struct RuntimeTreeBridge {
    public var lastRenderedTreeIdentifier: String?

    public init(lastRenderedTreeIdentifier: String? = nil) {
        self.lastRenderedTreeIdentifier = lastRenderedTreeIdentifier
    }
}
