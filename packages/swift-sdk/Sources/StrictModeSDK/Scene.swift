public protocol Scene {}

public struct Modal: Scene {
    public init() {}
}

public struct TabView: Scene {
    public init() {}
}

public struct Alert: Scene {
    public let title: String
    public let message: String?

    public init(_ title: String, message: String? = nil) {
        self.title = title
        self.message = message
    }
}
