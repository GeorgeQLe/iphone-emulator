// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "RuntimeHost",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(
            name: "RuntimeHost",
            targets: ["RuntimeHost"]
        ),
    ],
    targets: [
        .target(name: "RuntimeHost"),
    ]
)
