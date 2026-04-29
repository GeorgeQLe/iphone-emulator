import Foundation

public struct RuntimeNativeCapabilityState: Hashable, Codable, Sendable {
    public var permissions: [RuntimeNativePermissionRecord]
    public var permissionPrompts: [RuntimeNativePermissionPromptRecord]
    public var fixtureOutputs: [RuntimeNativeFixtureOutputRecord]
    public var cameraCaptures: [RuntimeNativeCameraCaptureRecord]
    public var photoSelections: [RuntimeNativePhotoSelectionRecord]
    public var scriptedEvents: [RuntimeNativeCapabilityEventRecord]
    public var location: RuntimeNativeLocationState?
    public var clipboard: RuntimeNativeClipboardState?
    public var keyboard: RuntimeNativeKeyboardState?
    public var fileSelections: [RuntimeNativeFileSelectionRecord]
    public var shareSheetRecords: [RuntimeNativeShareSheetRecord]
    public var notificationRecords: [RuntimeNativeNotificationRecord]
    public var diagnosticRecords: [RuntimeNativeCapabilityDiagnosticRecord]
    public var artifactRecords: [RuntimeNativeCapabilityArtifactRecord]

    public init(
        permissions: [RuntimeNativePermissionRecord] = [],
        permissionPrompts: [RuntimeNativePermissionPromptRecord] = [],
        fixtureOutputs: [RuntimeNativeFixtureOutputRecord] = [],
        cameraCaptures: [RuntimeNativeCameraCaptureRecord] = [],
        photoSelections: [RuntimeNativePhotoSelectionRecord] = [],
        scriptedEvents: [RuntimeNativeCapabilityEventRecord] = [],
        location: RuntimeNativeLocationState? = nil,
        clipboard: RuntimeNativeClipboardState? = nil,
        keyboard: RuntimeNativeKeyboardState? = nil,
        fileSelections: [RuntimeNativeFileSelectionRecord] = [],
        shareSheetRecords: [RuntimeNativeShareSheetRecord] = [],
        notificationRecords: [RuntimeNativeNotificationRecord] = [],
        diagnosticRecords: [RuntimeNativeCapabilityDiagnosticRecord] = [],
        artifactRecords: [RuntimeNativeCapabilityArtifactRecord] = []
    ) {
        self.permissions = permissions
        self.permissionPrompts = permissionPrompts
        self.fixtureOutputs = fixtureOutputs
        self.cameraCaptures = cameraCaptures
        self.photoSelections = photoSelections
        self.scriptedEvents = scriptedEvents
        self.location = location
        self.clipboard = clipboard
        self.keyboard = keyboard
        self.fileSelections = fileSelections
        self.shareSheetRecords = shareSheetRecords
        self.notificationRecords = notificationRecords
        self.diagnosticRecords = diagnosticRecords
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
        let permissionPrompts = permissionRecords.compactMap { permission in
            RuntimeNativePermissionPromptRecord(
                permission: permission,
                mock: manifest.configuredMocks.first { $0.capability == permission.capability }
            )
        }
        let cameraCaptures = manifest.configuredMocks
            .filter { $0.capability == .camera }
            .compactMap {
                RuntimeNativeCameraCaptureRecord(
                    mock: $0,
                    permissionState: Self.resolvedState(for: .camera, in: permissionRecords)
                )
            }
        let photoSelections = manifest.configuredMocks
            .filter { $0.capability == .photos }
            .compactMap {
                RuntimeNativePhotoSelectionRecord(
                    mock: $0,
                    permissionState: Self.resolvedState(for: .photos, in: permissionRecords)
                )
            }
        let locationState = RuntimeNativeLocationState(
            permissionState: Self.resolvedState(for: .location, in: permissionRecords),
            mocks: manifest.configuredMocks.filter { $0.capability == .location },
            events: eventRecords.filter { $0.capability == .location }
        )
        let diagnosticRecords = Self.diagnosticRecords(
            manifest: manifest,
            permissions: permissionRecords
        )
        let artifactRecords = manifest.artifactOutputs.map(RuntimeNativeCapabilityArtifactRecord.init(output:))
            + cameraCaptures.map(\.artifactRecord)
            + photoSelections.map(\.artifactRecord)
            + (locationState?.artifactRecords ?? [])
            + diagnosticRecords.map(\.artifactRecord)

        self.init(
            permissions: permissionRecords,
            permissionPrompts: permissionPrompts,
            fixtureOutputs: fixtureRecords,
            cameraCaptures: cameraCaptures,
            photoSelections: photoSelections,
            scriptedEvents: eventRecords,
            location: locationState,
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
            diagnosticRecords: diagnosticRecords,
            artifactRecords: artifactRecords
        )
    }

    public var logMessages: [String] {
        let permissionLogs = permissions.map {
            "native.permission.\($0.capability.rawValue).\($0.state.rawValue)"
        }
        let promptLogs = permissionPrompts.map {
            "native.permission.\($0.capability.rawValue).prompt.\($0.finalState.rawValue)"
        }
        let fixtureLogs = fixtureOutputs.map {
            "native.fixture.\($0.capability.rawValue).\($0.identifier)"
        }
        let cameraLogs = cameraCaptures.map {
            "native.camera.capture.\($0.identifier)"
        }
        let photoLogs = photoSelections.map {
            "native.photos.selection.\($0.identifier)"
        }
        let eventLogs = scriptedEvents.map {
            "native.event.\($0.capability.rawValue).\($0.name)"
        }
        let diagnosticLogs = diagnosticRecords.map {
            "native.diagnostic.\($0.capability.rawValue).\($0.code)"
        }

        var logs: [String] = []
        logs.append(contentsOf: permissionLogs)
        logs.append(contentsOf: promptLogs)
        logs.append(contentsOf: fixtureLogs)
        logs.append(contentsOf: cameraLogs)
        logs.append(contentsOf: photoLogs)
        logs.append(contentsOf: eventLogs)
        logs.append(contentsOf: location?.logMessages ?? [])
        logs.append(contentsOf: diagnosticLogs)
        return logs
    }

    public var semanticMetadata: [String: String] {
        var metadata: [String: String] = [:]

        for permission in permissions {
            metadata["native.permission.\(permission.capability.rawValue).state"] = permission.resolvedState.rawValue
        }

        if let cameraFixture = cameraCaptures.first?.fixtureName
            ?? fixtureOutputs.first(where: { $0.capability == .camera })?.fixtureName {
            metadata["native.camera.fixture"] = cameraFixture
        }

        for cameraCapture in cameraCaptures {
            metadata["native.camera.capture.\(cameraCapture.identifier)"] = cameraCapture.fixtureName
        }

        if let photoFixture = photoSelections.first?.fixtureName {
            metadata["native.photos.fixture"] = photoFixture
        }

        for photoSelection in photoSelections {
            metadata["native.photos.selection.\(photoSelection.identifier)"] = photoSelection.assetIdentifiers.joined(separator: ",")
        }

        if let coordinate = location?.currentCoordinate {
            metadata["native.location.latitude"] = coordinate.latitudeText
            metadata["native.location.longitude"] = coordinate.longitudeText
            metadata["native.location.accuracyMeters"] = coordinate.accuracyMetersText
        }

        if let focusedElementID = keyboard?.focusedElementID {
            metadata["native.keyboard.focusedElementID"] = focusedElementID
        }

        for notificationRecord in notificationRecords where !notificationRecord.identifier.isEmpty {
            metadata["native.notification.\(notificationRecord.identifier)"] = notificationRecord.state
        }

        return metadata
    }

    private static func resolvedState(
        for capability: RuntimeNativeCapabilityID,
        in permissions: [RuntimeNativePermissionRecord]
    ) -> RuntimeNativePermissionState {
        permissions.first { $0.capability == capability }?.resolvedState ?? .unsupported
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

    private static func diagnosticRecords(
        manifest: RuntimeNativeCapabilityManifest,
        permissions: [RuntimeNativePermissionRecord]
    ) -> [RuntimeNativeCapabilityDiagnosticRecord] {
        var records = manifest.unsupportedSymbols.map(RuntimeNativeCapabilityDiagnosticRecord.init(symbol:))

        for permission in permissions where permission.state == .prompt && permission.promptResult == nil {
            records.append(
                RuntimeNativeCapabilityDiagnosticRecord(
                    capability: permission.capability,
                    code: "missingPromptResult",
                    message: "Permission prompt for \(permission.capability.rawValue) has no deterministic result.",
                    suggestedAdaptation: permission.strictModeAlternative,
                    payload: [
                        "capability": permission.capability.rawValue,
                        "permissionState": permission.state.rawValue,
                    ]
                )
            )
        }

        for capability in [RuntimeNativeCapabilityID.camera, .photos] {
            let requiresFixture = permissions.contains {
                $0.capability == capability && $0.resolvedState == .granted
            }
            let matchingMocks = manifest.configuredMocks.filter { $0.capability == capability }
            let hasFixture = matchingMocks.contains { !$0.fixtureNameForNativeMock.isEmpty }

            if requiresFixture && !hasFixture {
                let requirement = manifest.requiredCapabilities.first { $0.id == capability }
                records.append(
                    RuntimeNativeCapabilityDiagnosticRecord(
                        capability: capability,
                        code: "missingFixture",
                        message: "Granted \(capability.rawValue) mock has no fixture-backed output.",
                        suggestedAdaptation: requirement?.strictModeAlternative
                            ?? "Configure a deterministic \(capability.rawValue) fixture in the native capability manifest.",
                        payload: [
                            "capability": capability.rawValue,
                            "configuredMockCount": "\(matchingMocks.count)",
                        ]
                    )
                )
            }

            for mock in matchingMocks where mock.fixtureNameForNativeMock.isEmpty {
                records.append(
                    RuntimeNativeCapabilityDiagnosticRecord(
                        capability: capability,
                        code: "missingFixture",
                        message: "Configured \(capability.rawValue) mock \(mock.identifier) is missing fixtureName.",
                        suggestedAdaptation: "Add a fixtureName payload value to \(mock.identifier).",
                        payload: [
                            "capability": capability.rawValue,
                            "mockIdentifier": mock.identifier,
                        ]
                    )
                )
            }
        }

        return records
    }
}

public struct RuntimeNativePermissionRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var state: RuntimeNativePermissionState
    public var promptResult: RuntimeNativePermissionState?
    public var resolvedState: RuntimeNativePermissionState
    public var strictModeAlternative: String

    public init(
        capability: RuntimeNativeCapabilityID,
        state: RuntimeNativePermissionState,
        promptResult: RuntimeNativePermissionState? = nil,
        resolvedState: RuntimeNativePermissionState? = nil,
        strictModeAlternative: String
    ) {
        self.capability = capability
        self.state = state
        self.promptResult = promptResult
        self.resolvedState = resolvedState ?? Self.resolve(state: state, promptResult: promptResult)
        self.strictModeAlternative = strictModeAlternative
    }

    private static func resolve(
        state: RuntimeNativePermissionState,
        promptResult: RuntimeNativePermissionState?
    ) -> RuntimeNativePermissionState {
        guard state == .prompt else {
            return state
        }
        return promptResult ?? state
    }
}

public struct RuntimeNativePermissionPromptRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var initialState: RuntimeNativePermissionState
    public var resultState: RuntimeNativePermissionState?
    public var finalState: RuntimeNativePermissionState
    public var sourceMockIdentifier: String?
    public var strictModeAlternative: String

    public init(
        capability: RuntimeNativeCapabilityID,
        initialState: RuntimeNativePermissionState,
        resultState: RuntimeNativePermissionState? = nil,
        finalState: RuntimeNativePermissionState,
        sourceMockIdentifier: String? = nil,
        strictModeAlternative: String
    ) {
        self.capability = capability
        self.initialState = initialState
        self.resultState = resultState
        self.finalState = finalState
        self.sourceMockIdentifier = sourceMockIdentifier
        self.strictModeAlternative = strictModeAlternative
    }

    public init?(
        permission: RuntimeNativePermissionRecord,
        mock: RuntimeNativeCapabilityMock?
    ) {
        guard permission.state == .prompt else {
            return nil
        }
        self.init(
            capability: permission.capability,
            initialState: permission.state,
            resultState: permission.promptResult,
            finalState: permission.resolvedState,
            sourceMockIdentifier: mock?.identifier,
            strictModeAlternative: permission.strictModeAlternative
        )
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

public struct RuntimeNativeCameraCaptureRecord: Hashable, Codable, Sendable {
    public var identifier: String
    public var fixtureName: String
    public var mediaType: String
    public var outputPath: String?
    public var permissionState: RuntimeNativePermissionState
    public var payload: [String: String]

    public init(
        identifier: String,
        fixtureName: String,
        mediaType: String = "image",
        outputPath: String? = nil,
        permissionState: RuntimeNativePermissionState,
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.fixtureName = fixtureName
        self.mediaType = mediaType
        self.outputPath = outputPath
        self.permissionState = permissionState
        self.payload = payload
    }

    public init?(
        mock: RuntimeNativeCapabilityMock,
        permissionState: RuntimeNativePermissionState
    ) {
        guard mock.capability == .camera, !mock.fixtureNameForNativeMock.isEmpty else {
            return nil
        }
        self.init(
            identifier: mock.identifier,
            fixtureName: mock.fixtureNameForNativeMock,
            mediaType: mock.payload["mediaType"] ?? "image",
            outputPath: mock.payload["outputPath"],
            permissionState: permissionState,
            payload: mock.payload
        )
    }

    public var artifactRecord: RuntimeNativeCapabilityArtifactRecord {
        RuntimeNativeCapabilityArtifactRecord(
            capability: .camera,
            name: "camera-capture-\(identifier)",
            kind: .fixtureReference,
            payload: [
                "identifier": identifier,
                "fixtureName": fixtureName,
                "mediaType": mediaType,
                "outputPath": outputPath ?? "",
                "permissionState": permissionState.rawValue,
            ].filter { !$0.value.isEmpty }
        )
    }
}

public struct RuntimeNativePhotoSelectionRecord: Hashable, Codable, Sendable {
    public var identifier: String
    public var fixtureName: String
    public var assetIdentifiers: [String]
    public var mediaTypes: [String]
    public var permissionState: RuntimeNativePermissionState
    public var payload: [String: String]

    public init(
        identifier: String,
        fixtureName: String,
        assetIdentifiers: [String] = [],
        mediaTypes: [String] = [],
        permissionState: RuntimeNativePermissionState,
        payload: [String: String] = [:]
    ) {
        self.identifier = identifier
        self.fixtureName = fixtureName
        self.assetIdentifiers = assetIdentifiers
        self.mediaTypes = mediaTypes
        self.permissionState = permissionState
        self.payload = payload
    }

    public init?(
        mock: RuntimeNativeCapabilityMock,
        permissionState: RuntimeNativePermissionState
    ) {
        guard mock.capability == .photos, !mock.fixtureNameForNativeMock.isEmpty else {
            return nil
        }
        self.init(
            identifier: mock.identifier,
            fixtureName: mock.fixtureNameForNativeMock,
            assetIdentifiers: RuntimeNativePayloadParser.commaSeparatedValues(mock.payload["assetIdentifiers"]),
            mediaTypes: RuntimeNativePayloadParser.commaSeparatedValues(mock.payload["mediaTypes"]),
            permissionState: permissionState,
            payload: mock.payload
        )
    }

    public var artifactRecord: RuntimeNativeCapabilityArtifactRecord {
        RuntimeNativeCapabilityArtifactRecord(
            capability: .photos,
            name: "photos-selection-\(identifier)",
            kind: .fixtureReference,
            payload: [
                "identifier": identifier,
                "fixtureName": fixtureName,
                "assetIdentifiers": assetIdentifiers.joined(separator: ","),
                "mediaTypes": mediaTypes.joined(separator: ","),
                "permissionState": permissionState.rawValue,
            ].filter { !$0.value.isEmpty }
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

public struct RuntimeNativeLocationState: Hashable, Codable, Sendable {
    public var permissionState: RuntimeNativePermissionState
    public var sourceMockIdentifier: String?
    public var currentCoordinate: RuntimeNativeLocationCoordinate?
    public var scriptedUpdates: [RuntimeNativeLocationUpdateRecord]
    public var payload: [String: String]

    public init(
        permissionState: RuntimeNativePermissionState,
        sourceMockIdentifier: String? = nil,
        currentCoordinate: RuntimeNativeLocationCoordinate? = nil,
        scriptedUpdates: [RuntimeNativeLocationUpdateRecord] = [],
        payload: [String: String] = [:]
    ) {
        self.permissionState = permissionState
        self.sourceMockIdentifier = sourceMockIdentifier
        self.currentCoordinate = currentCoordinate
        self.scriptedUpdates = scriptedUpdates
        self.payload = payload
    }

    public init?(
        permissionState: RuntimeNativePermissionState,
        mocks: [RuntimeNativeCapabilityMock],
        events: [RuntimeNativeCapabilityEventRecord]
    ) {
        let sourceMock = mocks.first
        let initialCoordinate = sourceMock.flatMap { RuntimeNativeLocationCoordinate(payload: $0.payload) }
        let updates = events.compactMap(RuntimeNativeLocationUpdateRecord.init(event:))
            .sorted { $0.atRevision < $1.atRevision }
        let currentCoordinate = updates.last?.coordinate ?? initialCoordinate

        guard permissionState != .unsupported || currentCoordinate != nil || !updates.isEmpty else {
            return nil
        }

        self.init(
            permissionState: permissionState,
            sourceMockIdentifier: sourceMock?.identifier,
            currentCoordinate: currentCoordinate,
            scriptedUpdates: updates,
            payload: sourceMock?.payload ?? [:]
        )
    }

    public var logMessages: [String] {
        scriptedUpdates.map {
            "native.location.update.\($0.name).\($0.atRevision)"
        }
    }

    public var artifactRecords: [RuntimeNativeCapabilityArtifactRecord] {
        guard !scriptedUpdates.isEmpty else {
            return []
        }
        return [
            RuntimeNativeCapabilityArtifactRecord(
                capability: .location,
                name: "location-scripted-events",
                kind: .eventLog,
                payload: [
                    "updateCount": "\(scriptedUpdates.count)",
                    "latestLatitude": currentCoordinate?.latitudeText ?? "",
                    "latestLongitude": currentCoordinate?.longitudeText ?? "",
                    "permissionState": permissionState.rawValue,
                ].filter { !$0.value.isEmpty }
            ),
        ]
    }
}

public struct RuntimeNativeLocationCoordinate: Hashable, Codable, Sendable {
    public var latitude: Double
    public var longitude: Double
    public var accuracyMeters: Int
    public var payload: [String: String]

    public init(
        latitude: Double,
        longitude: Double,
        accuracyMeters: Int,
        payload: [String: String] = [:]
    ) {
        self.latitude = latitude
        self.longitude = longitude
        self.accuracyMeters = accuracyMeters
        self.payload = payload
    }

    public init?(payload: [String: String]) {
        guard let latitudeText = payload["latitude"],
              let longitudeText = payload["longitude"],
              let latitude = Double(latitudeText),
              let longitude = Double(longitudeText) else {
            return nil
        }
        self.init(
            latitude: latitude,
            longitude: longitude,
            accuracyMeters: Int(payload["accuracyMeters"] ?? "") ?? 0,
            payload: payload
        )
    }

    public var latitudeText: String {
        payload["latitude"] ?? String(latitude)
    }

    public var longitudeText: String {
        payload["longitude"] ?? String(longitude)
    }

    public var accuracyMetersText: String {
        payload["accuracyMeters"] ?? String(accuracyMeters)
    }
}

public struct RuntimeNativeLocationUpdateRecord: Hashable, Codable, Sendable {
    public var name: String
    public var atRevision: Int
    public var coordinate: RuntimeNativeLocationCoordinate
    public var payload: [String: String]

    public init(
        name: String,
        atRevision: Int,
        coordinate: RuntimeNativeLocationCoordinate,
        payload: [String: String] = [:]
    ) {
        self.name = name
        self.atRevision = atRevision
        self.coordinate = coordinate
        self.payload = payload
    }

    public init?(event: RuntimeNativeCapabilityEventRecord) {
        guard event.capability == .location,
              let coordinate = RuntimeNativeLocationCoordinate(payload: event.payload) else {
            return nil
        }
        self.init(
            name: event.name,
            atRevision: event.atRevision,
            coordinate: coordinate,
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

public struct RuntimeNativeCapabilityDiagnosticRecord: Hashable, Codable, Sendable {
    public var capability: RuntimeNativeCapabilityID
    public var code: String
    public var message: String
    public var suggestedAdaptation: String
    public var payload: [String: String]

    public init(
        capability: RuntimeNativeCapabilityID,
        code: String,
        message: String,
        suggestedAdaptation: String,
        payload: [String: String] = [:]
    ) {
        self.capability = capability
        self.code = code
        self.message = message
        self.suggestedAdaptation = suggestedAdaptation
        self.payload = payload
    }

    public init(symbol: RuntimeNativeUnsupportedSymbol) {
        self.init(
            capability: symbol.capability,
            code: "unsupportedSymbol",
            message: "Unsupported native symbol \(symbol.symbolName) was requested.",
            suggestedAdaptation: symbol.suggestedAdaptation,
            payload: [
                "symbolName": symbol.symbolName,
                "capability": symbol.capability.rawValue,
            ]
        )
    }

    public var artifactRecord: RuntimeNativeCapabilityArtifactRecord {
        RuntimeNativeCapabilityArtifactRecord(
            capability: capability,
            name: "\(capability.rawValue)-diagnostic-\(code)",
            kind: .diagnostic,
            payload: payload.merging(
                [
                    "code": code,
                    "message": message,
                    "suggestedAdaptation": suggestedAdaptation,
                ],
                uniquingKeysWith: { current, _ in current }
            )
        )
    }
}

private enum RuntimeNativePayloadParser {
    static func commaSeparatedValues(_ value: String?) -> [String] {
        value?
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty } ?? []
    }
}

private extension RuntimeNativeCapabilityMock {
    var fixtureNameForNativeMock: String {
        payload["fixtureName"]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }
}
