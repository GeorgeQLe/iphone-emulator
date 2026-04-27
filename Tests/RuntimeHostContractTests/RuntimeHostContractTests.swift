import Testing
import RuntimeHost
import StrictModeSDK

struct RuntimeHostContractTests {
    @Test("runtime host public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            RuntimeAppLifecycle.self,
            RuntimeAppLoader.self,
            RuntimeTreeBridge.self,
            RuntimeTreeSnapshot.self,
            RuntimeLogSink.self,
            ProtocolBoundaryPlaceholder.self,
            SemanticUITree.self,
            UITreeScene.self,
            UITreeNode.self,
            UITreeIdentifier.self,
            UINavigationState.self,
            UIModalState.self,
            UITabState.self,
            UIAlertPayload.self,
        ]

        #expect(exportedSymbols.count == 14)
    }

    @Test("semantic tree contract keeps identifiers and state deterministic")
    func semanticTreeContractDeterministic() {
        let node = UITreeNode(
            id: "name-field",
            role: .textField,
            label: "Name",
            value: "Taylor"
        )
        let scene = UITreeScene(
            id: "root-modal",
            kind: .modal,
            rootNode: node,
            navigationState: UINavigationState(stackIdentifiers: ["root-modal"], selectedIdentifier: "root-modal"),
            modalState: UIModalState(isPresented: true, presentedNode: node),
            tabState: UITabState(tabIdentifiers: ["name-field"], selectedIdentifier: "name-field"),
            alertPayload: UIAlertPayload(title: "Notice", message: "Saved")
        )
        let tree = SemanticUITree(appIdentifier: "FixtureApp", scene: scene)

        #expect(tree.scene.rootNode?.id == "name-field")
        #expect(tree.scene.navigationState?.selectedIdentifier == "root-modal")
        #expect(tree.scene.tabState?.selectedIdentifier == "name-field")
        #expect(tree.scene.alertPayload?.message == "Saved")
    }

    @Test("runtime app loader lowers strict-mode fixtures into retained snapshots")
    func loaderLowersStrictModeFixture() {
        struct FixtureApp: App {
            var body: some Scene {
                Modal(id: "fixture-modal") {
                    VStack(id: "fixture-stack") {
                        Text("Hello", id: "greeting")
                        Button("Continue", id: "continue-button")
                    }
                }
            }
        }

        let loader = RuntimeAppLoader()
        let snapshot = loader.loadFixture {
            FixtureApp().makeSemanticTree()
        }

        #expect(snapshot.appIdentifier == "FixtureApp")
        #expect(snapshot.lifecycleState == .active)
        #expect(snapshot.revision == 1)
        #expect(snapshot.tree.scene.rootNode?.id == "fixture-modal")
        #expect(snapshot.tree.scene.modalState?.presentedNode?.id == "fixture-modal")
        #expect(snapshot.tree.scene.rootNode?.children.first?.id == "fixture-stack")
    }

    @Test("strict-mode fixture semantic tree stays stable across runtime snapshot queries")
    func fixtureSemanticTreeRegressionCoverage() {
        struct FixtureApp: App {
            var body: some Scene {
                Modal(id: "welcome-modal") {
                    NavigationStack(id: "home-stack") {
                        VStack(id: "content-stack") {
                            Text("Hello from strict mode", id: "headline")
                            HStack(id: "profile-row") {
                                TextField("Name", text: "Taylor", id: "name-field")
                                Button("Save", id: "save-button")
                            }
                            List(id: "items-list") {
                                Text("Messages", id: "favorite-1")
                                Text("Calendar", id: "favorite-2")
                            }
                        }
                    }
                }
            }
        }

        let loader = RuntimeAppLoader()
        let snapshot = loader.loadFixture {
            FixtureApp().makeSemanticTree()
        }
        let retainedSnapshot = RuntimeTreeSnapshot(
            appIdentifier: snapshot.appIdentifier,
            tree: SemanticUITree(
                appIdentifier: snapshot.appIdentifier,
                scene: UITreeScene(
                    id: snapshot.tree.scene.id,
                    kind: snapshot.tree.scene.kind,
                    rootNode: snapshot.tree.scene.rootNode,
                    navigationState: UINavigationState(
                        stackIdentifiers: ["home-stack", "details-screen"],
                        selectedIdentifier: "home-stack"
                    ),
                    modalState: snapshot.tree.scene.modalState,
                    tabState: UITabState(
                        tabIdentifiers: ["home-tab", "profile-tab"],
                        selectedIdentifier: "home-tab"
                    ),
                    alertPayload: UIAlertPayload(
                        title: "Preview Mode",
                        message: "Renderer output is deterministic for this fixed fixture."
                    )
                )
            ),
            lifecycleState: snapshot.lifecycleState,
            revision: snapshot.revision
        )
        var bridge = RuntimeTreeBridge()

        bridge.retain(retainedSnapshot)

        #expect(snapshot.appIdentifier == "FixtureApp")
        #expect(snapshot.tree.scene.id == "welcome-modal")
        #expect(snapshot.tree.scene.kind == .modal)
        #expect(snapshot.tree.scene.rootNode?.id == "welcome-modal")
        #expect(snapshot.tree.scene.rootNode?.children.first?.id == "home-stack")
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.id == "content-stack")
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children.map(\.id.rawValue) == [
            "headline",
            "profile-row",
            "items-list",
        ])
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children[1].children.map(\.id.rawValue) == [
            "name-field",
            "save-button",
        ])
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children[2].children.map(\.id.rawValue) == [
            "favorite-1",
            "favorite-2",
        ])
        #expect(snapshot.tree.scene.modalState?.isPresented == true)
        #expect(snapshot.tree.scene.modalState?.presentedNode?.id == "welcome-modal")
        #expect(snapshot.tree.scene.modalState?.presentedNode?.children.first?.id == "home-stack")
        #expect(retainedSnapshot.tree.scene.navigationState?.stackIdentifiers.map(\.rawValue) == [
            "home-stack",
            "details-screen",
        ])
        #expect(retainedSnapshot.tree.scene.navigationState?.selectedIdentifier?.rawValue == "home-stack")
        #expect(retainedSnapshot.tree.scene.tabState?.tabIdentifiers.map(\.rawValue) == [
            "home-tab",
            "profile-tab",
        ])
        #expect(retainedSnapshot.tree.scene.tabState?.selectedIdentifier?.rawValue == "home-tab")
        #expect(retainedSnapshot.tree.scene.alertPayload?.title == "Preview Mode")
        #expect(retainedSnapshot.tree.scene.alertPayload?.message == "Renderer output is deterministic for this fixed fixture.")
        #expect(bridge.latestRootIdentifier?.rawValue == "welcome-modal")
        #expect(bridge.latestNavigationState?.selectedIdentifier?.rawValue == "home-stack")
        #expect(bridge.latestModalState?.presentedNode?.id.rawValue == "welcome-modal")
        #expect(bridge.latestAlertPayload?.message == "Renderer output is deterministic for this fixed fixture.")
    }

    @Test("runtime tree bridge retains latest snapshot query state")
    func bridgeRetainsSnapshotQueries() {
        let scene = UITreeScene(
            id: "root-modal",
            kind: .modal,
            rootNode: UITreeNode(id: "name-field", role: .textField, label: "Name", value: "Taylor"),
            navigationState: UINavigationState(stackIdentifiers: ["root-modal"], selectedIdentifier: "root-modal"),
            modalState: UIModalState(isPresented: true, presentedNode: UITreeNode(id: "name-field", role: .textField)),
            alertPayload: UIAlertPayload(title: "Notice", message: "Saved")
        )
        let snapshot = RuntimeTreeSnapshot(
            appIdentifier: "FixtureApp",
            tree: SemanticUITree(appIdentifier: "FixtureApp", scene: scene),
            lifecycleState: .active,
            revision: 2
        )
        var bridge = RuntimeTreeBridge()

        bridge.retain(snapshot)

        #expect(bridge.latestAppIdentifier == "FixtureApp")
        #expect(bridge.latestRootIdentifier == "name-field")
        #expect(bridge.lastRenderedTreeIdentifier == "name-field")
        #expect(bridge.latestNavigationState?.selectedIdentifier == "root-modal")
        #expect(bridge.latestModalState?.isPresented == true)
        #expect(bridge.latestAlertPayload?.message == "Saved")
        #expect(bridge.latestSnapshot?.revision == 2)
    }
}
