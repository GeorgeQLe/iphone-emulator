import Testing
import DiagnosticsCore

struct DiagnosticsCoreContractTests {
    @Test("diagnostics core public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            UnsupportedImportDiagnostic.self,
            UnsupportedSymbolDiagnostic.self,
            SuggestedAdaptation.self,
            SourceLocation.self,
        ]

        #expect(exportedSymbols.count == 4)
    }
}
