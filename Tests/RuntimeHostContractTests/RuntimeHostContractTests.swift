import Testing
import RuntimeHost

struct RuntimeHostContractTests {
    @Test("runtime host public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            RuntimeAppLifecycle.self,
            RuntimeAppLoader.self,
            RuntimeTreeBridge.self,
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

        #expect(exportedSymbols.count == 13)
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
}
