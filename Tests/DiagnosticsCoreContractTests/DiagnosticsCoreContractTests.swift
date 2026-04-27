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
            CompatibilityMatrix.self,
            CompatibilityMatrix.Entry.self,
            CompatibilitySupportLevel.self,
            CompatibilityDiagnosticCategory.self,
            CompatibilityDiagnosticSeverity.self,
            CompatibilityReport.self,
            CompatibilityReport.Summary.self,
            CompatibilityAnalyzer.self,
            CompatibilityAnalyzer.Input.self,
            CompatibilityAnalysis.self,
        ]

        #expect(exportedSymbols.count == 14)
    }

    @Test("compatibility matrix exposes explicit support levels")
    func compatibilityMatrixExposesExplicitSupportLevels() {
        let matrix = CompatibilityMatrix.v1

        #expect(matrix.version == "v1")
        #expect(matrix.entries.isEmpty == false)
        #expect(matrix.entries.contains { $0.supportLevel == .supported })
        #expect(matrix.entries.contains { $0.supportLevel == .partial })
        #expect(matrix.entries.contains { $0.supportLevel == .unsupported })
        #expect(matrix.entries.contains { $0.supportLevel == .deferred })
    }

    @Test("compatibility report summarizes diagnostics by category and severity")
    func compatibilityReportSummarizesDiagnosticsByCategoryAndSeverity() {
        let report = CompatibilityReport(
            matrix: .v1,
            diagnostics: [
                .unsupportedImport(
                    UnsupportedImportDiagnostic(
                        importName: "UIKit",
                        location: SourceLocation(file: "Fixture.swift", line: 1, column: 8),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace UIKit imports with StrictModeSDK primitives."
                        )
                    )
                ),
                .unsupportedSymbol(
                    UnsupportedSymbolDiagnostic(
                        symbolName: "UIViewControllerRepresentable",
                        location: SourceLocation(file: "Fixture.swift", line: 3, column: 1),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Move imperative bridge code behind a strict-mode adapter."
                        )
                    )
                ),
            ]
        )

        #expect(report.summary.totalCount == 2)
        #expect(report.summary.countsByCategory[.imports] == 1)
        #expect(report.summary.countsByCategory[.symbols] == 1)
        #expect(report.summary.countsBySeverity[.error] == 2)
    }

    @Test("compatibility analyzer accepts source text and fixture paths")
    func compatibilityAnalyzerAcceptsSourceTextAndFixturePaths() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let sourceTextResult = try analyzer.analyze(
            .sourceText(
                """
                import SwiftUI
                import UIKit

                struct LegacyView: View {
                    var body: some View {
                        Text("Hello")
                    }
                }
                """,
                file: "InlineFixture.swift"
            )
        )
        let fixturePathResult = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/UnsupportedImportsFixture.swift")
        )

        #expect(sourceTextResult.report.summary.totalCount >= 1)
        #expect(sourceTextResult.report.diagnostics.contains { diagnostic in
            diagnostic.category == .imports && diagnostic.sourceLocation.file == "InlineFixture.swift"
        })
        #expect(fixturePathResult.report.diagnostics.contains { diagnostic in
            diagnostic.category == .imports
                && diagnostic.sourceLocation.file.contains("UnsupportedImportsFixture.swift")
        })
    }

    @Test("compatibility analyzer reports structured unsupported imports and symbols")
    func compatibilityAnalyzerReportsStructuredUnsupportedImportsAndSymbols() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let analysis = try analyzer.analyze(
            .sourceText(
                """
                import UIKit

                struct LegacyBridge {
                    func make() -> UIViewControllerRepresentable {
                        fatalError("Not supported")
                    }
                }
                """,
                file: "LegacyBridge.swift"
            )
        )

        #expect(analysis.report.summary.totalCount == 2)
        #expect(analysis.report.diagnostics.map(\.category) == [.imports, .symbols])
        #expect(analysis.report.diagnostics.map(\.severity) == [.error, .error])
        #expect(analysis.report.diagnostics.map(\.sourceLocation.line) == [1, 4])
    }
}
