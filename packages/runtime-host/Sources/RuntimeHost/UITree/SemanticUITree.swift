public struct SemanticUITree: Hashable, Codable, Sendable {
    public var appIdentifier: String
    public var scene: UITreeScene

    public init(
        appIdentifier: String,
        scene: UITreeScene
    ) {
        self.appIdentifier = appIdentifier
        self.scene = scene
    }
}
