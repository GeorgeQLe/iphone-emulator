public enum UITreeRole: String, Codable, Sendable {
    case screen
    case text
    case button
    case textField
    case list
    case vStack
    case hStack
    case navigationStack
    case modal
    case tabView
    case alert
}

public struct UITreeNode: Hashable, Codable, Sendable {
    public var id: UITreeIdentifier
    public var role: UITreeRole
    public var label: String?
    public var value: String?
    public var children: [UITreeNode]
    public var metadata: [String: String]

    public init(
        id: UITreeIdentifier,
        role: UITreeRole,
        label: String? = nil,
        value: String? = nil,
        children: [UITreeNode] = [],
        metadata: [String: String] = [:]
    ) {
        self.id = id
        self.role = role
        self.label = label
        self.value = value
        self.children = children
        self.metadata = metadata
    }
}
