// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "IPhoneEmulatorWorkspace",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(
            name: "StrictModeSDK",
            targets: ["StrictModeSDK"]
        ),
        .library(
            name: "RuntimeHost",
            targets: ["RuntimeHost"]
        ),
        .library(
            name: "DiagnosticsCore",
            targets: ["DiagnosticsCore"]
        ),
    ],
    targets: [
        .target(
            name: "StrictModeSDK",
            dependencies: ["RuntimeHost"],
            path: "packages/swift-sdk/Sources/StrictModeSDK"
        ),
        .target(
            name: "RuntimeHost",
            path: "packages/runtime-host/Sources/RuntimeHost"
        ),
        .target(
            name: "DiagnosticsCore",
            path: "packages/diagnostics/Sources/DiagnosticsCore"
        ),
        .target(
            name: "ScaffoldTestSupport"
        ),
        .testTarget(
            name: "ScaffoldValidationTests",
            dependencies: ["ScaffoldTestSupport"]
        ),
        .testTarget(
            name: "StrictModeSDKContractTests",
            dependencies: ["StrictModeSDK"]
        ),
        .testTarget(
            name: "RuntimeHostContractTests",
            dependencies: ["RuntimeHost", "StrictModeSDK"]
        ),
        .testTarget(
            name: "DiagnosticsCoreContractTests",
            dependencies: ["DiagnosticsCore"]
        ),
    ]
)
