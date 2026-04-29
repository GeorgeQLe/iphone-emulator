public struct RuntimeAutomationCoordinator {
    public private(set) var bridge: RuntimeTreeBridge
    public private(set) var session: RuntimeAutomationSession?

    private var sessionSequence: Int
    private var networkRequestSequence: Int
    private var networkFixtures: [RuntimeNetworkFixture]
    private let loader: RuntimeAppLoader

    public init(
        loader: RuntimeAppLoader = RuntimeAppLoader(),
        bridge: RuntimeTreeBridge = RuntimeTreeBridge()
    ) {
        self.loader = loader
        self.bridge = bridge
        self.sessionSequence = 0
        self.networkRequestSequence = 0
        self.networkFixtures = []
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
            result = try recordSemanticSnapshot()
        case let .screenshot(name):
            result = try recordScreenshot(name: name)
        case .logs:
            result = .logs(try requireSession().logs)
        case let .recordNetworkRequest(request):
            result = try recordNetworkRequest(request)
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
        let nativeCapabilityState = RuntimeNativeCapabilityState(manifest: configuration.nativeCapabilities)
        let nativeCapabilityLogs = nativeCapabilityState.logMessages.map {
            RuntimeAutomationLogEntry(level: .info, message: $0)
        }
        let nativeTree = tree(
            snapshot.tree,
            applying: nativeCapabilityState.semanticMetadata
        )
        let deviceSnapshot = RuntimeTreeSnapshot(
            appIdentifier: snapshot.appIdentifier,
            tree: nativeTree,
            lifecycleState: snapshot.lifecycleState,
            revision: snapshot.revision,
            device: configuration.device
        )
        sessionSequence += 1
        networkRequestSequence = 0
        networkFixtures = configuration.networkFixtures
        let logEntry = RuntimeAutomationLogEntry(
            level: .info,
            message: "Launched fixture \(configuration.fixtureName)"
        )
        let logs = [logEntry] + nativeCapabilityLogs
        let sessionID = "session-\(sessionSequence)"
        let launchedSession = RuntimeAutomationSession(
            id: sessionID,
            appIdentifier: configuration.appIdentifier,
            snapshot: deviceSnapshot,
            logs: logs,
            artifactBundle: RuntimeArtifactBundle(
                sessionID: sessionID,
                semanticSnapshots: [
                    RuntimeSemanticSnapshotArtifact(
                        name: "\(configuration.fixtureName)-initial-tree",
                        tree: deviceSnapshot.tree,
                        revision: deviceSnapshot.revision
                    )
                ],
                logs: logs,
                nativeCapabilityRecords: nativeCapabilityState.artifactRecords
            ),
            device: configuration.device,
            nativeCapabilities: configuration.nativeCapabilities,
            nativeCapabilityState: nativeCapabilityState,
            nativeCapabilityEvents: nativeCapabilityState.scriptedEvents
        )

        session = launchedSession
        bridge.retain(deviceSnapshot)

        return .launched(launchedSession)
    }

    private func tree(
        _ tree: SemanticUITree,
        applying metadata: [String: String]
    ) -> SemanticUITree {
        guard !metadata.isEmpty, var rootNode = tree.scene.rootNode else {
            return tree
        }

        for (key, value) in metadata {
            rootNode.metadata[key] = value
        }

        var updatedScene = tree.scene
        updatedScene.rootNode = rootNode

        return SemanticUITree(
            appIdentifier: tree.appIdentifier,
            scene: updatedScene
        )
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
            revision: currentSession.snapshot.revision + 1,
            device: currentSession.device
        )
        currentSession.snapshot = updatedSnapshot
        currentSession.logs.append(logEntry)
        currentSession.artifactBundle.logs = currentSession.logs

        session = currentSession
        bridge.retain(updatedSnapshot)

        return .interactionCompleted(snapshot: updatedSnapshot, logs: currentSession.logs)
    }

    private mutating func recordSemanticSnapshot() throws -> RuntimeAutomationResponse.Result {
        var currentSession = try requireSession()
        let artifact = RuntimeSemanticSnapshotArtifact(
            name: "\(currentSession.snapshot.tree.scene.id.rawValue)-revision-\(currentSession.snapshot.revision)",
            tree: currentSession.snapshot.tree,
            revision: currentSession.snapshot.revision
        )
        currentSession.artifactBundle.semanticSnapshots.append(artifact)
        session = currentSession

        return .semanticTree(currentSession.snapshot.tree)
    }

    private mutating func recordScreenshot(name: String?) throws -> RuntimeAutomationResponse.Result {
        var currentSession = try requireSession()
        let artifact = RuntimeRenderArtifactMetadata(
            name: name ?? currentSession.snapshot.tree.scene.id.rawValue,
            kind: .screenshot,
            format: "png",
            byteCount: 0,
            viewport: currentSession.device.viewport
        )
        currentSession.artifactBundle.renderArtifacts.append(artifact)
        session = currentSession

        return .screenshot(
            RuntimeAutomationScreenshotMetadata(
                name: artifact.name,
                format: artifact.format,
                byteCount: artifact.byteCount
            )
        )
    }

    private mutating func recordNetworkRequest(
        _ request: RuntimeNetworkRequest
    ) throws -> RuntimeAutomationResponse.Result {
        var currentSession = try requireSession()
        networkRequestSequence += 1
        let fixture = networkFixtures.first { fixture in
            fixture.method == request.method && fixture.url == request.url
        }
        let record = RuntimeNetworkRequestRecord(
            id: "request-\(networkRequestSequence)",
            request: request,
            response: fixture?.response ?? RuntimeNetworkResponse(status: 599),
            source: fixture.map { .fixture($0.id) } ?? .missingFixture
        )
        currentSession.artifactBundle.networkRecords.append(record)
        session = currentSession

        return .networkRecord(record)
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
