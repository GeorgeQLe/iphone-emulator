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
        ]

        #expect(exportedSymbols.count == 5)
    }
}
