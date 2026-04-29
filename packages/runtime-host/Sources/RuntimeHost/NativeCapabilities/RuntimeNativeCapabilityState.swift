import Foundation

public struct RuntimeNativeCapabilityState: Hashable, Codable, Sendable {
    public var permissions: [RuntimeNativePermissionRecord]
    public var fixtureOutputs: [RuntimeNativeFixtureOutputRecord]
    public var scriptedEvents: [RuntimeNativeCapabilityEventRecord]
    public var clipboard: RuntimeNativeClipboardState?
    public var keyboard: RuntimeNativeKeyboardState?
    public var fileSelections: [RuntimeNativeFileSelectionRecord]
    public var shareSheetRecords: [RuntimeNativeShareSheetRecord]
    public var notificationRecords: [RuntimeNativeNotificationRecord]
    public var artifactRecords: [RuntimeNativeCapabilityArtifactRecord]

    public init(
        permissions: [RuntimeNativePermissionRecord] = [],
        fixtureOutputs: [RuntimeNativeFixtureOutputRecord] = [],
        scriptedEvents: [RuntimeNativeCapabilityEventRecord] = [],
        clipboard: RuntimeNativeClipboardState? = nil,
        keyboard: RuntimeNativeKeyboardState? = nil,
        fileSelections: [RuntimeNativeFileSelectionRecord] = [],
        shareSheetRecords: [RuntimeNativeShareSheetRecord] = [],
        notificationRecords: [RuntimeNativeNotificationRecord] = [],
        artifactRecords: [RuntimeNativeCapabilityArtifactRecord] = []
    ) {
        self.permissions = permissions
        self.fixtureOutputs = fixtureOutputs
        self.scriptedEvents = scriptedEvents
        self.clipboard = clipboard
        self.keyboard = keyboard
        self.fileSelections = fileSelections
        self.shareSheetRecords = shareSheetRecords
        self.notificationRecords = notificationRecords
        self.artifactRecords = artifactRecords
    }

    public init(manifest: RuntimeNativeCapabilityManifest) {
        let permissionRecords = manifest.requiredCapabilities.map { requirement in
            RuntimeNativePermissionRecord(
                capability: requirement.id,
                state: requirement.permissionState,
                promptResult: Self.promptResult(
                    for: requirement.id,
                    in: manifest.configuredMocks
                ),
                strictModeAlternative: requirement.strictModeAlternative
            )
        }
        let fixtureRecords = manifest.configuredMocks.map(RuntimeNativeFixtureOutputRecord.init(mock:))
        let eventRecords = manifest.scriptedEvents.map(RuntimeNativeCapabilityEventRecord.init(event:))

        self.init(
            permissions: permissionRecords,
            fixtureOutputs: fixtureRecords,
            scriptedEvents: eventRecords,
            clipboard: manifest.configuredMocks
                .first { $0.capability == .clipboard }
                .map(RuntimeNativeClipboardState.init(mock:)),
            keyboard: manifest.configuredMocks
                .first { $0.capability == .keyboardInput }
                .map(RuntimeNativeKeyboardState.init(mock:)),
            fileSelections: manifest.configuredMocks
                .filter { $0.capability == .files }
                .map(RuntimeNativeFileSelectionRecord.init(mock:)),
            shareSheetRecords: manifest.configuredMocks
                .filter { $0.capability == .shareSheet }
                .map(RuntimeNativeShareSheetRecord.init(mock:)),
            notificationRecords: eventRecords
                .filter { $0.capability == .notifications }
                .map(RuntimeNativeNotificationRecord.init(event:)),
            artifactRecords: manifest.artifactOutputs.map(RuntimeNativeCapabilityArtifactRecord.init(output:))
        )
    }

    public var logMessages: [String] {
        permissions.map { "native.permission.\($0.capability.rawValue).\($0.state.rawValue)" }
            + fixtureOutputs.map { "native.fixture.\($0.capability.rawValue).\($0.identifier)" }
            + scriptedEvents.map { "native.event.\($0.capability.rawValue).\($0.name)" }
    }

    public var semanticMetadata: [String: String] {
        var metadata: [String: String] = [:]

        if let cameraFixture = fixtureOutputs.first(where: { $0.capability == .camera })?.fixtureName {
            metadata["native.camera.fixture"] = cameraFixture
        }

        if let focusedElementID = keyboard?.focusedElementID {
            metadata["native.keyboard.focusedElementID"] = focusedElementID
        }

        for notificationRecord in notificationRecords where !notificationRecord.identifier.isEmpty {
            metadata["native.notification.\(notificationRecord.identifier)"] = notificationRecord.state
        }

        return metadata
    }

    private static func promptResult(
        for capability: RuntimeNativeCapabilityID,
        in mocks: [RuntimeNativeCapabilityMock]
    ) -> RuntimeNativePermissionState? {
        guard let result = mocks.first(where: { $0.capability == capability })?.payload["result"] else {
            return nil
        }
        return RuntimeNativePermissionState(rawValue: result)
    }
}

public struct RuntimeNativePermissionRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var state: RuntimeNativePermissionState
    public var promptResult: RuntimeNativePermissionState?
    public var strictModeAlternative: String

    public init(
        capability: RuntimeNativeCapabilityID,
        state: RuntimeNativePermissionState,
        promptResult: RuntimeNativePermissionState? = nil,
        strictModeAlternative: String
    ) {
        self.capability = capability
        self.state = state
        self.promptResult = promptResult
        self.strictModeAlternative = strictModeAlternative
    }
}

public struct RuntimeNativeFixtureOutputRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var identifier: String
    public var fixtureName: String?
    public var payload: [String: String]

    public init(
        capability: RuntimeNativeCapabilityID,
        identifier: String,
        fixtureName: String? = nil,
        payload: [String: String] = [:]
    ) {
        self.capability = capability
        self.identifier = identifier
        self.fixtureName = fixtureName
        self.payload = payload
    }

    public init(mock: RuntimeNativeCapabilityMock) {
        self.init(
            capability: mock.capability,
            identifier: mock.identifier,
            fixtureName: mock.payload["fixtureName"],
            payload: mock.payload
        )
    }
}

public struct RuntimeNativeCapabilityEventRecord: Hashable, Codable, Sendable {
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

    public init(event: RuntimeNativeCapabilityEvent) {
        self.init(
            capability: event.capability,
            name: event.name,
            atRevision: event.atRevision,
            payload: event.payload
        )
    }
}

public struct RuntimeNativeClipboardState: Hashable, Codable, Sendable {
    public var identifier: String
    public var text: String?
    public var payload: [String: String]

    public init(
        identifier: String,
        text: String? = nil,
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.text = text
        self.payload = payload
    }

    public init(mock: RuntimeNativeCapabilityMock) {
        self.init(
            identifier: mock.identifier,
            text: mock.payload["text"],
            payload: mock.payload
        )
    }
}

public struct RuntimeNativeKeyboardState: Hashable, Codable, Sendable {
    public var identifier: String
    public var focusedElementID: String?
    public var keyboardType: String?
    public var returnKey: String?
    public var payload: [String: String]

    public init(
        identifier: String,
        focusedElementID: String? = nil,
        keyboardType: String? = nil,
        returnKey: String? = nil,
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.focusedElementID = focusedElementID
        self.keyboardType = keyboardType
        self.returnKey = returnKey
        self.payload = payload
    }

    public init(mock: RuntimeNativeCapabilityMock) {
        self.init(
            identifier: mock.identifier,
            focusedElementID: mock.payload["focusedElementID"],
            keyboardType: mock.payload["keyboardType"],
            returnKey: mock.payload["returnKey"],
            payload: mock.payload
        )
    }
}

public struct RuntimeNativeFileSelectionRecord: Hashable, Codable, Sendable {
    public var identifier: String
    public var selectedFiles: [String]
    public var payload: [String: String]

    public init(
        identifier: String,
        selectedFiles: [String] = [],
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.selectedFiles = selectedFiles
        self.payload = payload
    }

    public init(mock: RuntimeNativeCapabilityMock) {
        self.init(
            identifier: mock.identifier,
            selectedFiles: Self.commaSeparatedValues(mock.payload["selectedFiles"]),
            payload: mock.payload
        )
    }

    private static func commaSeparatedValues(_ value: String?) -> [String] {
        value?
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty } ?? []
    }
}

public struct RuntimeNativeShareSheetRecord: Hashable, Codable, Sendable {
    public var identifier: String
    public var activityType: String?
    public var items: [String]
    public var payload: [String: String]

    public init(
        identifier: String,
        activityType: String? = nil,
        items: [String] = [],
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.activityType = activityType
        self.items = items
        self.payload = payload
    }

    public init(mock: RuntimeNativeCapabilityMock) {
        self.init(
            identifier: mock.identifier,
            activityType: mock.payload["activityType"],
            items: Self.commaSeparatedValues(mock.payload["items"]),
            payload: mock.payload
        )
    }

    private static func commaSeparatedValues(_ value: String?) -> [String] {
        value?
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty } ?? []
    }
}

public struct RuntimeNativeNotificationRecord: Hashable, Codable, Sendable {
    public var identifier: String
    public var state: String
    public var title: String?
    public var atRevision: Int
    public var payload: [String: String]

    public init(
        identifier: String,
        state: String,
        title: String? = nil,
        atRevision: Int,
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.state = state
        self.title = title
        self.atRevision = atRevision
        self.payload = payload
    }

    public init(event: RuntimeNativeCapabilityEventRecord) {
        self.init(
            identifier: event.payload["identifier"] ?? event.name,
            state: Self.state(from: event.name),
            title: event.payload["title"],
            atRevision: event.atRevision,
            payload: event.payload
        )
    }

    private static func state(from eventName: String) -> String {
        eventName
            .replacingOccurrences(of: "notification-", with: "")
            .replacingOccurrences(of: "-notification", with: "")
    }
}

public struct RuntimeNativeCapabilityArtifactRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var name: String
    public var kind: RuntimeNativeCapabilityArtifactOutput.Kind
    public var payload: [String: String]

    public init(
        capability: RuntimeNativeCapabilityID,
        name: String,
        kind: RuntimeNativeCapabilityArtifactOutput.Kind,
        payload: [String: String] = [:]
    ) {
        self.capability = capability
        self.name = name
        self.kind = kind
        self.payload = payload
    }

    public init(output: RuntimeNativeCapabilityArtifactOutput) {
        self.init(
            capability: output.capability,
            name: output.name,
            kind: output.kind,
            payload: [
                "capability": output.capability.rawValue,
                "kind": output.kind.rawValue,
            ]
        )
    }
}
