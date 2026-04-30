public struct RuntimeAutomationSession: Hashable, Codable, Sendable {
    public var id: String
    public var appIdentifier: String
    public var snapshot: RuntimeTreeSnapshot
    public var logs: [RuntimeAutomationLogEntry]
    public var artifactBundle: RuntimeArtifactBundle
    public var device: RuntimeDeviceSettings
    public var nativeCapabilities: RuntimeNativeCapabilityManifest
    public var nativeCapabilityState: RuntimeNativeCapabilityState
    public var nativeCapabilityEvents: [RuntimeNativeCapabilityEventRecord]

    public init(
        id: String,
        appIdentifier: String,
        snapshot: RuntimeTreeSnapshot,
        logs: [RuntimeAutomationLogEntry] = [],
        artifactBundle: RuntimeArtifactBundle? = nil,
        device: RuntimeDeviceSettings = RuntimeDeviceSettings(),
        nativeCapabilities: RuntimeNativeCapabilityManifest = RuntimeNativeCapabilityManifest(),
        nativeCapabilityState: RuntimeNativeCapabilityState? = nil,
        nativeCapabilityEvents: [RuntimeNativeCapabilityEventRecord] = []
    ) {
        self.id = id
        self.appIdentifier = appIdentifier
        self.snapshot = snapshot
        self.logs = logs
        self.artifactBundle = artifactBundle ?? RuntimeArtifactBundle(sessionID: id, logs: logs)
        self.device = device
        self.nativeCapabilities = nativeCapabilities
        self.nativeCapabilityState = nativeCapabilityState ?? RuntimeNativeCapabilityState(manifest: nativeCapabilities)
        self.nativeCapabilityEvents = nativeCapabilityEvents
    }
}

public struct RuntimeAutomationLaunchConfiguration: Hashable, Codable, Sendable {
    public var appIdentifier: String
    public var fixtureName: String
    public var device: RuntimeDeviceSettings
    public var networkFixtures: [RuntimeNetworkFixture]
    public var nativeCapabilities: RuntimeNativeCapabilityManifest

    public init(
        appIdentifier: String,
        fixtureName: String,
        device: RuntimeDeviceSettings = RuntimeDeviceSettings(),
        networkFixtures: [RuntimeNetworkFixture] = [],
        nativeCapabilities: RuntimeNativeCapabilityManifest = RuntimeNativeCapabilityManifest()
    ) {
        self.appIdentifier = appIdentifier
        self.fixtureName = fixtureName
        self.device = device
        self.networkFixtures = networkFixtures
        self.nativeCapabilities = nativeCapabilities
    }
}

public struct RuntimeAutomationSemanticQuery: Hashable, Codable, Sendable {
    public var role: UITreeRole?
    public var text: String?
    public var identifier: UITreeIdentifier?

    public init(
        role: UITreeRole? = nil,
        text: String? = nil,
        identifier: UITreeIdentifier? = nil
    ) {
        self.role = role
        self.text = text
        self.identifier = identifier
    }
}

public enum RuntimeNativeAutomationAction: Hashable, Codable, Sendable {
    case requestPermission(capability: RuntimeNativeCapabilityID)
    case setPermission(capability: RuntimeNativeCapabilityID, state: RuntimeNativePermissionState)
    case captureCamera(identifier: String = "front-camera-still", fixtureName: String? = nil, mediaType: String = "image", outputPath: String? = nil)
    case selectPhoto(identifier: String = "recent-library-pick", fixtureName: String? = nil, assetIdentifiers: [String] = [], mediaTypes: [String] = [])
    case updateLocation(identifier: String = "automation", latitude: Double, longitude: Double, accuracyMeters: Int = 0)
    case readClipboard(identifier: String = "automation")
    case writeClipboard(identifier: String = "automation", text: String)
    case selectFiles(identifier: String = "document-picker", selectedFiles: [String] = [], contentTypes: [String] = [], allowsMultipleSelection: Bool = false)
    case completeShareSheet(identifier: String = "share-receipt", activityType: String? = nil, items: [String] = [], completionState: String = "completed")
    case scheduleNotification(identifier: String = "profile-reminder", title: String? = nil, body: String? = nil, trigger: String? = nil)
    case deliverNotification(identifier: String = "profile-reminder", title: String? = nil, body: String? = nil)
    case snapshotDeviceEnvironment

    public static let supportedCapabilities: [RuntimeNativeCapabilityID] = [
        .camera,
        .location,
        .photos,
        .clipboard,
        .files,
        .shareSheet,
        .notifications,
        .deviceEnvironment,
    ]

    public static let canonicalEventNames: [String] = [
        "native.permission.camera.request",
        "native.permission.location.set",
        "native.camera.capture.front-camera-still",
        "native.photos.selection.recent-library-pick",
        "native.location.update.automation",
        "native.clipboard.read.automation",
        "native.clipboard.write.automation",
        "native.files.selection.document-picker",
        "native.shareSheet.complete.share-receipt",
        "native.notifications.schedule.profile-reminder",
        "native.notifications.deliver.profile-reminder",
        "native.deviceEnvironment.snapshot",
    ]

    public func eventRecord(
        revision: Int,
        device: RuntimeDeviceSettings? = nil
    ) -> RuntimeNativeCapabilityEventRecord {
        RuntimeNativeCapabilityEventRecord(
            capability: capability,
            name: eventName,
            atRevision: revision,
            payload: payload(device: device)
        )
    }

    public var capability: RuntimeNativeCapabilityID {
        switch self {
        case let .requestPermission(capability), let .setPermission(capability, _):
            capability
        case .captureCamera:
            .camera
        case .selectPhoto:
            .photos
        case .updateLocation:
            .location
        case .readClipboard, .writeClipboard:
            .clipboard
        case .selectFiles:
            .files
        case .completeShareSheet:
            .shareSheet
        case .scheduleNotification, .deliverNotification:
            .notifications
        case .snapshotDeviceEnvironment:
            .deviceEnvironment
        }
    }

    public var eventName: String {
        switch self {
        case let .requestPermission(capability):
            "native.permission.\(capability.rawValue).request"
        case let .setPermission(capability, _):
            "native.permission.\(capability.rawValue).set"
        case let .captureCamera(identifier, _, _, _):
            "native.camera.capture.\(identifier)"
        case let .selectPhoto(identifier, _, _, _):
            "native.photos.selection.\(identifier)"
        case let .updateLocation(identifier, _, _, _):
            "native.location.update.\(identifier)"
        case let .readClipboard(identifier):
            "native.clipboard.read.\(identifier)"
        case let .writeClipboard(identifier, _):
            "native.clipboard.write.\(identifier)"
        case let .selectFiles(identifier, _, _, _):
            "native.files.selection.\(identifier)"
        case let .completeShareSheet(identifier, _, _, _):
            "native.shareSheet.complete.\(identifier)"
        case let .scheduleNotification(identifier, _, _, _):
            "native.notifications.schedule.\(identifier)"
        case let .deliverNotification(identifier, _, _):
            "native.notifications.deliver.\(identifier)"
        case .snapshotDeviceEnvironment:
            "native.deviceEnvironment.snapshot"
        }
    }

    private func payload(device: RuntimeDeviceSettings?) -> [String: String] {
        switch self {
        case let .requestPermission(capability):
            return [
                "capability": capability.rawValue,
                "action": "request",
            ]
        case let .setPermission(capability, state):
            return [
                "capability": capability.rawValue,
                "state": state.rawValue,
                "action": "set",
            ]
        case let .captureCamera(identifier, fixtureName, mediaType, outputPath):
            return compactStringRecord([
                "identifier": identifier,
                "fixtureName": fixtureName,
                "mediaType": mediaType,
                "outputPath": outputPath,
            ])
        case let .selectPhoto(identifier, fixtureName, assetIdentifiers, mediaTypes):
            return compactStringRecord([
                "identifier": identifier,
                "fixtureName": fixtureName,
                "assetIdentifiers": assetIdentifiers.joined(separator: ","),
                "mediaTypes": mediaTypes.joined(separator: ","),
            ])
        case let .updateLocation(identifier, latitude, longitude, accuracyMeters):
            return [
                "identifier": identifier,
                "latitude": String(latitude),
                "longitude": String(longitude),
                "accuracyMeters": String(accuracyMeters),
            ]
        case let .readClipboard(identifier):
            return [
                "identifier": identifier,
                "action": "read",
            ]
        case let .writeClipboard(identifier, text):
            return [
                "identifier": identifier,
                "text": text,
                "action": "write",
            ]
        case let .selectFiles(identifier, selectedFiles, contentTypes, allowsMultipleSelection):
            return [
                "identifier": identifier,
                "selectedFiles": selectedFiles.joined(separator: ","),
                "contentTypes": contentTypes.joined(separator: ","),
                "allowsMultipleSelection": String(allowsMultipleSelection),
            ]
        case let .completeShareSheet(identifier, activityType, items, completionState):
            return compactStringRecord([
                "identifier": identifier,
                "activityType": activityType,
                "items": items.joined(separator: ","),
                "completionState": completionState,
            ])
        case let .scheduleNotification(identifier, title, body, trigger):
            return compactStringRecord([
                "identifier": identifier,
                "title": title,
                "body": body,
                "trigger": trigger,
                "state": "scheduled",
            ])
        case let .deliverNotification(identifier, title, body):
            return compactStringRecord([
                "identifier": identifier,
                "title": title,
                "body": body,
                "state": "delivered",
            ])
        case .snapshotDeviceEnvironment:
            return compactStringRecord([
                "capability": RuntimeNativeCapabilityID.deviceEnvironment.rawValue,
                "viewportWidth": device.map { String($0.viewport.width) },
                "viewportHeight": device.map { String($0.viewport.height) },
                "viewportScale": device.map { String($0.viewport.scale) },
                "colorScheme": device?.colorScheme.rawValue,
                "locale": device?.locale,
                "clockFrozenAtISO8601": device?.clock.frozenAtISO8601,
                "timeZone": device?.clock.timeZone,
                "latitude": device?.geolocation.map { String($0.latitude) },
                "longitude": device?.geolocation.map { String($0.longitude) },
                "accuracyMeters": device?.geolocation.map { String($0.accuracyMeters) },
                "isOnline": device.map { String($0.network.isOnline) },
                "latencyMilliseconds": device.map { String($0.network.latencyMilliseconds) },
                "downloadKbps": device.map { String($0.network.downloadKbps) },
            ])
        }
    }

    private func compactStringRecord(_ values: [String: String?]) -> [String: String] {
        values.compactMapValues { value in
            guard let value, !value.isEmpty else {
                return nil
            }
            return value
        }
    }
}

public enum RuntimeAutomationCommand: Hashable, Codable, Sendable {
    case launch(RuntimeAutomationLaunchConfiguration)
    case close(sessionID: String? = nil)
    case tap(RuntimeAutomationSemanticQuery)
    case fill(RuntimeAutomationSemanticQuery, text: String)
    case type(RuntimeAutomationSemanticQuery, text: String)
    case wait(RuntimeAutomationSemanticQuery)
    case query(RuntimeAutomationSemanticQuery)
    case inspect(RuntimeAutomationSemanticQuery)
    case semanticSnapshot(sessionID: String? = nil)
    case screenshot(name: String? = nil)
    case logs(sessionID: String? = nil)
    case recordNetworkRequest(RuntimeNetworkRequest)
    case nativeAutomation(RuntimeNativeAutomationAction)
}

public struct RuntimeAutomationRequest: Hashable, Codable, Sendable {
    public var id: String
    public var command: RuntimeAutomationCommand

    public init(
        id: String,
        command: RuntimeAutomationCommand
    ) {
        self.id = id
        self.command = command
    }
}

public struct RuntimeAutomationResponse: Hashable, Codable, Sendable {
    public enum Result: Hashable, Codable, Sendable {
        case launched(RuntimeAutomationSession)
        case closed
        case interactionCompleted(snapshot: RuntimeTreeSnapshot, logs: [RuntimeAutomationLogEntry])
        case queryMatches([UITreeNode])
        case semanticTree(SemanticUITree)
        case screenshot(RuntimeAutomationScreenshotMetadata)
        case logs([RuntimeAutomationLogEntry])
        case networkRecord(RuntimeNetworkRequestRecord)
        case nativeCapabilityEvents([RuntimeNativeCapabilityEventRecord])
    }

    public var requestID: String
    public var result: Result

    public init(
        requestID: String,
        result: Result
    ) {
        self.requestID = requestID
        self.result = result
    }
}

public enum RuntimeAutomationEvent: Hashable, Codable, Sendable {
    case sessionOpened(RuntimeAutomationSession)
    case snapshotUpdated(RuntimeTreeSnapshot)
    case logsUpdated([RuntimeAutomationLogEntry])
    case sessionClosed
}

public struct RuntimeAutomationLogEntry: Hashable, Codable, Sendable {
    public enum Level: String, Hashable, Codable, Sendable {
        case debug
        case info
        case warning
        case error
    }

    public var level: Level
    public var message: String

    public init(
        level: Level,
        message: String
    ) {
        self.level = level
        self.message = message
    }
}

public struct RuntimeAutomationScreenshotMetadata: Hashable, Codable, Sendable {
    public var name: String
    public var format: String
    public var byteCount: Int

    public init(
        name: String,
        format: String,
        byteCount: Int
    ) {
        self.name = name
        self.format = format
        self.byteCount = byteCount
    }
}

public struct RuntimeDeviceSettings: Hashable, Codable, Sendable {
    public enum ColorScheme: String, Hashable, Codable, Sendable {
        case light
        case dark
    }

    public var viewport: RuntimeDeviceViewport
    public var colorScheme: ColorScheme
    public var locale: String
    public var clock: RuntimeDeviceClock
    public var geolocation: RuntimeDeviceGeolocation?
    public var network: RuntimeDeviceNetworkState

    public init(
        viewport: RuntimeDeviceViewport = RuntimeDeviceViewport(),
        colorScheme: ColorScheme = .light,
        locale: String = "en_US",
        clock: RuntimeDeviceClock = RuntimeDeviceClock(),
        geolocation: RuntimeDeviceGeolocation? = nil,
        network: RuntimeDeviceNetworkState = RuntimeDeviceNetworkState()
    ) {
        self.viewport = viewport
        self.colorScheme = colorScheme
        self.locale = locale
        self.clock = clock
        self.geolocation = geolocation
        self.network = network
    }
}

public struct RuntimeDeviceViewport: Hashable, Codable, Sendable {
    public var width: Int
    public var height: Int
    public var scale: Int

    public init(
        width: Int = 393,
        height: Int = 852,
        scale: Int = 3
    ) {
        self.width = width
        self.height = height
        self.scale = scale
    }
}

public struct RuntimeDeviceClock: Hashable, Codable, Sendable {
    public var frozenAtISO8601: String?
    public var timeZone: String

    public init(
        frozenAtISO8601: String? = nil,
        timeZone: String = "UTC"
    ) {
        self.frozenAtISO8601 = frozenAtISO8601
        self.timeZone = timeZone
    }
}

public struct RuntimeDeviceGeolocation: Hashable, Codable, Sendable {
    public var latitude: Double
    public var longitude: Double
    public var accuracyMeters: Int

    public init(
        latitude: Double,
        longitude: Double,
        accuracyMeters: Int
    ) {
        self.latitude = latitude
        self.longitude = longitude
        self.accuracyMeters = accuracyMeters
    }
}

public struct RuntimeDeviceNetworkState: Hashable, Codable, Sendable {
    public var isOnline: Bool
    public var latencyMilliseconds: Int
    public var downloadKbps: Int

    public init(
        isOnline: Bool = true,
        latencyMilliseconds: Int = 0,
        downloadKbps: Int = 0
    ) {
        self.isOnline = isOnline
        self.latencyMilliseconds = latencyMilliseconds
        self.downloadKbps = downloadKbps
    }
}

public enum RuntimeAutomationError: Hashable, Codable, Sendable, Error {
    case sessionNotFound
    case invalidQuery
    case unsupportedCommand
    case interactionFailed(String)
}
