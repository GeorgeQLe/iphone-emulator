// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "DiagnosticsCore",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(
            name: "DiagnosticsCore",
            targets: ["DiagnosticsCore"]
        ),
    ],
    targets: [
        .target(name: "DiagnosticsCore"),
    ]
)
