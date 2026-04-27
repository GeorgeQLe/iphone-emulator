import RuntimeHost

public protocol View {
    var semanticNode: UITreeNode { get }
}

public struct AnyView: View {
    public let semanticNode: UITreeNode

    public init<V: View>(_ view: V) {
        self.semanticNode = view.semanticNode
    }
}

@resultBuilder
public enum ViewBuilder {
    public static func buildExpression<Content: View>(_ content: Content) -> [AnyView] {
        [AnyView(content)]
    }

    public static func buildBlock(_ components: [AnyView]...) -> [AnyView] {
        components.flatMap { $0 }
    }

    public static func buildOptional(_ component: [AnyView]?) -> [AnyView] {
        component ?? []
    }

    public static func buildEither(first component: [AnyView]) -> [AnyView] {
        component
    }

    public static func buildEither(second component: [AnyView]) -> [AnyView] {
        component
    }

    public static func buildArray(_ components: [[AnyView]]) -> [AnyView] {
        components.flatMap { $0 }
    }
}

public struct Text: View {
    public let id: UITreeIdentifier
    public let value: String

    public init(_ value: String, id: UITreeIdentifier? = nil) {
        self.id = id ?? UITreeIdentifier(rawValue: "text:\(value)")
        self.value = value
    }

    public var semanticNode: UITreeNode {
        UITreeNode(id: id, role: .text, label: value)
    }
}

public struct Button: View {
    public let id: UITreeIdentifier
    public let title: String?

    public init(_ title: String? = nil, id: UITreeIdentifier? = nil) {
        self.id = id ?? UITreeIdentifier(rawValue: "button:\(title ?? "untitled")")
        self.title = title
    }

    public var semanticNode: UITreeNode {
        UITreeNode(id: id, role: .button, label: title)
    }
}

public struct TextField: View {
    public let id: UITreeIdentifier
    public let title: String
    public var text: String

    public init(_ title: String, text: String = "", id: UITreeIdentifier? = nil) {
        self.id = id ?? UITreeIdentifier(rawValue: "text-field:\(title)")
        self.title = title
        self.text = text
    }

    public var semanticNode: UITreeNode {
        UITreeNode(id: id, role: .textField, label: title, value: text)
    }
}

public struct List: View {
    public let id: UITreeIdentifier
    public let children: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "list"
        self.children = content()
    }

    public var semanticNode: UITreeNode {
        UITreeNode(
            id: id,
            role: .list,
            children: children.map(\.semanticNode)
        )
    }
}

public struct VStack: View {
    public let id: UITreeIdentifier
    public let children: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "v-stack"
        self.children = content()
    }

    public var semanticNode: UITreeNode {
        UITreeNode(
            id: id,
            role: .vStack,
            children: children.map(\.semanticNode)
        )
    }
}

public struct HStack: View {
    public let id: UITreeIdentifier
    public let children: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "h-stack"
        self.children = content()
    }

    public var semanticNode: UITreeNode {
        UITreeNode(
            id: id,
            role: .hStack,
            children: children.map(\.semanticNode)
        )
    }
}

public struct NavigationStack: View {
    public let id: UITreeIdentifier
    public let children: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "navigation-stack"
        self.children = content()
    }

    public var semanticNode: UITreeNode {
        UITreeNode(
            id: id,
            role: .navigationStack,
            children: children.map(\.semanticNode),
            metadata: [
                "stackDepth": String(children.count),
            ]
        )
    }
}
