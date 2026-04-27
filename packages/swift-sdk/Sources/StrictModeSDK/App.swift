import RuntimeHost

public protocol App {
    associatedtype Body: Scene

    @SceneBuilder
    var body: Body { get }
}

public extension App {
    func makeSemanticTree(
        appIdentifier: String = String(describing: Self.self)
    ) -> SemanticUITree {
        SemanticUITree(
            appIdentifier: appIdentifier,
            scene: body.semanticScene
        )
    }
}

@resultBuilder
public enum SceneBuilder {
    public static func buildBlock<Content: Scene>(_ content: Content) -> Content {
        content
    }
}
