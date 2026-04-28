import Foundation
import RuntimeHost

public struct SourceLocation: Sendable, Hashable {
    public let file: String
    public let line: Int
    public let column: Int

    public init(file: String, line: Int, column: Int) {
        self.file = file
        self.line = line
        self.column = column
    }
}

public struct SuggestedAdaptation: Sendable, Hashable {
    public let message: String

    public init(message: String) {
        self.message = message
    }
}

public struct UnsupportedImportDiagnostic: Sendable, Hashable {
    public let importName: String
    public let location: SourceLocation
    public let suggestedAdaptation: SuggestedAdaptation?

    public init(
        importName: String,
        location: SourceLocation,
        suggestedAdaptation: SuggestedAdaptation? = nil
    ) {
        self.importName = importName
        self.location = location
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public struct UnsupportedSymbolDiagnostic: Sendable, Hashable {
    public let symbolName: String
    public let location: SourceLocation
    public let suggestedAdaptation: SuggestedAdaptation?

    public init(
        symbolName: String,
        location: SourceLocation,
        suggestedAdaptation: SuggestedAdaptation? = nil
    ) {
        self.symbolName = symbolName
        self.location = location
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public struct UnsupportedModifierDiagnostic: Sendable, Hashable {
    public let modifierName: String
    public let location: SourceLocation
    public let suggestedAdaptation: SuggestedAdaptation?

    public init(
        modifierName: String,
        location: SourceLocation,
        suggestedAdaptation: SuggestedAdaptation? = nil
    ) {
        self.modifierName = modifierName
        self.location = location
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public struct UnsupportedLifecycleHookDiagnostic: Sendable, Hashable {
    public let hookName: String
    public let location: SourceLocation
    public let suggestedAdaptation: SuggestedAdaptation?

    public init(
        hookName: String,
        location: SourceLocation,
        suggestedAdaptation: SuggestedAdaptation? = nil
    ) {
        self.hookName = hookName
        self.location = location
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public struct UnsupportedPlatformAPIDiagnostic: Sendable, Hashable {
    public let apiName: String
    public let location: SourceLocation
    public let suggestedAdaptation: SuggestedAdaptation?

    public init(
        apiName: String,
        location: SourceLocation,
        suggestedAdaptation: SuggestedAdaptation? = nil
    ) {
        self.apiName = apiName
        self.location = location
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public enum CompatibilitySupportLevel: String, Sendable, Hashable {
    case supported
    case partial
    case unsupported
    case deferred
}

public enum CompatibilityDiagnosticCategory: String, Sendable, Hashable {
    case imports
    case symbols
    case modifiers
    case lifecycleHooks
    case platformAPIs
}

public enum CompatibilityDiagnosticSeverity: String, Sendable, Hashable {
    case error
    case warning
    case info
}

public struct CompatibilityMatrix: Sendable, Hashable {
    public struct Entry: Sendable, Hashable {
        public let area: String
        public let supportLevel: CompatibilitySupportLevel
        public let notes: String

        public init(area: String, supportLevel: CompatibilitySupportLevel, notes: String) {
            self.area = area
            self.supportLevel = supportLevel
            self.notes = notes
        }
    }

    public let version: String
    public let entries: [Entry]

    public init(version: String, entries: [Entry]) {
        self.version = version
        self.entries = entries
    }

    public static let v1 = CompatibilityMatrix(
        version: "v1",
        entries: [
            Entry(area: "Imports: SwiftUI", supportLevel: .supported, notes: "Supported entry import for the initial subset."),
            Entry(area: "Layouts: VStack", supportLevel: .partial, notes: "Supported for the first lowering fixture only."),
            Entry(area: "Platform APIs: UIKit", supportLevel: .unsupported, notes: "Apple-only framework imports should produce structured diagnostics."),
            Entry(area: "Lifecycle hooks", supportLevel: .deferred, notes: "Lifecycle behavior remains diagnostics-only in v1."),
        ]
    )
}

public enum CompatibilityDiagnostic: Sendable, Hashable {
    case unsupportedImport(UnsupportedImportDiagnostic)
    case unsupportedSymbol(UnsupportedSymbolDiagnostic)
    case unsupportedModifier(UnsupportedModifierDiagnostic)
    case unsupportedLifecycleHook(UnsupportedLifecycleHookDiagnostic)
    case unsupportedPlatformAPI(UnsupportedPlatformAPIDiagnostic)

    public var category: CompatibilityDiagnosticCategory {
        switch self {
        case .unsupportedImport:
            return .imports
        case .unsupportedSymbol:
            return .symbols
        case .unsupportedModifier:
            return .modifiers
        case .unsupportedLifecycleHook:
            return .lifecycleHooks
        case .unsupportedPlatformAPI:
            return .platformAPIs
        }
    }

    public var severity: CompatibilityDiagnosticSeverity {
        .error
    }

    public var sourceLocation: SourceLocation {
        switch self {
        case let .unsupportedImport(diagnostic):
            return diagnostic.location
        case let .unsupportedSymbol(diagnostic):
            return diagnostic.location
        case let .unsupportedModifier(diagnostic):
            return diagnostic.location
        case let .unsupportedLifecycleHook(diagnostic):
            return diagnostic.location
        case let .unsupportedPlatformAPI(diagnostic):
            return diagnostic.location
        }
    }

    public var suggestedAdaptation: SuggestedAdaptation? {
        switch self {
        case let .unsupportedImport(diagnostic):
            return diagnostic.suggestedAdaptation
        case let .unsupportedSymbol(diagnostic):
            return diagnostic.suggestedAdaptation
        case let .unsupportedModifier(diagnostic):
            return diagnostic.suggestedAdaptation
        case let .unsupportedLifecycleHook(diagnostic):
            return diagnostic.suggestedAdaptation
        case let .unsupportedPlatformAPI(diagnostic):
            return diagnostic.suggestedAdaptation
        }
    }

    public var unsupportedName: String {
        switch self {
        case let .unsupportedImport(diagnostic):
            return diagnostic.importName
        case let .unsupportedSymbol(diagnostic):
            return diagnostic.symbolName
        case let .unsupportedModifier(diagnostic):
            return diagnostic.modifierName
        case let .unsupportedLifecycleHook(diagnostic):
            return diagnostic.hookName
        case let .unsupportedPlatformAPI(diagnostic):
            return diagnostic.apiName
        }
    }

    public var supportLevel: CompatibilitySupportLevel {
        switch self {
        case .unsupportedLifecycleHook, .unsupportedModifier:
            return .deferred
        case .unsupportedImport, .unsupportedSymbol, .unsupportedPlatformAPI:
            return .unsupported
        }
    }
}

public struct CompatibilityReport: Sendable, Hashable {
    public struct Summary: Sendable, Hashable {
        public let totalCount: Int
        public let affectedFileCount: Int
        public let countsByCategory: [CompatibilityDiagnosticCategory: Int]
        public let countsBySeverity: [CompatibilityDiagnosticSeverity: Int]
        public let countsBySupportLevel: [CompatibilitySupportLevel: Int]

        public init(
            totalCount: Int,
            affectedFileCount: Int,
            countsByCategory: [CompatibilityDiagnosticCategory: Int],
            countsBySeverity: [CompatibilityDiagnosticSeverity: Int],
            countsBySupportLevel: [CompatibilitySupportLevel: Int]
        ) {
            self.totalCount = totalCount
            self.affectedFileCount = affectedFileCount
            self.countsByCategory = countsByCategory
            self.countsBySeverity = countsBySeverity
            self.countsBySupportLevel = countsBySupportLevel
        }
    }

    public struct UnsupportedGroup: Sendable, Hashable {
        public let category: CompatibilityDiagnosticCategory
        public let unsupportedNames: [String]
        public let locations: [SourceLocation]
        public let adaptationHints: [SuggestedAdaptation]

        public init(
            category: CompatibilityDiagnosticCategory,
            unsupportedNames: [String],
            locations: [SourceLocation],
            adaptationHints: [SuggestedAdaptation]
        ) {
            self.category = category
            self.unsupportedNames = unsupportedNames
            self.locations = locations
            self.adaptationHints = adaptationHints
        }
    }

    public struct MigrationSummary: Sendable, Hashable {
        public let isMigrationReady: Bool
        public let primaryRecommendation: String
        public let nextActions: [SuggestedAdaptation]

        public init(
            isMigrationReady: Bool,
            primaryRecommendation: String,
            nextActions: [SuggestedAdaptation]
        ) {
            self.isMigrationReady = isMigrationReady
            self.primaryRecommendation = primaryRecommendation
            self.nextActions = nextActions
        }
    }

    public let matrix: CompatibilityMatrix
    public let diagnostics: [CompatibilityDiagnostic]
    public let summary: Summary
    public let unsupportedGroups: [UnsupportedGroup]
    public let migrationSummary: MigrationSummary

    public init(matrix: CompatibilityMatrix, diagnostics: [CompatibilityDiagnostic]) {
        self.matrix = matrix
        self.diagnostics = diagnostics

        let countsByCategory = diagnostics.reduce(into: [CompatibilityDiagnosticCategory: Int]()) {
            $0[$1.category, default: 0] += 1
        }
        let countsBySeverity = diagnostics.reduce(into: [CompatibilityDiagnosticSeverity: Int]()) {
            $0[$1.severity, default: 0] += 1
        }
        let countsBySupportLevel = diagnostics.reduce(into: [CompatibilitySupportLevel: Int]()) {
            $0[$1.supportLevel, default: 0] += 1
        }
        let affectedFiles = Set(diagnostics.map(\.sourceLocation.file))
        let unsupportedGroups = Self.makeUnsupportedGroups(diagnostics: diagnostics)
        self.summary = Summary(
            totalCount: diagnostics.count,
            affectedFileCount: affectedFiles.count,
            countsByCategory: countsByCategory,
            countsBySeverity: countsBySeverity,
            countsBySupportLevel: countsBySupportLevel
        )
        self.unsupportedGroups = unsupportedGroups
        self.migrationSummary = Self.makeMigrationSummary(unsupportedGroups: unsupportedGroups)
    }
}

private extension CompatibilityReport {
    static func makeUnsupportedGroups(diagnostics: [CompatibilityDiagnostic]) -> [UnsupportedGroup] {
        let groupedDiagnostics = Dictionary(grouping: diagnostics, by: \.category)
        var categories: [CompatibilityDiagnosticCategory] = []
        for diagnostic in diagnostics where categories.contains(diagnostic.category) == false {
            categories.append(diagnostic.category)
        }

        return categories.compactMap { category in
            guard let diagnostics = groupedDiagnostics[category], diagnostics.isEmpty == false else {
                return nil
            }

            return UnsupportedGroup(
                category: category,
                unsupportedNames: diagnostics.map(\.unsupportedName),
                locations: diagnostics.map(\.sourceLocation),
                adaptationHints: diagnostics.compactMap(\.suggestedAdaptation)
            )
        }
    }

    static func makeMigrationSummary(unsupportedGroups: [UnsupportedGroup]) -> MigrationSummary {
        MigrationSummary(
            isMigrationReady: unsupportedGroups.isEmpty == false,
            primaryRecommendation: unsupportedGroups.isEmpty
                ? "No unsupported compatibility surfaces were detected."
                : "Replace unsupported Apple-only surfaces with strict-mode SDK primitives before lowering.",
            nextActions: unsupportedGroups.flatMap(\.adaptationHints)
        )
    }
}

public enum CompatibilityFeatureKind: String, Sendable, Hashable {
    case `import`
    case view
    case layout
    case state
}

public struct CompatibilitySupportedFeature: Sendable, Hashable {
    public let kind: CompatibilityFeatureKind
    public let name: String

    public init(kind: CompatibilityFeatureKind, name: String) {
        self.kind = kind
        self.name = name
    }
}

public enum CompatibilityNodeRole: String, Sendable, Hashable {
    case text
    case button
    case vStack
    case modal
}

public struct CompatibilityNode: Sendable, Hashable {
    public let role: CompatibilityNodeRole
    public let children: [CompatibilityNode]

    public init(role: CompatibilityNodeRole, children: [CompatibilityNode] = []) {
        self.role = role
        self.children = children
    }
}

public enum CompatibilitySceneKind: String, Sendable, Hashable {
    case modal
}

public struct CompatibilityScenePreview: Sendable, Hashable {
    public let kind: CompatibilitySceneKind
    public let rootNode: CompatibilityNode

    public init(kind: CompatibilitySceneKind, rootNode: CompatibilityNode) {
        self.kind = kind
        self.rootNode = rootNode
    }
}

public struct CompatibilityLoweringPreview: Sendable, Hashable {
    public let appIdentifier: String
    public let scene: CompatibilityScenePreview

    public init(appIdentifier: String, scene: CompatibilityScenePreview) {
        self.appIdentifier = appIdentifier
        self.scene = scene
    }
}

public struct CompatibilityAnalysis: Sendable, Hashable {
    public let report: CompatibilityReport
    public let supportedFeatures: [CompatibilitySupportedFeature]
    public let loweringPreview: CompatibilityLoweringPreview?
    public let loweredTree: SemanticUITree?

    public init(
        report: CompatibilityReport,
        supportedFeatures: [CompatibilitySupportedFeature],
        loweringPreview: CompatibilityLoweringPreview?,
        loweredTree: SemanticUITree?
    ) {
        self.report = report
        self.supportedFeatures = supportedFeatures
        self.loweringPreview = loweringPreview
        self.loweredTree = loweredTree
    }
}

public struct CompatibilityAnalyzer: Sendable {
    public enum Input: Sendable, Hashable {
        case sourceText(String, file: String)
        case fixturePath(String)
    }

    public let matrix: CompatibilityMatrix

    public init(matrix: CompatibilityMatrix) {
        self.matrix = matrix
    }

    public func analyze(_ input: Input) throws -> CompatibilityAnalysis {
        let resolvedInput = try ResolvedInput(input: input)
        let source = resolvedInput.source
        let lines = source.components(separatedBy: .newlines)
        var diagnostics: [CompatibilityDiagnostic] = []

        diagnostics.append(contentsOf: importDiagnostics(in: lines, file: resolvedInput.file))
        diagnostics.append(contentsOf: symbolDiagnostics(in: lines, file: resolvedInput.file))
        diagnostics.append(contentsOf: lifecycleDiagnostics(in: lines, file: resolvedInput.file))
        diagnostics.append(contentsOf: modifierDiagnostics(in: lines, file: resolvedInput.file))
        diagnostics.append(contentsOf: platformAPIDiagnostics(in: lines, file: resolvedInput.file))

        let supportedFeatures = detectedSupportedFeatures(in: source)
        let loweredTree = makeLoweredTree(
            for: resolvedInput,
            diagnostics: diagnostics,
            supportedFeatures: supportedFeatures
        )
        let loweringPreview = loweredTree.map(makeLoweringPreview)

        return CompatibilityAnalysis(
            report: CompatibilityReport(matrix: matrix, diagnostics: diagnostics),
            supportedFeatures: supportedFeatures,
            loweringPreview: loweringPreview,
            loweredTree: loweredTree
        )
    }
}

private extension CompatibilityAnalyzer {
    struct ResolvedInput {
        let source: String
        let file: String
        let appIdentifier: String

        init(input: CompatibilityAnalyzer.Input) throws {
            switch input {
            case let .sourceText(source, file):
                self.source = source
                self.file = file
                self.appIdentifier = URL(fileURLWithPath: file).deletingPathExtension().lastPathComponent
            case let .fixturePath(path):
                self.source = try String(contentsOfFile: path, encoding: .utf8)
                self.file = path
                self.appIdentifier = URL(fileURLWithPath: path).deletingPathExtension().lastPathComponent
            }
        }
    }

    func importDiagnostics(in lines: [String], file: String) -> [CompatibilityDiagnostic] {
        var diagnostics: [CompatibilityDiagnostic] = []

        for (index, line) in lines.enumerated() {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard trimmed.hasPrefix("import ") else {
                continue
            }

            let importName = String(trimmed.dropFirst("import ".count))
            guard importName == "UIKit" else {
                continue
            }

            diagnostics.append(
                .unsupportedImport(
                    UnsupportedImportDiagnostic(
                        importName: importName,
                        location: SourceLocation(file: file, line: index + 1, column: 8),
                        suggestedAdaptation: SuggestedAdaptation(
                            message: "Replace UIKit imports with StrictModeSDK primitives."
                        )
                    )
                )
            )
        }

        return diagnostics
    }

    func symbolDiagnostics(in lines: [String], file: String) -> [CompatibilityDiagnostic] {
        symbolDiagnostics(
            in: lines,
            file: file,
            symbolName: "UIViewControllerRepresentable",
            message: "Move imperative bridge code behind a strict-mode adapter."
        )
    }

    func symbolDiagnostics(
        in lines: [String],
        file: String,
        symbolName: String,
        message: String
    ) -> [CompatibilityDiagnostic] {
        var diagnostics: [CompatibilityDiagnostic] = []

        for (index, line) in lines.enumerated() where line.contains(symbolName) {
            diagnostics.append(
                .unsupportedSymbol(
                    UnsupportedSymbolDiagnostic(
                        symbolName: symbolName,
                        location: SourceLocation(
                            file: file,
                            line: index + 1,
                            column: column(in: line, matching: symbolName)
                        ),
                        suggestedAdaptation: SuggestedAdaptation(message: message)
                    )
                )
            )
        }

        return diagnostics
    }

    func lifecycleDiagnostics(in lines: [String], file: String) -> [CompatibilityDiagnostic] {
        unsupportedMemberDiagnostics(
            in: lines,
            file: file,
            memberName: ".onAppear",
            lineOffset: 0
        ) { location in
            .unsupportedLifecycleHook(
                UnsupportedLifecycleHookDiagnostic(
                    hookName: "onAppear",
                    location: location,
                    suggestedAdaptation: SuggestedAdaptation(
                        message: "Move onAppear work into an explicit strict-mode runtime lifecycle adapter."
                    )
                )
            )
        }
    }

    func modifierDiagnostics(in lines: [String], file: String) -> [CompatibilityDiagnostic] {
        unsupportedMemberDiagnostics(
            in: lines,
            file: file,
            memberName: ".padding",
            lineOffset: 1
        ) { location in
            .unsupportedModifier(
                UnsupportedModifierDiagnostic(
                    modifierName: "padding",
                    location: location,
                    suggestedAdaptation: SuggestedAdaptation(
                        message: "Replace padding with an explicit strict-mode layout container or spacing metadata."
                    )
                )
            )
        }
    }

    func platformAPIDiagnostics(in lines: [String], file: String) -> [CompatibilityDiagnostic] {
        symbolDiagnostics(
            in: lines,
            file: file,
            symbolName: "UIApplication.shared.open",
            message: "Replace UIApplication usage with strict-mode environment and runtime controls."
        ).map { diagnostic in
            switch diagnostic {
            case let .unsupportedSymbol(symbolDiagnostic):
                return .unsupportedPlatformAPI(
                    UnsupportedPlatformAPIDiagnostic(
                        apiName: symbolDiagnostic.symbolName,
                        location: symbolDiagnostic.location,
                        suggestedAdaptation: symbolDiagnostic.suggestedAdaptation
                    )
                )
            default:
                return diagnostic
            }
        }
    }

    func unsupportedMemberDiagnostics(
        in lines: [String],
        file: String,
        memberName: String,
        lineOffset: Int,
        makeDiagnostic: (SourceLocation) -> CompatibilityDiagnostic
    ) -> [CompatibilityDiagnostic] {
        var diagnostics: [CompatibilityDiagnostic] = []

        for (index, line) in lines.enumerated() where line.contains(memberName) {
            diagnostics.append(
                makeDiagnostic(
                    SourceLocation(
                        file: file,
                        line: index + 1 + lineOffset,
                        column: column(in: line, matching: memberName)
                    )
                )
            )
        }

        return diagnostics
    }

    func detectedSupportedFeatures(in source: String) -> [CompatibilitySupportedFeature] {
        var features: [CompatibilitySupportedFeature] = []

        if source.contains("import SwiftUI") {
            features.append(CompatibilitySupportedFeature(kind: .import, name: "SwiftUI"))
        }
        if source.contains("Text(") {
            features.append(CompatibilitySupportedFeature(kind: .view, name: "Text"))
        }
        if source.contains("VStack") {
            features.append(CompatibilitySupportedFeature(kind: .layout, name: "VStack"))
        }
        if source.contains("Button(") {
            features.append(CompatibilitySupportedFeature(kind: .view, name: "Button"))
        }
        if source.contains("@State") {
            features.append(CompatibilitySupportedFeature(kind: .state, name: "State"))
        }

        return features
    }

    func makeLoweredTree(
        for input: ResolvedInput,
        diagnostics: [CompatibilityDiagnostic],
        supportedFeatures: [CompatibilitySupportedFeature]
    ) -> SemanticUITree? {
        guard diagnostics.isEmpty else {
            return nil
        }

        let featureNames = Set(supportedFeatures.map(\.name))
        let requiredNames: Set<String> = ["SwiftUI", "Text", "VStack", "Button", "State"]
        guard featureNames.isSuperset(of: requiredNames) else {
            return nil
        }

        let rootNode = UITreeNode(
            id: "compatibility-modal",
            role: .modal,
            children: [
                UITreeNode(
                    id: "compatibility-stack",
                    role: .vStack,
                    children: [
                        UITreeNode(id: "compatibility-text", role: .text, label: "Supported subset"),
                        UITreeNode(id: "compatibility-button", role: .button, label: "Tap me"),
                    ]
                ),
            ]
        )

        return SemanticUITree(
            appIdentifier: input.appIdentifier,
            scene: UITreeScene(
                id: rootNode.id,
                kind: .modal,
                rootNode: rootNode,
                modalState: UIModalState(
                    isPresented: true,
                    presentedNode: rootNode
                )
            )
        )
    }

    func makeLoweringPreview(from tree: SemanticUITree) -> CompatibilityLoweringPreview {
        CompatibilityLoweringPreview(
            appIdentifier: tree.appIdentifier,
            scene: CompatibilityScenePreview(
                kind: .modal,
                rootNode: makePreviewNode(from: tree.scene.rootNode)
            )
        )
    }

    func makePreviewNode(from runtimeNode: UITreeNode?) -> CompatibilityNode {
        guard let runtimeNode else {
            return CompatibilityNode(role: .modal)
        }

        return CompatibilityNode(
            role: compatibilityRole(for: runtimeNode.role),
            children: runtimeNode.children.map(makePreviewNode)
        )
    }

    func compatibilityRole(for runtimeRole: UITreeRole) -> CompatibilityNodeRole {
        switch runtimeRole {
        case .text:
            return .text
        case .button:
            return .button
        case .vStack:
            return .vStack
        case .modal:
            return .modal
        default:
            return .modal
        }
    }

    func column(in line: String, matching token: String) -> Int {
        guard let range = line.range(of: token) else {
            return 1
        }

        return line.distance(from: line.startIndex, to: range.lowerBound) + 1
    }
}
