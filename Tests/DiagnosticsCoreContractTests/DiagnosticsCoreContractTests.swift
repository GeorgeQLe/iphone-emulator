import Testing
import DiagnosticsCore
import RuntimeHost

struct DiagnosticsCoreContractTests {
    @Test("diagnostics core public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            UnsupportedImportDiagnostic.self,
            UnsupportedSymbolDiagnostic.self,
            UnsupportedPlatformAPIDiagnostic.self,
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

        #expect(exportedSymbols.count == 15)
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

    @Test("compatibility report exposes migration-ready grouped unsupported APIs")
    func compatibilityReportExposesMigrationReadyGroupedUnsupportedAPIs() {
        let report = CompatibilityReport(
            matrix: .v1,
            diagnostics: [
                .unsupportedImport(
                    UnsupportedImportDiagnostic(
                        importName: "UIKit",
                        location: SourceLocation(file: "LegacyApp.swift", line: 1, column: 8),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace UIKit imports with StrictModeSDK primitives."
                        )
                    )
                ),
                .unsupportedImport(
                    UnsupportedImportDiagnostic(
                        importName: "WebKit",
                        location: SourceLocation(file: "LegacyWebView.swift", line: 1, column: 8),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace WebKit views with strict-mode renderable state and deterministic fixtures."
                        )
                    )
                ),
                .unsupportedSymbol(
                    UnsupportedSymbolDiagnostic(
                        symbolName: "UIViewControllerRepresentable",
                        location: SourceLocation(file: "LegacyBridge.swift", line: 4, column: 20),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Move imperative bridge code behind a strict-mode adapter."
                        )
                    )
                ),
                .unsupportedPlatformAPI(
                    UnsupportedPlatformAPIDiagnostic(
                        apiName: "UIApplication.shared.open",
                        location: SourceLocation(file: "LegacyApp.swift", line: 8, column: 9),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace UIApplication usage with strict-mode environment and runtime controls."
                        )
                    )
                ),
                .unsupportedLifecycleHook(
                    UnsupportedLifecycleHookDiagnostic(
                        hookName: "onAppear",
                        location: SourceLocation(file: "LegacyLifecycle.swift", line: 6, column: 13),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Move onAppear work into an explicit strict-mode runtime lifecycle adapter."
                        )
                    )
                ),
                .unsupportedModifier(
                    UnsupportedModifierDiagnostic(
                        modifierName: "padding",
                        location: SourceLocation(file: "LegacyLifecycle.swift", line: 10, column: 13),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace padding with an explicit strict-mode layout container or spacing metadata."
                        )
                    )
                ),
            ]
        )

        #expect(report.summary.totalCount == 6)
        #expect(report.summary.affectedFileCount == 4)
        #expect(report.summary.countsByCategory == [
            .imports: 2,
            .symbols: 1,
            .platformAPIs: 1,
            .lifecycleHooks: 1,
            .modifiers: 1,
        ])
        #expect(report.summary.countsBySeverity == [.error: 6])
        #expect(report.summary.countsBySupportLevel[.unsupported] == 4)
        #expect(report.summary.countsBySupportLevel[.deferred] == 2)

        #expect(report.unsupportedGroups.map(\.category) == [
            .imports,
            .symbols,
            .platformAPIs,
            .lifecycleHooks,
            .modifiers,
        ])
        #expect(report.unsupportedGroups.map(\.unsupportedNames) == [
            ["UIKit", "WebKit"],
            ["UIViewControllerRepresentable"],
            ["UIApplication.shared.open"],
            ["onAppear"],
            ["padding"],
        ])
        #expect(report.unsupportedGroups.map(\.locations.count) == [2, 1, 1, 1, 1])
        #expect(report.unsupportedGroups.flatMap(\.adaptationHints).map(\.message) == [
            "Replace UIKit imports with StrictModeSDK primitives.",
            "Replace WebKit views with strict-mode renderable state and deterministic fixtures.",
            "Move imperative bridge code behind a strict-mode adapter.",
            "Replace UIApplication usage with strict-mode environment and runtime controls.",
            "Move onAppear work into an explicit strict-mode runtime lifecycle adapter.",
            "Replace padding with an explicit strict-mode layout container or spacing metadata.",
        ])
    }

    @Test("compatibility analyzer report keeps migration output deterministic")
    func compatibilityAnalyzerReportKeepsMigrationOutputDeterministic() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let analysis = try analyzer.analyze(
            .sourceText(
                """
                import SwiftUI
                import UIKit

                struct LegacyScreen: View {
                    var body: some View {
                        VStack {
                            Text("Legacy")
                                .onAppear { UIApplication.shared.open(URL(string: "https://example.com")!) }
                                .padding()
                        }
                    }

                    func makeBridge() -> UIViewControllerRepresentable {
                        fatalError("Not supported")
                    }
                }
                """,
                file: "LegacyScreen.swift"
            )
        )

        #expect(analysis.report.migrationSummary.isMigrationReady == true)
        #expect(analysis.report.migrationSummary.primaryRecommendation == "Replace unsupported Apple-only surfaces with strict-mode SDK primitives before lowering.")
        #expect(analysis.report.unsupportedGroups.map(\.category) == [
            .imports,
            .symbols,
            .lifecycleHooks,
            .modifiers,
            .platformAPIs,
        ])
        #expect(analysis.report.unsupportedGroups.map(\.unsupportedNames) == [
            ["UIKit"],
            ["UIViewControllerRepresentable"],
            ["onAppear"],
            ["padding"],
            ["UIApplication.shared.open"],
        ])
        #expect(analysis.report.migrationSummary.nextActions.map(\.message) == [
            "Replace UIKit imports with StrictModeSDK primitives.",
            "Move imperative bridge code behind a strict-mode adapter.",
            "Move onAppear work into an explicit strict-mode runtime lifecycle adapter.",
            "Replace padding with an explicit strict-mode layout container or spacing metadata.",
            "Replace UIApplication usage with strict-mode environment and runtime controls.",
        ])
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
        #expect(analysis.report.diagnostics.map(\.sourceLocation.column) == [8, 20])
        #expect(analysis.report.summary.countsByCategory[.imports] == 1)
        #expect(analysis.report.summary.countsByCategory[.symbols] == 1)
        #expect(analysis.report.summary.countsBySeverity[.error] == 2)
    }

    @Test("compatibility analyzer reports platform APIs separately from generic unsupported symbols")
    func compatibilityAnalyzerReportsUnsupportedPlatformAPIs() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let analysis = try analyzer.analyze(
            .sourceText(
                """
                import SwiftUI

                struct LegacyApp {
                    func open() {
                        UIApplication.shared.open(URL(string: "https://example.com")!)
                    }
                }
                """,
                file: "LegacyApp.swift"
            )
        )

        #expect(analysis.report.summary.totalCount == 1)
        #expect(analysis.report.diagnostics.map(\.category) == [.platformAPIs])
        #expect(analysis.report.diagnostics.map(\.severity) == [.error])
        #expect(analysis.report.diagnostics.map(\.sourceLocation.line) == [5])
        #expect(analysis.report.diagnostics.map(\.sourceLocation.column) == [9])
        #expect(analysis.report.diagnostics.map(\.suggestedAdaptation?.message) == [
            "Replace UIApplication usage with strict-mode environment and runtime controls."
        ])
    }

    @Test("compatibility analyzer accepts the first supported SwiftUI-inspired subset fixture")
    func compatibilityAnalyzerAcceptsFirstSupportedSubsetFixture() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let analysis = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/SupportedSubsetFixture.swift")
        )

        #expect(analysis.report.summary.totalCount == 0)
        #expect(analysis.report.summary.countsByCategory.isEmpty)
        #expect(analysis.report.summary.countsBySeverity.isEmpty)
        #expect(analysis.supportedFeatures.map(\.kind) == [.import, .view, .layout, .view, .state])
        #expect(analysis.supportedFeatures.map(\.name) == [
            "SwiftUI",
            "Text",
            "VStack",
            "Button",
            "State",
        ])
        #expect(analysis.loweredTree?.appIdentifier == "SupportedSubsetFixture")
        #expect(analysis.loweredTree?.scene.kind == .modal)
        #expect(analysis.loweredTree?.scene.rootNode?.role == .modal)
        #expect(analysis.loweredTree?.scene.rootNode?.children.map(\.role) == [.vStack])
        #expect(analysis.loweredTree?.scene.rootNode?.children.first?.children.map(\.role) == [.text, .button])
        #expect(analysis.loweredTree?.scene.modalState?.isPresented == true)
        #expect(analysis.loweringPreview?.appIdentifier == "SupportedSubsetFixture")
    }

    @Test("compatibility analyzer reports adaptation guidance for unsupported lifecycle hooks and modifiers")
    func compatibilityAnalyzerReportsAdaptationGuidanceForUnsupportedLifecycleHooksAndModifiers() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let analysis = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/UnsupportedLifecycleFixture.swift")
        )

        #expect(analysis.report.summary.totalCount == 2)
        #expect(analysis.report.diagnostics.map(\.category) == [.lifecycleHooks, .modifiers])
        #expect(analysis.report.diagnostics.map(\.sourceLocation.line) == [6, 10])
        #expect(analysis.report.diagnostics.map(\.sourceLocation.column) == [13, 13])
        #expect(analysis.report.summary.countsByCategory[.lifecycleHooks] == 1)
        #expect(analysis.report.summary.countsByCategory[.modifiers] == 1)
        #expect(analysis.report.diagnostics.allSatisfy { $0.suggestedAdaptation != nil })
        #expect(analysis.report.diagnostics.map(\.suggestedAdaptation?.message) == [
            "Move onAppear work into an explicit strict-mode runtime lifecycle adapter.",
            "Replace padding with an explicit strict-mode layout container or spacing metadata.",
        ])
        #expect(analysis.loweredTree == nil)
    }

    @Test("compatibility fixtures keep regression summaries and ordering stable")
    func compatibilityFixturesKeepRegressionSummariesStable() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)

        let supported = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/SupportedSubsetFixture.swift")
        )
        let unsupportedImports = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/UnsupportedImportsFixture.swift")
        )
        let unsupportedLifecycle = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/UnsupportedLifecycleFixture.swift")
        )

        #expect(supported.report.diagnostics.isEmpty)
        #expect(supported.supportedFeatures.map(\.name) == ["SwiftUI", "Text", "VStack", "Button", "State"])
        #expect(supported.loweringPreview?.scene.rootNode.children.map(\.role) == [.vStack])

        #expect(unsupportedImports.report.diagnostics.map(\.category) == [.imports])
        #expect(unsupportedImports.report.diagnostics.map(\.sourceLocation.file) == [
            "tests/fixtures/compatibility/UnsupportedImportsFixture.swift"
        ])
        #expect(unsupportedImports.report.diagnostics.map(\.sourceLocation.line) == [2])
        #expect(unsupportedImports.report.diagnostics.map(\.sourceLocation.column) == [8])

        #expect(unsupportedLifecycle.report.diagnostics.map(\.category) == [.lifecycleHooks, .modifiers])
        #expect(unsupportedLifecycle.report.diagnostics.map(\.sourceLocation.file) == [
            "tests/fixtures/compatibility/UnsupportedLifecycleFixture.swift",
            "tests/fixtures/compatibility/UnsupportedLifecycleFixture.swift",
        ])
        #expect(unsupportedLifecycle.report.summary.countsByCategory == [
            .lifecycleHooks: 1,
            .modifiers: 1,
        ])
    }
}
