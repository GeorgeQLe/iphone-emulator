public struct RuntimeNetworkFixture: Hashable, Codable, Sendable {
    public var id: String
    public var method: String
    public var url: String
    public var response: RuntimeNetworkResponse

    public init(
        id: String,
        method: String,
        url: String,
        response: RuntimeNetworkResponse
    ) {
        self.id = id
        self.method = method
        self.url = url
        self.response = response
    }
}

public struct RuntimeNetworkRequest: Hashable, Codable, Sendable {
    public var method: String
    public var url: String
    public var headers: [String: String]
    public var bodyByteCount: Int

    public init(
        method: String,
        url: String,
        headers: [String: String] = [:],
        bodyByteCount: Int = 0
    ) {
        self.method = method
        self.url = url
        self.headers = headers
        self.bodyByteCount = bodyByteCount
    }
}

public struct RuntimeNetworkResponse: Hashable, Codable, Sendable {
    public var status: Int
    public var headers: [String: String]
    public var bodyByteCount: Int

    public init(
        status: Int,
        headers: [String: String] = [:],
        bodyByteCount: Int = 0
    ) {
        self.status = status
        self.headers = headers
        self.bodyByteCount = bodyByteCount
    }
}

public struct RuntimeNetworkRequestRecord: Hashable, Codable, Sendable {
    public enum Source: Hashable, Codable, Sendable {
        case fixture(String)
        case missingFixture
    }

    public var id: String
    public var request: RuntimeNetworkRequest
    public var response: RuntimeNetworkResponse
    public var source: Source

    public init(
        id: String,
        request: RuntimeNetworkRequest,
        response: RuntimeNetworkResponse,
        source: Source
    ) {
        self.id = id
        self.request = request
        self.response = response
        self.source = source
    }
}
