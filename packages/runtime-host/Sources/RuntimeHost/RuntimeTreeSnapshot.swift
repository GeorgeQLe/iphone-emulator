public struct RuntimeTreeSnapshot: Hashable, Codable, Sendable {
    public var appIdentifier: String
    public var tree: SemanticUITree
    public var lifecycleState: RuntimeAppLifecycle.State
    public var revision: Int
    public var device: RuntimeDeviceSettings

    public init(
        appIdentifier: String,
        tree: SemanticUITree,
        lifecycleState: RuntimeAppLifecycle.State = .active,
        revision: Int = 1,
        device: RuntimeDeviceSettings = RuntimeDeviceSettings()
    ) {
        self.appIdentifier = appIdentifier
        self.tree = tree
        self.lifecycleState = lifecycleState
        self.revision = revision
        self.device = device
    }
}
