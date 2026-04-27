// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "IPhoneEmulatorWorkspace",
    platforms: [
        .macOS(.v15),
    ],
    targets: [
        .target(
            name: "ScaffoldTestSupport"
        ),
        .testTarget(
            name: "ScaffoldValidationTests",
            dependencies: ["ScaffoldTestSupport"]
        ),
        .testTarget(
            name: "StrictModeSDKContractTests"
        ),
    ]
)
