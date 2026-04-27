public enum UITreeSceneKind: String, Codable, Sendable {
    case screen
    case modal
    case tabView
    case alert
}

public struct UITreeScene: Hashable, Codable, Sendable {
    public var id: UITreeIdentifier
    public var kind: UITreeSceneKind
    public var rootNode: UITreeNode?
    public var navigationState: UINavigationState?
    public var modalState: UIModalState?
    public var tabState: UITabState?
    public var alertPayload: UIAlertPayload?

    public init(
        id: UITreeIdentifier,
        kind: UITreeSceneKind,
        rootNode: UITreeNode? = nil,
        navigationState: UINavigationState? = nil,
        modalState: UIModalState? = nil,
        tabState: UITabState? = nil,
        alertPayload: UIAlertPayload? = nil
    ) {
        self.id = id
        self.kind = kind
        self.rootNode = rootNode
        self.navigationState = navigationState
        self.modalState = modalState
        self.tabState = tabState
        self.alertPayload = alertPayload
    }
}
