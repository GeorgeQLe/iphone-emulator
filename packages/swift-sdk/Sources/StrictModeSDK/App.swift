public protocol App {
    associatedtype Body: Scene

    @SceneBuilder
    var body: Body { get }
}

@resultBuilder
public enum SceneBuilder {
    public static func buildBlock<Content: Scene>(_ content: Content) -> Content {
        content
    }
}

