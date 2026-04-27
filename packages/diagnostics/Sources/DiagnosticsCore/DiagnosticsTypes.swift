public struct SourceLocation: Sendable {
    public let file: String
    public let line: Int
    public let column: Int

    public init(file: String, line: Int, column: Int) {
        self.file = file
        self.line = line
        self.column = column
    }
}

public struct SuggestedAdaptation: Sendable {
    public let message: String

    public init(message: String) {
        self.message = message
    }
}

public struct UnsupportedImportDiagnostic: Sendable {
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

public struct UnsupportedSymbolDiagnostic: Sendable {
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
