public struct RuntimeNativeCapabilityManifest: Hashable, Codable, Sendable {
    public var requiredCapabilities: [RuntimeNativeCapabilityRequirement]
    public var configuredMocks: [RuntimeNativeCapabilityMock]
    public var scriptedEvents: [RuntimeNativeCapabilityEvent]
    public var unsupportedSymbols: [RuntimeNativeUnsupportedSymbol]
    public var artifactOutputs: [RuntimeNativeCapabilityArtifactOutput]

    public init(
        requiredCapabilities: [RuntimeNativeCapabilityRequirement] = [],
        configuredMocks: [RuntimeNativeCapabilityMock] = [],
        scriptedEvents: [RuntimeNativeCapabilityEvent] = [],
        unsupportedSymbols: [RuntimeNativeUnsupportedSymbol] = [],
        artifactOutputs: [RuntimeNativeCapabilityArtifactOutput] = []
    ) {
        self.requiredCapabilities = requiredCapabilities
        self.configuredMocks = configuredMocks
        self.scriptedEvents = scriptedEvents
        self.unsupportedSymbols = unsupportedSymbols
        self.artifactOutputs = artifactOutputs
    }

    public func permissionState(for capability: RuntimeNativeCapabilityID) -> RuntimeNativePermissionState {
        requiredCapabilities.first { $0.id == capability }?.permissionState ?? .unsupported
    }
}

public enum RuntimeNativeCapabilityID: String, Hashable, Codable, Sendable {
    case permissions
    case camera
    case photos
    case location
    case network
    case clipboard
    case keyboardInput
    case files
    case shareSheet
    case notifications
    case deviceEnvironment
    case sensors
    case haptics
    case unsupported
}

public enum RuntimeNativePermissionState: String, Hashable, Codable, Sendable {
    case unsupported
    case notRequested
    case prompt
    case granted
    case denied
    case restricted
}

public struct RuntimeNativeCapabilityRequirement: Hashable, Codable, Sendable {
    public var id: RuntimeNativeCapabilityID
    public var permissionState: RuntimeNativePermissionState
    public var strictModeAlternative: String

    public init(
        id: RuntimeNativeCapabilityID,
        permissionState: RuntimeNativePermissionState = .unsupported,
        strictModeAlternative: String
    ) {
        self.id = id
        self.permissionState = permissionState
        self.strictModeAlternative = strictModeAlternative
    }
}

public struct RuntimeNativeCapabilityMock: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var identifier: String
    public var payload: [String: String]

    public init(
        capability: RuntimeNativeCapabilityID,
        identifier: String,
        payload: [String: String] = [:]
    ) {
        self.capability = capability
        self.identifier = identifier
        self.payload = payload
    }
}

public struct RuntimeNativeCapabilityEvent: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var name: String
    public var atRevision: Int
    public var payload: [String: String]

    public init(
        capability: RuntimeNativeCapabilityID,
        name: String,
        atRevision: Int,
        payload: [String: String] = [:]
    ) {
        self.capability = capability
        self.name = name
        self.atRevision = atRevision
        self.payload = payload
    }
}

public struct RuntimeNativeUnsupportedSymbol: Hashable, Codable, Sendable {
    public var symbolName: String
    public var capability: RuntimeNativeCapabilityID
    public var suggestedAdaptation: String

    public init(
        symbolName: String,
        capability: RuntimeNativeCapabilityID,
        suggestedAdaptation: String
    ) {
        self.symbolName = symbolName
        self.capability = capability
        self.suggestedAdaptation = suggestedAdaptation
    }
}

public struct RuntimeNativeCapabilityArtifactOutput: Hashable, Codable, Sendable {
    public enum Kind: String, Hashable, Codable, Sendable {
        case fixtureReference
        case eventLog
        case diagnostic
        case semanticSnapshot
    }

    public var capability: RuntimeNativeCapabilityID
    public var name: String
    public var kind: Kind

    public init(
        capability: RuntimeNativeCapabilityID,
        name: String,
        kind: Kind
    ) {
        self.capability = capability
        self.name = name
        self.kind = kind
    }
}
