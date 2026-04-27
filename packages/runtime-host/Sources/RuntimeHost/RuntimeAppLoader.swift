public struct RuntimeAppLoader {
    public var defaultLifecycleState: RuntimeAppLifecycle.State

    public init(defaultLifecycleState: RuntimeAppLifecycle.State = .active) {
        self.defaultLifecycleState = defaultLifecycleState
    }

    public func loadFixture(
        lifecycleState: RuntimeAppLifecycle.State? = nil,
        lowering makeSemanticTree: () -> SemanticUITree
    ) -> RuntimeTreeSnapshot {
        let tree = makeSemanticTree()
        return RuntimeTreeSnapshot(
            appIdentifier: tree.appIdentifier,
            tree: tree,
            lifecycleState: lifecycleState ?? defaultLifecycleState
        )
    }

    public func loadFixture(
        appIdentifier: String,
        lifecycleState: RuntimeAppLifecycle.State? = nil,
        lowering makeSemanticTree: () -> SemanticUITree
    ) -> RuntimeTreeSnapshot {
        var tree = makeSemanticTree()
        tree.appIdentifier = appIdentifier
        return RuntimeTreeSnapshot(
            appIdentifier: appIdentifier,
            tree: tree,
            lifecycleState: lifecycleState ?? defaultLifecycleState
        )
    }

    public func loadCompatibilityTree(
        _ tree: SemanticUITree,
        lifecycleState: RuntimeAppLifecycle.State? = nil
    ) -> RuntimeTreeSnapshot {
        RuntimeTreeSnapshot(
            appIdentifier: tree.appIdentifier,
            tree: tree,
            lifecycleState: lifecycleState ?? defaultLifecycleState
        )
    }
}
