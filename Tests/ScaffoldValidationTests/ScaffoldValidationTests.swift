import Foundation
import Testing

struct ScaffoldValidationTests {
    @Test("repository scaffold directories exist")
    func requiredDirectoriesExist() {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let requiredDirectories = [
            "packages/swift-sdk",
            "packages/runtime-host",
            "packages/diagnostics",
            "packages/browser-renderer",
            "packages/automation-sdk",
            "examples",
            "tests",
        ]

        for path in requiredDirectories {
            let exists = FileManager.default.fileExists(
                atPath: root.appendingPathComponent(path).path,
                isDirectory: nil
            )
            #expect(exists, "Expected scaffold directory at \(path)")
        }
    }

    @Test("workspace and package manifests exist")
    func requiredManifestFilesExist() {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let requiredFiles = [
            "Package.swift",
            "package.json",
            "packages/swift-sdk/Package.swift",
            "packages/runtime-host/Package.swift",
            "packages/diagnostics/Package.swift",
            "packages/browser-renderer/package.json",
            "packages/automation-sdk/package.json",
        ]

        for path in requiredFiles {
            let exists = FileManager.default.fileExists(
                atPath: root.appendingPathComponent(path).path
            )
            #expect(exists, "Expected manifest file at \(path)")
        }
    }
}
