import Testing
import RuntimeHost
import StrictModeSDK

struct StrictModeSDKContractTests {
    @Test("strict mode public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            (any App).self,
            (any Scene).self,
            Text.self,
            Button.self,
            TextField.self,
            List.self,
            VStack.self,
            HStack.self,
            NavigationStack.self,
            Modal.self,
            TabView.self,
            Alert.self,
            State.self,
            AnyView.self,
        ]

        #expect(exportedSymbols.count == 14)
    }

    @Test("strict mode lowers semantic tree for modal content")
    func lowersSemanticTree() {
        struct ContractApp: App {
            var body: some Scene {
                Modal {
                    VStack {
                        Text("Hello")
                        Button("Continue")
                        TextField("Name", text: "Taylor")
                    }
                }
            }
        }

        let tree = ContractApp().makeSemanticTree()

        #expect(tree.appIdentifier == "ContractApp")
        #expect(tree.scene.kind == .modal)
        #expect(tree.scene.rootNode?.role == .modal)
        #expect(tree.scene.rootNode?.children.count == 1)
        #expect(tree.scene.rootNode?.children.first?.role == .vStack)
        #expect(tree.scene.rootNode?.children.first?.children.map(\.role) == [.text, .button, .textField])
        #expect(tree.scene.modalState?.isPresented == true)
        #expect(tree.scene.modalState?.presentedNode?.id == tree.scene.rootNode?.id)
    }
}
