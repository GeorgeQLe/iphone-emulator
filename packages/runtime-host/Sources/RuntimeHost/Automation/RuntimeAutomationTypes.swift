public struct RuntimeAutomationSession: Hashable, Codable, Sendable {
    public var id: String
    public var appIdentifier: String
    public var snapshot: RuntimeTreeSnapshot
    public var logs: [RuntimeAutomationLogEntry]
    public var artifactBundle: RuntimeArtifactBundle
    public var device: RuntimeDeviceSettings

    public init(
        id: String,
        appIdentifier: String,
        snapshot: RuntimeTreeSnapshot,
        logs: [RuntimeAutomationLogEntry] = [],
        artifactBundle: RuntimeArtifactBundle? = nil,
        device: RuntimeDeviceSettings = RuntimeDeviceSettings()
    ) {
        self.id = id
        self.appIdentifier = appIdentifier
        self.snapshot = snapshot
        self.logs = logs
        self.artifactBundle = artifactBundle ?? RuntimeArtifactBundle(sessionID: id, logs: logs)
        self.device = device
    }
}

public struct RuntimeAutomationLaunchConfiguration: Hashable, Codable, Sendable {
    public var appIdentifier: String
    public var fixtureName: String
    public var device: RuntimeDeviceSettings
    public var networkFixtures: [RuntimeNetworkFixture]

    public init(
        appIdentifier: String,
        fixtureName: String,
        device: RuntimeDeviceSettings = RuntimeDeviceSettings(),
        networkFixtures: [RuntimeNetworkFixture] = []
    ) {
        self.appIdentifier = appIdentifier
        self.fixtureName = fixtureName
        self.device = device
        self.networkFixtures = networkFixtures
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
