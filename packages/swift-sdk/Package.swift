// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "StrictModeSDK",
    platforms: [
        .macOS(.v15),
    ],
    dependencies: [
        .package(path: "../runtime-host"),
    ],
    products: [
        .library(
            name: "StrictModeSDK",
            targets: ["StrictModeSDK"]
        ),
    ],
    targets: [
        .target(
            name: "StrictModeSDK",
            dependencies: [
                .product(name: "RuntimeHost", package: "runtime-host"),
            ]
        ),
    ]
)
