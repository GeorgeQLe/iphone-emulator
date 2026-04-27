import RuntimeHost

public protocol Scene {
    var semanticScene: UITreeScene { get }
}

public struct Modal: Scene {
    public let id: UITreeIdentifier
    public let content: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "modal"
        self.content = content()
    }

    public var semanticScene: UITreeScene {
        let rootNode = UITreeNode(
            id: id,
            role: .modal,
            children: content.map(\.semanticNode)
        )
        return UITreeScene(
            id: id,
            kind: .modal,
            rootNode: rootNode,
            modalState: UIModalState(
                isPresented: true,
                presentedNode: rootNode
            )
        )
    }
}

public struct TabView: Scene {
    public let id: UITreeIdentifier
    public let tabs: [AnyView]

    public init(id: UITreeIdentifier? = nil, @ViewBuilder content: () -> [AnyView] = { [] }) {
        self.id = id ?? "tab-view"
        self.tabs = content()
    }

    public var semanticScene: UITreeScene {
        let rootNode = UITreeNode(
            id: id,
            role: .tabView,
            children: tabs.map(\.semanticNode)
        )
        return UITreeScene(
            id: id,
            kind: .tabView,
            rootNode: rootNode,
            tabState: UITabState(
                tabIdentifiers: tabs.map(\.semanticNode.id),
                selectedIdentifier: tabs.first?.semanticNode.id
            )
        )
    }
}

public struct Alert: Scene {
    public let id: UITreeIdentifier
    public let title: String
    public let message: String?

    public init(_ title: String, message: String? = nil, id: UITreeIdentifier? = nil) {
        self.id = id ?? UITreeIdentifier(rawValue: "alert:\(title)")
        self.title = title
        self.message = message
    }

    public var semanticScene: UITreeScene {
        UITreeScene(
            id: id,
            kind: .alert,
            rootNode: UITreeNode(
                id: id,
                role: .alert,
                label: title,
                value: message
            ),
            alertPayload: UIAlertPayload(
                title: title,
                message: message
            )
        )
    }
}
