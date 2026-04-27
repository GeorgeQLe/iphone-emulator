public struct UINavigationState: Hashable, Codable, Sendable {
    public var stackIdentifiers: [UITreeIdentifier]
    public var selectedIdentifier: UITreeIdentifier?

    public init(
        stackIdentifiers: [UITreeIdentifier] = [],
        selectedIdentifier: UITreeIdentifier? = nil
    ) {
        self.stackIdentifiers = stackIdentifiers
        self.selectedIdentifier = selectedIdentifier
    }
}

public struct UIModalState: Hashable, Codable, Sendable {
    public var isPresented: Bool
    public var presentedNode: UITreeNode?

    public init(
        isPresented: Bool,
        presentedNode: UITreeNode? = nil
    ) {
        self.isPresented = isPresented
        self.presentedNode = presentedNode
    }
}

public struct UITabState: Hashable, Codable, Sendable {
    public var tabIdentifiers: [UITreeIdentifier]
    public var selectedIdentifier: UITreeIdentifier?

    public init(
        tabIdentifiers: [UITreeIdentifier] = [],
        selectedIdentifier: UITreeIdentifier? = nil
    ) {
        self.tabIdentifiers = tabIdentifiers
        self.selectedIdentifier = selectedIdentifier
    }
}

public struct UIAlertPayload: Hashable, Codable, Sendable {
    public var title: String
    public var message: String?
    public var actions: [String]

    public init(
        title: String,
        message: String? = nil,
        actions: [String] = []
    ) {
        self.title = title
        self.message = message
        self.actions = actions
    }
}
