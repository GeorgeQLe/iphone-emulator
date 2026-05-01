public struct RuntimeTreeBridge: Sendable {
    public private(set) var latestSnapshot: RuntimeTreeSnapshot?

    public init(snapshot: RuntimeTreeSnapshot? = nil) {
        self.latestSnapshot = snapshot
    }

    public var lastRenderedTreeIdentifier: String? {
        latestRootIdentifier?.rawValue
    }

    public var latestAppIdentifier: String? {
        latestSnapshot?.appIdentifier
    }

    public var latestRootIdentifier: UITreeIdentifier? {
        latestSnapshot?.tree.scene.rootNode?.id
    }

    public var latestNavigationState: UINavigationState? {
        latestSnapshot?.tree.scene.navigationState
    }

    public var latestModalState: UIModalState? {
        latestSnapshot?.tree.scene.modalState
    }

    public var latestAlertPayload: UIAlertPayload? {
        latestSnapshot?.tree.scene.alertPayload
    }

    public mutating func retain(_ snapshot: RuntimeTreeSnapshot) {
        latestSnapshot = snapshot
    }
}
