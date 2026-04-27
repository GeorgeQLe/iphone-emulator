public protocol View {}

@resultBuilder
public enum ViewBuilder {
    public static func buildBlock<Content: View>(_ content: Content) -> Content {
        content
    }
}

public struct Text: View {
    public let value: String

    public init(_ value: String) {
        self.value = value
    }
}

public struct Button: View {
    public init() {}
}

public struct TextField: View {
    public let title: String
    public var text: String

    public init(_ title: String, text: String = "") {
        self.title = title
        self.text = text
    }
}

public struct List: View {
    public init() {}
}

public struct VStack: View {
    public init() {}
}

public struct HStack: View {
    public init() {}
}

public struct NavigationStack: View {
    public init() {}
}
