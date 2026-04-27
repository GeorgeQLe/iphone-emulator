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
