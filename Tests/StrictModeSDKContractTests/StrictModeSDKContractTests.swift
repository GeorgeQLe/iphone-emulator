import Testing
import StrictModeSDK

struct StrictModeSDKContractTests {
    @Test("strict mode public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            App.self,
            Scene.self,
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
        ]

        #expect(exportedSymbols.count == 13)
    }
}
