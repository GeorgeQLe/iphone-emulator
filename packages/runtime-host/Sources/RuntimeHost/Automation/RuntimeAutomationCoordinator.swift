public struct RuntimeAutomationCoordinator {
    public private(set) var bridge: RuntimeTreeBridge
    public private(set) var session: RuntimeAutomationSession?

    private var sessionSequence: Int
    private let loader: RuntimeAppLoader

    public init(
        loader: RuntimeAppLoader = RuntimeAppLoader(),
        bridge: RuntimeTreeBridge = RuntimeTreeBridge()
    ) {
        self.loader = loader
        self.bridge = bridge
        self.sessionSequence = 0
        self.session = nil
    }

    public mutating func handle(_ request: RuntimeAutomationRequest) throws -> RuntimeAutomationResponse {
        let result: RuntimeAutomationResponse.Result

        switch request.command {
        case let .launch(configuration):
            result = try launch(configuration: configuration)
        case .close:
            _ = try requireSession()
            session = nil
            bridge = RuntimeTreeBridge()
            result = .closed
        case let .tap(query):
            result = try performInteraction(
                query: query,
                logMessage: { "Tapped \($0.id.rawValue)" },
                apply: { node in
                    if node.role == .button {
                        node.label = "Saved"
                    }
                },
                updateScene: { scene in
                    scene.alertPayload = UIAlertPayload(title: "Done", message: "Saved")
                }
            )
        case let .fill(query, text), let .type(query, text):
            result = try performInteraction(
                query: query,
                logMessage: { "Filled \($0.id.rawValue) with \(text)" },
                apply: { node in
                    guard node.role == .textField else {
                        throw RuntimeAutomationError.interactionFailed("target is not a text field")
                    }
                    node.value = text
                }
            )
        case let .wait(query), let .query(query), let .inspect(query):
            let matches = try findMatches(for: query)
            result = .queryMatches(matches)
        case .semanticSnapshot:
            result = .semanticTree(try requireSession().snapshot.tree)
        case let .screenshot(name):
            let currentSession = try requireSession()
            result = .screenshot(
                RuntimeAutomationScreenshotMetadata(
                    name: name ?? currentSession.snapshot.tree.scene.id.rawValue,
                    format: "png",
                    byteCount: 0
                )
            )
        case .logs:
            result = .logs(try requireSession().logs)
        }

        return RuntimeAutomationResponse(
            requestID: request.id,
            result: result
        )
    }

    private mutating func launch(
        configuration: RuntimeAutomationLaunchConfiguration
    ) throws -> RuntimeAutomationResponse.Result {
        let snapshot = try loadFixtureSnapshot(configuration: configuration)
        sessionSequence += 1
        let logEntry = RuntimeAutomationLogEntry(
            level: .info,
            message: "Launched fixture \(configuration.fixtureName)"
        )
        let launchedSession = RuntimeAutomationSession(
            id: "session-\(sessionSequence)",
            appIdentifier: configuration.appIdentifier,
            snapshot: snapshot,
            logs: [logEntry]
        )

        session = launchedSession
        bridge.retain(snapshot)

        return .launched(launchedSession)
    }

    private mutating func performInteraction(
        query: RuntimeAutomationSemanticQuery,
        logMessage: (UITreeNode) -> String,
        apply mutation: (inout UITreeNode) throws -> Void,
        updateScene: ((inout UITreeScene) -> Void)? = nil
    ) throws -> RuntimeAutomationResponse.Result {
        var currentSession = try requireSession()
        guard var rootNode = currentSession.snapshot.tree.scene.rootNode else {
            throw RuntimeAutomationError.invalidQuery
        }

        guard let matchedNode = try mutateFirstMatch(in: &rootNode, query: query, mutation: mutation) else {
            throw RuntimeAutomationError.invalidQuery
        }

        var updatedScene = currentSession.snapshot.tree.scene
        updatedScene.rootNode = rootNode
        if updatedScene.modalState?.presentedNode?.id == rootNode.id {
            updatedScene.modalState?.presentedNode = rootNode
        }
        updateScene?(&updatedScene)

        let logEntry = RuntimeAutomationLogEntry(level: .info, message: logMessage(matchedNode))
        let updatedSnapshot = RuntimeTreeSnapshot(
            appIdentifier: currentSession.snapshot.appIdentifier,
            tree: SemanticUITree(
                appIdentifier: currentSession.snapshot.tree.appIdentifier,
                scene: updatedScene
            ),
            lifecycleState: currentSession.snapshot.lifecycleState,
            revision: currentSession.snapshot.revision + 1
        )
        currentSession.snapshot = updatedSnapshot
        currentSession.logs.append(logEntry)

        session = currentSession
        bridge.retain(updatedSnapshot)

        return .interactionCompleted(snapshot: updatedSnapshot, logs: currentSession.logs)
    }

    private func findMatches(for query: RuntimeAutomationSemanticQuery) throws -> [UITreeNode] {
        guard let rootNode = try requireSession().snapshot.tree.scene.rootNode else {
            return []
        }
        return flattenedNodes(startingAt: rootNode).filter { matches($0, query: query) }
    }

    private func loadFixtureSnapshot(
        configuration: RuntimeAutomationLaunchConfiguration
    ) throws -> RuntimeTreeSnapshot {
        switch configuration.fixtureName {
        case "strict-mode-baseline":
            return loader.loadFixture(appIdentifier: configuration.appIdentifier) {
                SemanticUITree(
                    appIdentifier: configuration.appIdentifier,
                    scene: UITreeScene(
                        id: "baseline-screen",
                        kind: .screen,
                        rootNode: UITreeNode(
                            id: "root-stack",
                            role: .navigationStack,
                            label: "Home",
                            children: [
                                UITreeNode(
                                    id: "home-screen",
                                    role: .screen,
                                    label: "Home",
                                    children: [
                                        UITreeNode(
                                            id: "page-layout",
                                            role: .vStack,
                                            children: [
                                                UITreeNode(
                                                    id: "headline",
                                                    role: .text,
                                                    label: "Hello from strict mode",
                                                    metadata: ["emphasis": "headline"]
                                                ),
                                                UITreeNode(
                                                    id: "profile-row",
                                                    role: .hStack,
                                                    children: [
                                                        UITreeNode(
                                                            id: "name-field",
                                                            role: .textField,
                                                            label: "Name",
                                                            value: "Taylor",
                                                            metadata: ["placeholder": "Enter name"]
                                                        ),
                                                        UITreeNode(
                                                            id: "save-button",
                                                            role: .button,
                                                            label: "Save",
                                                            metadata: ["variant": "primary"]
                                                        ),
                                                    ],
                                                    metadata: ["alignment": "center"]
                                                ),
                                                UITreeNode(
                                                    id: "items-list",
                                                    role: .list,
                                                    label: "Favorites",
                                                    children: [
                                                        UITreeNode(id: "favorite-1", role: .text, label: "Messages"),
                                                        UITreeNode(id: "favorite-2", role: .text, label: "Calendar"),
                                                    ]
                                                ),
                                                UITreeNode(
                                                    id: "tab-bar",
                                                    role: .tabView,
                                                    children: [
                                                        UITreeNode(id: "home-tab", role: .button, label: "Home"),
                                                        UITreeNode(id: "profile-tab", role: .button, label: "Profile"),
                                                    ]
                                                ),
                                            ],
                                            metadata: ["spacing": "16"]
                                        )
                                    ]
                                )
                            ]
                        ),
                        navigationState: UINavigationState(
                            stackIdentifiers: ["baseline-screen", "details-screen"],
                            selectedIdentifier: "baseline-screen"
                        ),
                        modalState: UIModalState(
                            isPresented: true,
                            presentedNode: UITreeNode(
                                id: "welcome-modal",
                                role: .modal,
                                label: "Welcome",
                                children: [
                                    UITreeNode(
                                        id: "welcome-modal-body",
                                        role: .vStack,
                                        children: [
                                            UITreeNode(
                                                id: "welcome-modal-copy",
                                                role: .text,
                                                label: "Strict mode renderer fixture loaded."
                                            ),
                                            UITreeNode(
                                                id: "welcome-modal-button",
                                                role: .button,
                                                label: "Continue"
                                            ),
                                        ],
                                        metadata: ["spacing": "12"]
                                    )
                                ]
                            )
                        ),
                        tabState: UITabState(
                            tabIdentifiers: ["home-tab", "profile-tab"],
                            selectedIdentifier: "home-tab"
                        ),
                        alertPayload: UIAlertPayload(
                            title: "Preview Mode",
                            message: "Renderer output is deterministic for this fixed fixture."
                        )
                    )
                )
            }
        default:
            throw RuntimeAutomationError.interactionFailed("unknown fixture \(configuration.fixtureName)")
        }
    }

    private func requireSession() throws -> RuntimeAutomationSession {
        guard let session else {
            throw RuntimeAutomationError.sessionNotFound
        }
        return session
    }

    private func matches(_ node: UITreeNode, query: RuntimeAutomationSemanticQuery) -> Bool {
        let matchesIdentifier = query.identifier.map { node.id == $0 } ?? true
        let matchesRole = query.role.map { node.role == $0 } ?? true
        let matchesText = query.text.map { text in
            node.label == text || node.value == text
        } ?? true

        return matchesIdentifier && matchesRole && matchesText
    }

    private func flattenedNodes(startingAt node: UITreeNode) -> [UITreeNode] {
        [node] + node.children.flatMap(flattenedNodes)
    }

    private func mutateFirstMatch(
        in node: inout UITreeNode,
        query: RuntimeAutomationSemanticQuery,
        mutation: (inout UITreeNode) throws -> Void
    ) throws -> UITreeNode? {
        if matches(node, query: query) {
            try mutation(&node)
            return node
        }

        for index in node.children.indices {
            if let matchedNode = try mutateFirstMatch(
                in: &node.children[index],
                query: query,
                mutation: mutation
            ) {
                return matchedNode
            }
        }

        return nil
    }
}
