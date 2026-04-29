import Testing
import RuntimeHost
import StrictModeSDK
import DiagnosticsCore

struct RuntimeHostContractTests {
    @Test("runtime host public entry points exist")
    func publicEntryPointsExist() {
        let exportedSymbols: [Any.Type] = [
            RuntimeAppLifecycle.self,
            RuntimeAppLoader.self,
            RuntimeTreeBridge.self,
            RuntimeTreeSnapshot.self,
            RuntimeLogSink.self,
            ProtocolBoundaryPlaceholder.self,
            SemanticUITree.self,
            UITreeScene.self,
            UITreeNode.self,
            UITreeIdentifier.self,
            UINavigationState.self,
            UIModalState.self,
            UITabState.self,
            UIAlertPayload.self,
        ]

        #expect(exportedSymbols.count == 14)
    }

    @Test("semantic tree contract keeps identifiers and state deterministic")
    func semanticTreeContractDeterministic() {
        let node = UITreeNode(
            id: "name-field",
            role: .textField,
            label: "Name",
            value: "Taylor"
        )
        let scene = UITreeScene(
            id: "root-modal",
            kind: .modal,
            rootNode: node,
            navigationState: UINavigationState(stackIdentifiers: ["root-modal"], selectedIdentifier: "root-modal"),
            modalState: UIModalState(isPresented: true, presentedNode: node),
            tabState: UITabState(tabIdentifiers: ["name-field"], selectedIdentifier: "name-field"),
            alertPayload: UIAlertPayload(title: "Notice", message: "Saved")
        )
        let tree = SemanticUITree(appIdentifier: "FixtureApp", scene: scene)

        #expect(tree.scene.rootNode?.id == "name-field")
        #expect(tree.scene.navigationState?.selectedIdentifier == "root-modal")
        #expect(tree.scene.tabState?.selectedIdentifier == "name-field")
        #expect(tree.scene.alertPayload?.message == "Saved")
    }

    @Test("runtime app loader lowers strict-mode fixtures into retained snapshots")
    func loaderLowersStrictModeFixture() {
        struct FixtureApp: App {
            var body: some Scene {
                Modal(id: "fixture-modal") {
                    VStack(id: "fixture-stack") {
                        Text("Hello", id: "greeting")
                        Button("Continue", id: "continue-button")
                    }
                }
            }
        }

        let loader = RuntimeAppLoader()
        let snapshot = loader.loadFixture {
            FixtureApp().makeSemanticTree()
        }

        #expect(snapshot.appIdentifier == "FixtureApp")
        #expect(snapshot.lifecycleState == .active)
        #expect(snapshot.revision == 1)
        #expect(snapshot.tree.scene.rootNode?.id == "fixture-modal")
        #expect(snapshot.tree.scene.modalState?.presentedNode?.id == "fixture-modal")
        #expect(snapshot.tree.scene.rootNode?.children.first?.id == "fixture-stack")
    }

    @Test("strict-mode fixture semantic tree stays stable across runtime snapshot queries")
    func fixtureSemanticTreeRegressionCoverage() {
        struct FixtureApp: App {
            var body: some Scene {
                Modal(id: "welcome-modal") {
                    NavigationStack(id: "home-stack") {
                        VStack(id: "content-stack") {
                            Text("Hello from strict mode", id: "headline")
                            HStack(id: "profile-row") {
                                TextField("Name", text: "Taylor", id: "name-field")
                                Button("Save", id: "save-button")
                            }
                            List(id: "items-list") {
                                Text("Messages", id: "favorite-1")
                                Text("Calendar", id: "favorite-2")
                            }
                        }
                    }
                }
            }
        }

        let loader = RuntimeAppLoader()
        let snapshot = loader.loadFixture {
            FixtureApp().makeSemanticTree()
        }
        let retainedSnapshot = RuntimeTreeSnapshot(
            appIdentifier: snapshot.appIdentifier,
            tree: SemanticUITree(
                appIdentifier: snapshot.appIdentifier,
                scene: UITreeScene(
                    id: snapshot.tree.scene.id,
                    kind: snapshot.tree.scene.kind,
                    rootNode: snapshot.tree.scene.rootNode,
                    navigationState: UINavigationState(
                        stackIdentifiers: ["home-stack", "details-screen"],
                        selectedIdentifier: "home-stack"
                    ),
                    modalState: snapshot.tree.scene.modalState,
                    tabState: UITabState(
                        tabIdentifiers: ["home-tab", "profile-tab"],
                        selectedIdentifier: "home-tab"
                    ),
                    alertPayload: UIAlertPayload(
                        title: "Preview Mode",
                        message: "Renderer output is deterministic for this fixed fixture."
                    )
                )
            ),
            lifecycleState: snapshot.lifecycleState,
            revision: snapshot.revision
        )
        var bridge = RuntimeTreeBridge()

        bridge.retain(retainedSnapshot)

        #expect(snapshot.appIdentifier == "FixtureApp")
        #expect(snapshot.tree.scene.id == "welcome-modal")
        #expect(snapshot.tree.scene.kind == .modal)
        #expect(snapshot.tree.scene.rootNode?.id == "welcome-modal")
        #expect(snapshot.tree.scene.rootNode?.children.first?.id == "home-stack")
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.id == "content-stack")
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children.map(\.id.rawValue) == [
            "headline",
            "profile-row",
            "items-list",
        ])
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children[1].children.map(\.id.rawValue) == [
            "name-field",
            "save-button",
        ])
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.first?.children[2].children.map(\.id.rawValue) == [
            "favorite-1",
            "favorite-2",
        ])
        #expect(snapshot.tree.scene.modalState?.isPresented == true)
        #expect(snapshot.tree.scene.modalState?.presentedNode?.id == "welcome-modal")
        #expect(snapshot.tree.scene.modalState?.presentedNode?.children.first?.id == "home-stack")
        #expect(retainedSnapshot.tree.scene.navigationState?.stackIdentifiers.map(\.rawValue) == [
            "home-stack",
            "details-screen",
        ])
        #expect(retainedSnapshot.tree.scene.navigationState?.selectedIdentifier?.rawValue == "home-stack")
        #expect(retainedSnapshot.tree.scene.tabState?.tabIdentifiers.map(\.rawValue) == [
            "home-tab",
            "profile-tab",
        ])
        #expect(retainedSnapshot.tree.scene.tabState?.selectedIdentifier?.rawValue == "home-tab")
        #expect(retainedSnapshot.tree.scene.alertPayload?.title == "Preview Mode")
        #expect(retainedSnapshot.tree.scene.alertPayload?.message == "Renderer output is deterministic for this fixed fixture.")
        #expect(bridge.latestRootIdentifier?.rawValue == "welcome-modal")
        #expect(bridge.latestNavigationState?.selectedIdentifier?.rawValue == "home-stack")
        #expect(bridge.latestModalState?.presentedNode?.id.rawValue == "welcome-modal")
        #expect(bridge.latestAlertPayload?.message == "Renderer output is deterministic for this fixed fixture.")
    }

    @Test("runtime tree bridge retains latest snapshot query state")
    func bridgeRetainsSnapshotQueries() {
        let scene = UITreeScene(
            id: "root-modal",
            kind: .modal,
            rootNode: UITreeNode(id: "name-field", role: .textField, label: "Name", value: "Taylor"),
            navigationState: UINavigationState(stackIdentifiers: ["root-modal"], selectedIdentifier: "root-modal"),
            modalState: UIModalState(isPresented: true, presentedNode: UITreeNode(id: "name-field", role: .textField)),
            alertPayload: UIAlertPayload(title: "Notice", message: "Saved")
        )
        let snapshot = RuntimeTreeSnapshot(
            appIdentifier: "FixtureApp",
            tree: SemanticUITree(appIdentifier: "FixtureApp", scene: scene),
            lifecycleState: .active,
            revision: 2
        )
        var bridge = RuntimeTreeBridge()

        bridge.retain(snapshot)

        #expect(bridge.latestAppIdentifier == "FixtureApp")
        #expect(bridge.latestRootIdentifier == "name-field")
        #expect(bridge.lastRenderedTreeIdentifier == "name-field")
        #expect(bridge.latestNavigationState?.selectedIdentifier == "root-modal")
        #expect(bridge.latestModalState?.isPresented == true)
        #expect(bridge.latestAlertPayload?.message == "Saved")
        #expect(bridge.latestSnapshot?.revision == 2)
    }

    @Test("runtime automation protocol surface exists for fixture-backed sessions")
    func automationProtocolSurfaceExists() throws {
        let exportedSymbols: [Any.Type] = [
            RuntimeAutomationSession.self,
            RuntimeAutomationLaunchConfiguration.self,
            RuntimeAutomationSemanticQuery.self,
            RuntimeAutomationCommand.self,
            RuntimeAutomationRequest.self,
            RuntimeAutomationResponse.self,
            RuntimeAutomationEvent.self,
            RuntimeAutomationLogEntry.self,
            RuntimeAutomationScreenshotMetadata.self,
            RuntimeAutomationError.self,
        ]

        #expect(exportedSymbols.count == 10)

        let session = RuntimeAutomationSession(
            id: "session-1",
            appIdentifier: "FixtureApp",
            snapshot: RuntimeTreeSnapshot(
                appIdentifier: "FixtureApp",
                tree: SemanticUITree(
                    appIdentifier: "FixtureApp",
                    scene: UITreeScene(
                        id: "root-screen",
                        kind: .screen,
                        rootNode: UITreeNode(
                            id: "save-button",
                            role: .button,
                            label: "Save"
                        )
                    )
                )
            )
        )

        #expect(session.id == "session-1")
        #expect(session.appIdentifier == "FixtureApp")
        #expect(session.snapshot.tree.scene.rootNode?.id == "save-button")
    }

    @Test("runtime automation request and response envelopes capture deterministic interactions")
    func automationRequestResponseEnvelopesDeterministic() throws {
        let query = RuntimeAutomationSemanticQuery(
            role: .button,
            text: "Save",
            identifier: "save-button"
        )
        let request = RuntimeAutomationRequest(
            id: "req-1",
            command: .tap(query)
        )
        let response = RuntimeAutomationResponse(
            requestID: request.id,
            result: .interactionCompleted(
                snapshot: RuntimeTreeSnapshot(
                    appIdentifier: "FixtureApp",
                    tree: SemanticUITree(
                        appIdentifier: "FixtureApp",
                        scene: UITreeScene(
                            id: "root-screen",
                            kind: .screen,
                            rootNode: UITreeNode(
                                id: "save-button",
                                role: .button,
                                label: "Saved"
                            ),
                            alertPayload: UIAlertPayload(title: "Done", message: "Saved")
                        )
                    )
                ),
                logs: [
                    RuntimeAutomationLogEntry(
                        level: .info,
                        message: "Tapped save-button"
                    )
                ]
            )
        )

        #expect(query.role == .button)
        #expect(query.text == "Save")
        #expect(query.identifier == "save-button")
        #expect(request.id == "req-1")
        #expect(response.requestID == "req-1")
    }

    @Test("runtime automation command surface includes semantic inspection and artifact hooks")
    func automationCommandSurfaceIncludesInspectionAndArtifacts() throws {
        let launch = RuntimeAutomationCommand.launch(
            RuntimeAutomationLaunchConfiguration(
                appIdentifier: "FixtureApp",
                fixtureName: "strict-mode-baseline"
            )
        )
        let inspect = RuntimeAutomationCommand.inspect(
            RuntimeAutomationSemanticQuery(role: .textField, text: "Name")
        )
        let screenshot = RuntimeAutomationResponse.Result.screenshot(
            RuntimeAutomationScreenshotMetadata(
                name: "placeholder-home",
                format: "png",
                byteCount: 0
            )
        )
        let logs = RuntimeAutomationEvent.logsUpdated(
            [
                RuntimeAutomationLogEntry(level: .debug, message: "fixture loaded")
            ]
        )

        #expect(launch != inspect)
        #expect(screenshot != .logs([]))
        #expect(logs != .sessionClosed)
    }

    @Test("runtime automation coordinator launches baseline fixtures and resolves semantic queries")
    func automationCoordinatorLaunchesAndQueriesFixture() throws {
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline"
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(session.id == "session-1")
        #expect(session.snapshot.appIdentifier == "FixtureApp")
        #expect(session.snapshot.tree.scene.rootNode?.id == "root-stack")
        #expect(session.snapshot.tree.scene.modalState?.presentedNode?.id == "welcome-modal")
        #expect(coordinator.bridge.latestSnapshot?.appIdentifier == "FixtureApp")

        let queryByText = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-query-text",
                command: .query(
                    RuntimeAutomationSemanticQuery(text: "Save")
                )
            )
        )
        let queryByRole = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-query-role",
                command: .query(
                    RuntimeAutomationSemanticQuery(role: .textField, text: "Name")
                )
            )
        )
        let inspectByID = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-inspect-id",
                command: .inspect(
                    RuntimeAutomationSemanticQuery(identifier: "name-field")
                )
            )
        )
        let screenshot = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-screenshot",
                command: .screenshot(name: "baseline-home")
            )
        )
        let logs = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-logs",
                command: .logs()
            )
        )

        guard case let .queryMatches(textMatches) = queryByText.result else {
            Issue.record("expected queryMatches for text query")
            return
        }
        guard case let .queryMatches(roleMatches) = queryByRole.result else {
            Issue.record("expected queryMatches for role query")
            return
        }
        guard case let .queryMatches(inspectMatches) = inspectByID.result else {
            Issue.record("expected queryMatches for inspect query")
            return
        }
        guard case let .screenshot(metadata) = screenshot.result else {
            Issue.record("expected screenshot metadata")
            return
        }
        guard case let .logs(logEntries) = logs.result else {
            Issue.record("expected logs payload")
            return
        }

        #expect(textMatches.map(\.id.rawValue) == ["save-button"])
        #expect(roleMatches.map(\.id.rawValue) == ["name-field"])
        #expect(inspectMatches.first?.value == "Taylor")
        #expect(metadata.name == "baseline-home")
        #expect(metadata.format == "png")
        #expect(metadata.byteCount == 0)
        #expect(logEntries.count == 1)
        #expect(logEntries.first?.message == "Launched fixture strict-mode-baseline")
    }

    @Test("runtime automation coordinator applies deterministic tap and fill updates")
    func automationCoordinatorAppliesDeterministicInteractionUpdates() throws {
        var coordinator = RuntimeAutomationCoordinator()
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline"
                    )
                )
            )
        )

        let tap = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-tap",
                command: .tap(
                    RuntimeAutomationSemanticQuery(identifier: "save-button")
                )
            )
        )
        let fill = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-fill",
                command: .fill(
                    RuntimeAutomationSemanticQuery(identifier: "name-field"),
                    text: "Jordan"
                )
            )
        )
        let semanticSnapshot = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-tree",
                command: .semanticSnapshot()
            )
        )

        guard case let .interactionCompleted(tapSnapshot, tapLogs) = tap.result else {
            Issue.record("expected interaction result for tap")
            return
        }
        guard case let .interactionCompleted(fillSnapshot, fillLogs) = fill.result else {
            Issue.record("expected interaction result for fill")
            return
        }
        guard case let .semanticTree(tree) = semanticSnapshot.result else {
            Issue.record("expected semantic tree snapshot")
            return
        }

        #expect(tapSnapshot.revision == 2)
        #expect(tapSnapshot.tree.scene.alertPayload?.title == "Done")
        #expect(tapSnapshot.tree.scene.alertPayload?.message == "Saved")
        #expect(tapLogs.last?.message == "Tapped save-button")

        #expect(fillSnapshot.revision == 3)
        #expect(fillLogs.last?.message == "Filled name-field with Jordan")
        #expect(tree.scene.alertPayload?.message == "Saved")
        #expect(tree.scene.rootNode?.children.first?.children.first?.children[1].children.first?.value == "Jordan")
        #expect(coordinator.bridge.latestSnapshot?.revision == 3)
    }

    @Test("runtime artifact bundle records screenshots, semantic snapshots, logs, and network entries")
    func runtimeArtifactBundleContract() throws {
        let screenshot = RuntimeRenderArtifactMetadata(
            name: "baseline-home",
            kind: .screenshot,
            format: "png",
            byteCount: 0,
            viewport: RuntimeDeviceViewport(width: 393, height: 852, scale: 3)
        )
        let render = RuntimeRenderArtifactMetadata(
            name: "baseline-render",
            kind: .render,
            format: "json",
            byteCount: 128,
            viewport: RuntimeDeviceViewport(width: 393, height: 852, scale: 3)
        )
        let semanticSnapshot = RuntimeSemanticSnapshotArtifact(
            name: "baseline-tree",
            tree: SemanticUITree(
                appIdentifier: "FixtureApp",
                scene: UITreeScene(
                    id: "baseline-screen",
                    kind: .screen,
                    rootNode: UITreeNode(id: "save-button", role: .button, label: "Save")
                )
            ),
            revision: 1
        )
        let networkRecord = RuntimeNetworkRequestRecord(
            id: "request-1",
            request: RuntimeNetworkRequest(
                method: "GET",
                url: "https://example.test/profile",
                headers: ["accept": "application/json"],
                bodyByteCount: 0
            ),
            response: RuntimeNetworkResponse(
                status: 200,
                headers: ["content-type": "application/json"],
                bodyByteCount: 18
            ),
            source: .fixture("profile-success")
        )
        let bundle = RuntimeArtifactBundle(
            sessionID: "session-1",
            renderArtifacts: [screenshot, render],
            semanticSnapshots: [semanticSnapshot],
            logs: [RuntimeAutomationLogEntry(level: .info, message: "Launched fixture strict-mode-baseline")],
            networkRecords: [networkRecord]
        )

        #expect(bundle.sessionID == "session-1")
        #expect(bundle.renderArtifacts.map(\.name) == ["baseline-home", "baseline-render"])
        #expect(bundle.renderArtifacts.first?.viewport.width == 393)
        #expect(bundle.semanticSnapshots.first?.tree.scene.rootNode?.id == "save-button")
        #expect(bundle.logs.first?.message == "Launched fixture strict-mode-baseline")
        #expect(bundle.networkRecords.first?.request.url == "https://example.test/profile")
        #expect(bundle.networkRecords.first?.response.status == 200)
        #expect(bundle.networkRecords.first?.source == .fixture("profile-success"))
    }

    @Test("runtime coordinator records deterministic network fixture responses")
    func runtimeNetworkFixtureContract() throws {
        var coordinator = RuntimeAutomationCoordinator()
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        networkFixtures: [
                            RuntimeNetworkFixture(
                                id: "profile-success",
                                method: "GET",
                                url: "https://example.test/profile",
                                response: RuntimeNetworkResponse(
                                    status: 200,
                                    headers: ["content-type": "application/json"],
                                    bodyByteCount: 18
                                )
                            )
                        ]
                    )
                )
            )
        )

        let response = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-network",
                command: .recordNetworkRequest(
                    RuntimeNetworkRequest(
                        method: "GET",
                        url: "https://example.test/profile",
                        headers: ["accept": "application/json"],
                        bodyByteCount: 0
                    )
                )
            )
        )

        guard case let .networkRecord(record) = response.result else {
            Issue.record("expected network record")
            return
        }

        #expect(record.id == "request-1")
        #expect(record.request.method == "GET")
        #expect(record.response.status == 200)
        #expect(record.source == .fixture("profile-success"))
        #expect(coordinator.session?.artifactBundle.networkRecords == [record])
    }

    @Test("runtime coordinator records network misses and request metadata deterministically")
    func runtimeNetworkFixtureMissesAndOrderingAreDeterministic() throws {
        var coordinator = RuntimeAutomationCoordinator()
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        networkFixtures: [
                            RuntimeNetworkFixture(
                                id: "profile-success",
                                method: "GET",
                                url: "https://example.test/profile",
                                response: RuntimeNetworkResponse(
                                    status: 200,
                                    headers: [
                                        "cache-control": "no-store",
                                        "content-type": "application/json",
                                    ],
                                    bodyByteCount: 18
                                )
                            ),
                            RuntimeNetworkFixture(
                                id: "profile-update",
                                method: "POST",
                                url: "https://example.test/profile",
                                response: RuntimeNetworkResponse(
                                    status: 202,
                                    headers: ["content-type": "application/json"],
                                    bodyByteCount: 2
                                )
                            ),
                        ]
                    )
                )
            )
        )

        let first = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-network-1",
                command: .recordNetworkRequest(
                    RuntimeNetworkRequest(
                        method: "GET",
                        url: "https://example.test/profile",
                        headers: ["accept": "application/json"],
                        bodyByteCount: 0
                    )
                )
            )
        )
        let second = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-network-2",
                command: .recordNetworkRequest(
                    RuntimeNetworkRequest(
                        method: "POST",
                        url: "https://example.test/profile",
                        headers: [
                            "content-type": "application/json",
                            "x-test-run": "runtime-network",
                        ],
                        bodyByteCount: 42
                    )
                )
            )
        )
        let missing = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-network-3",
                command: .recordNetworkRequest(
                    RuntimeNetworkRequest(
                        method: "DELETE",
                        url: "https://example.test/profile",
                        headers: ["authorization": "Bearer fixture-token"],
                        bodyByteCount: 0
                    )
                )
            )
        )

        guard case let .networkRecord(firstRecord) = first.result else {
            Issue.record("expected first network record")
            return
        }
        guard case let .networkRecord(secondRecord) = second.result else {
            Issue.record("expected second network record")
            return
        }
        guard case let .networkRecord(missingRecord) = missing.result else {
            Issue.record("expected missing network record")
            return
        }

        #expect(firstRecord.id == "request-1")
        #expect(firstRecord.source == .fixture("profile-success"))
        #expect(firstRecord.request.headers["accept"] == "application/json")
        #expect(firstRecord.response.headers["cache-control"] == "no-store")
        #expect(firstRecord.response.bodyByteCount == 18)

        #expect(secondRecord.id == "request-2")
        #expect(secondRecord.source == .fixture("profile-update"))
        #expect(secondRecord.request.headers["x-test-run"] == "runtime-network")
        #expect(secondRecord.request.bodyByteCount == 42)
        #expect(secondRecord.response.status == 202)

        #expect(missingRecord.id == "request-3")
        #expect(missingRecord.source == .missingFixture)
        #expect(missingRecord.request.headers["authorization"] == "Bearer fixture-token")
        #expect(missingRecord.response.status == 599)
        #expect(missingRecord.response.headers.isEmpty)
        #expect(missingRecord.response.bodyByteCount == 0)
        #expect(coordinator.session?.artifactBundle.networkRecords.map(\.id) == [
            "request-1",
            "request-2",
            "request-3",
        ])
        #expect(coordinator.session?.artifactBundle.networkRecords.map(\.request.method) == [
            "GET",
            "POST",
            "DELETE",
        ])
    }

    @Test("runtime launch configuration carries deterministic device simulation settings")
    func runtimeDeviceSimulationSettingsContract() throws {
        let settings = RuntimeDeviceSettings(
            viewport: RuntimeDeviceViewport(width: 393, height: 852, scale: 3),
            colorScheme: .dark,
            locale: "en_US",
            clock: RuntimeDeviceClock(frozenAtISO8601: "2026-04-27T14:00:00Z", timeZone: "America/New_York"),
            geolocation: RuntimeDeviceGeolocation(latitude: 40.7128, longitude: -74.0060, accuracyMeters: 12),
            network: RuntimeDeviceNetworkState(isOnline: true, latencyMilliseconds: 25, downloadKbps: 1_500)
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        device: settings
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(session.device.viewport.width == 393)
        #expect(session.device.colorScheme == .dark)
        #expect(session.device.locale == "en_US")
        #expect(session.device.clock.timeZone == "America/New_York")
        #expect(session.device.geolocation?.accuracyMeters == 12)
        #expect(session.device.network.latencyMilliseconds == 25)
        #expect(coordinator.bridge.latestSnapshot?.device == settings)
    }

    @Test("runtime launch defaults provide stable device simulation metadata")
    func runtimeDeviceSimulationDefaultsAreStable() throws {
        let configuration = RuntimeAutomationLaunchConfiguration(
            appIdentifier: "FixtureApp",
            fixtureName: "strict-mode-baseline"
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(configuration)
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(configuration.device.viewport == RuntimeDeviceViewport(width: 393, height: 852, scale: 3))
        #expect(configuration.device.colorScheme == .light)
        #expect(configuration.device.locale == "en_US")
        #expect(configuration.device.clock == RuntimeDeviceClock(frozenAtISO8601: nil, timeZone: "UTC"))
        #expect(configuration.device.geolocation == nil)
        #expect(configuration.device.network == RuntimeDeviceNetworkState(isOnline: true, latencyMilliseconds: 0, downloadKbps: 0))
        #expect(session.device == configuration.device)
        #expect(session.snapshot.device == configuration.device)
        #expect(coordinator.bridge.latestSnapshot?.device == configuration.device)
    }

    @Test("runtime device simulation metadata persists through interactions and semantic snapshots")
    func runtimeDeviceSimulationMetadataPersistsThroughRuntimeState() throws {
        let settings = RuntimeDeviceSettings(
            viewport: RuntimeDeviceViewport(width: 430, height: 932, scale: 3),
            colorScheme: .dark,
            locale: "fr_FR",
            clock: RuntimeDeviceClock(frozenAtISO8601: "2026-04-28T09:30:00Z", timeZone: "Europe/Paris"),
            geolocation: RuntimeDeviceGeolocation(latitude: 48.8566, longitude: 2.3522, accuracyMeters: 8),
            network: RuntimeDeviceNetworkState(isOnline: false, latencyMilliseconds: 150, downloadKbps: 0)
        )
        var coordinator = RuntimeAutomationCoordinator()
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        device: settings
                    )
                )
            )
        )

        let fill = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-fill",
                command: .fill(
                    RuntimeAutomationSemanticQuery(identifier: "name-field"),
                    text: "Camille"
                )
            )
        )
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-tree",
                command: .semanticSnapshot()
            )
        )

        guard case let .interactionCompleted(snapshot, _) = fill.result else {
            Issue.record("expected interaction result")
            return
        }

        #expect(snapshot.device == settings)
        #expect(coordinator.session?.device == settings)
        #expect(coordinator.session?.snapshot.device == settings)
        #expect(coordinator.bridge.latestSnapshot?.device == settings)
        #expect(coordinator.session?.artifactBundle.semanticSnapshots.last?.revision == snapshot.revision)
        #expect(coordinator.session?.artifactBundle.semanticSnapshots.last?.tree.scene.rootNode?.children.first?.children.first?.children[1].children.first?.value == "Camille")
    }

    @Test("runtime screenshot artifacts retain launch-time viewport metadata")
    func runtimeScreenshotArtifactsRetainDeviceViewport() throws {
        let settings = RuntimeDeviceSettings(
            viewport: RuntimeDeviceViewport(width: 375, height: 812, scale: 2),
            colorScheme: .light,
            locale: "en_GB",
            clock: RuntimeDeviceClock(frozenAtISO8601: "2026-04-28T10:00:00Z", timeZone: "Europe/London"),
            geolocation: nil,
            network: RuntimeDeviceNetworkState(isOnline: true, latencyMilliseconds: 40, downloadKbps: 2_000)
        )
        var coordinator = RuntimeAutomationCoordinator()
        _ = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        device: settings
                    )
                )
            )
        )

        let screenshot = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-screenshot",
                command: .screenshot(name: "small-phone")
            )
        )

        guard case let .screenshot(metadata) = screenshot.result else {
            Issue.record("expected screenshot metadata")
            return
        }

        #expect(metadata.name == "small-phone")
        #expect(metadata.format == "png")
        #expect(metadata.byteCount == 0)
        #expect(coordinator.session?.artifactBundle.renderArtifacts.last?.name == "small-phone")
        #expect(coordinator.session?.artifactBundle.renderArtifacts.last?.viewport == settings.viewport)
        #expect(coordinator.session?.artifactBundle.renderArtifacts.last?.kind == .screenshot)
    }

    @Test("runtime native capability manifest exposes deterministic mock contract shapes")
    func runtimeNativeCapabilityManifestContract() throws {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .camera,
                    permissionState: .denied,
                    strictModeAlternative: "Configure a deterministic camera mock instead of requesting host camera access."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .location,
                    permissionState: .granted,
                    strictModeAlternative: "Use launch-time device geolocation or scripted location events."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .camera,
                    identifier: "front-camera-still",
                    payload: [
                        "mediaType": "image",
                        "fixtureName": "profile-photo",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .clipboard,
                    identifier: "pasteboard-text",
                    payload: [
                        "text": "Fixture clipboard",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .location,
                    name: "location-update",
                    atRevision: 2,
                    payload: [
                        "latitude": "40.7128",
                        "longitude": "-74.0060",
                    ]
                ),
            ],
            unsupportedSymbols: [
                RuntimeNativeUnsupportedSymbol(
                    symbolName: "AVCaptureSession.startRunning",
                    capability: .camera,
                    suggestedAdaptation: "Replace live capture with a camera fixture in the native capability manifest."
                ),
            ],
            artifactOutputs: [
                RuntimeNativeCapabilityArtifactOutput(
                    capability: .camera,
                    name: "captured-profile-photo",
                    kind: .fixtureReference
                ),
            ]
        )

        #expect(manifest.requiredCapabilities.map(\.id) == [.camera, .location])
        #expect(manifest.requiredCapabilities.map(\.permissionState) == [.denied, .granted])
        #expect(manifest.configuredMocks.map(\.capability) == [.camera, .clipboard])
        #expect(manifest.configuredMocks.first?.payload["fixtureName"] == "profile-photo")
        #expect(manifest.scriptedEvents.first?.payload["latitude"] == "40.7128")
        #expect(manifest.unsupportedSymbols.first?.capability == .camera)
        #expect(manifest.artifactOutputs.first?.kind == .fixtureReference)

        let defaults = RuntimeNativeCapabilityManifest()
        #expect(defaults.requiredCapabilities.isEmpty)
        #expect(defaults.configuredMocks.isEmpty)
        #expect(defaults.scriptedEvents.isEmpty)
        #expect(defaults.unsupportedSymbols.isEmpty)
        #expect(defaults.artifactOutputs.isEmpty)
        #expect(defaults.permissionState(for: .notifications) == .unsupported)
    }

    @Test("runtime native capability taxonomy keeps canonical raw values")
    func runtimeNativeCapabilityTaxonomyKeepsCanonicalRawValues() {
        let capabilityIDs: [RuntimeNativeCapabilityID] = [
            .permissions,
            .camera,
            .photos,
            .location,
            .network,
            .clipboard,
            .keyboardInput,
            .files,
            .shareSheet,
            .notifications,
            .deviceEnvironment,
            .sensors,
            .haptics,
            .unsupported,
        ]
        let permissionStates: [RuntimeNativePermissionState] = [
            .unsupported,
            .notRequested,
            .prompt,
            .granted,
            .denied,
            .restricted,
        ]
        let artifactKinds: [RuntimeNativeCapabilityArtifactOutput.Kind] = [
            .fixtureReference,
            .eventLog,
            .diagnostic,
            .semanticSnapshot,
        ]

        #expect(capabilityIDs.map(\.rawValue) == [
            "permissions",
            "camera",
            "photos",
            "location",
            "network",
            "clipboard",
            "keyboardInput",
            "files",
            "shareSheet",
            "notifications",
            "deviceEnvironment",
            "sensors",
            "haptics",
            "unsupported",
        ])
        #expect(permissionStates.map(\.rawValue) == [
            "unsupported",
            "notRequested",
            "prompt",
            "granted",
            "denied",
            "restricted",
        ])
        #expect(artifactKinds.map(\.rawValue) == [
            "fixtureReference",
            "eventLog",
            "diagnostic",
            "semanticSnapshot",
        ])
    }

    @Test("runtime native capability permission lookup preserves explicit states and unsupported defaults")
    func runtimeNativeCapabilityPermissionLookupPreservesStates() {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .permissions,
                    permissionState: .notRequested,
                    strictModeAlternative: "Declare permission fixtures before runtime launch."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .camera,
                    permissionState: .prompt,
                    strictModeAlternative: "Script the camera prompt outcome in the manifest."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .photos,
                    permissionState: .granted,
                    strictModeAlternative: "Use configured photo fixtures."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .location,
                    permissionState: .denied,
                    strictModeAlternative: "Use scripted location denial events."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .network,
                    permissionState: .restricted,
                    strictModeAlternative: "Use deterministic network fixtures."
                ),
            ]
        )

        #expect(manifest.permissionState(for: .permissions) == .notRequested)
        #expect(manifest.permissionState(for: .camera) == .prompt)
        #expect(manifest.permissionState(for: .photos) == .granted)
        #expect(manifest.permissionState(for: .location) == .denied)
        #expect(manifest.permissionState(for: .network) == .restricted)
        #expect(manifest.permissionState(for: .keyboardInput) == .unsupported)
    }

    @Test("runtime automation launch and session carry native capability manifests without host side effects")
    func runtimeAutomationCarriesNativeCapabilityManifest() throws {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .notifications,
                    permissionState: .prompt,
                    strictModeAlternative: "Script notification delivery through deterministic native capability events."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .network,
                    identifier: "offline-mode",
                    payload: [
                        "isOnline": "false",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-delivered",
                    atRevision: 3,
                    payload: [
                        "title": "Reminder",
                    ]
                ),
            ],
            unsupportedSymbols: [
                RuntimeNativeUnsupportedSymbol(
                    symbolName: "UNUserNotificationCenter.current",
                    capability: .notifications,
                    suggestedAdaptation: "Declare notification mocks in the manifest."
                ),
            ],
            artifactOutputs: [
                RuntimeNativeCapabilityArtifactOutput(
                    capability: .notifications,
                    name: "notification-log",
                    kind: .eventLog
                ),
            ]
        )
        let configuration = RuntimeAutomationLaunchConfiguration(
            appIdentifier: "FixtureApp",
            fixtureName: "strict-mode-baseline",
            nativeCapabilities: manifest
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch-native-capabilities",
                command: .launch(configuration)
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(configuration.nativeCapabilities == manifest)
        #expect(session.nativeCapabilities == manifest)
        #expect(coordinator.session?.nativeCapabilities == manifest)
        #expect(session.nativeCapabilities.permissionState(for: .notifications) == .prompt)
        #expect(session.nativeCapabilities.configuredMocks.first?.payload["isOnline"] == "false")
        #expect(session.nativeCapabilities.artifactOutputs.first?.kind == .eventLog)
    }

    @Test("runtime native service red contract exposes mock state events and artifacts")
    func runtimeNativeServiceRedContractExposesMockStateEventsAndArtifacts() throws {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .camera,
                    permissionState: .prompt,
                    strictModeAlternative: "Use a fixture-backed camera capture instead of host camera access."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .photos,
                    permissionState: .granted,
                    strictModeAlternative: "Use configured photo library fixtures."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .location,
                    permissionState: .granted,
                    strictModeAlternative: "Use scripted location updates."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .notifications,
                    permissionState: .prompt,
                    strictModeAlternative: "Record deterministic notification authorization and delivery events."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .camera,
                    identifier: "front-camera-still",
                    payload: [
                        "fixtureName": "profile-photo",
                        "mediaType": "image",
                        "result": "granted",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .photos,
                    identifier: "recent-library-pick",
                    payload: [
                        "fixtureName": "gallery-selection",
                        "assetIdentifiers": "profile-photo,receipt-photo",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .clipboard,
                    identifier: "pasteboard-text",
                    payload: [
                        "text": "Fixture clipboard",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .keyboardInput,
                    identifier: "name-entry",
                    payload: [
                        "focusedElementID": "name-field",
                        "keyboardType": "default",
                        "returnKey": "done",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .files,
                    identifier: "document-picker",
                    payload: [
                        "selectedFiles": "Fixtures/profile.pdf",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .shareSheet,
                    identifier: "share-receipt",
                    payload: [
                        "activityType": "copy",
                        "items": "Fixtures/profile.pdf",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .location,
                    name: "location-update",
                    atRevision: 2,
                    payload: [
                        "latitude": "40.7128",
                        "longitude": "-74.0060",
                        "accuracyMeters": "12",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-scheduled",
                    atRevision: 3,
                    payload: [
                        "identifier": "trip-reminder",
                        "title": "Trip Reminder",
                    ]
                ),
            ],
            artifactOutputs: [
                RuntimeNativeCapabilityArtifactOutput(
                    capability: .camera,
                    name: "captured-profile-photo",
                    kind: .fixtureReference
                ),
                RuntimeNativeCapabilityArtifactOutput(
                    capability: .location,
                    name: "native-location-events",
                    kind: .eventLog
                ),
                RuntimeNativeCapabilityArtifactOutput(
                    capability: .notifications,
                    name: "notification-records",
                    kind: .eventLog
                ),
            ]
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch-native-services",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        nativeCapabilities: manifest
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(reflectedChild(named: "nativeCapabilityState", in: session) != nil)
        #expect(reflectedChild(named: "nativeCapabilityEvents", in: session) != nil)
        #expect(reflectedChild(named: "nativeCapabilityRecords", in: session.artifactBundle) != nil)
        #expect(session.nativeCapabilityState.permissions.first { $0.capability == .camera }?.state == .prompt)
        #expect(session.nativeCapabilityState.permissions.first { $0.capability == .camera }?.promptResult == .granted)
        #expect(session.nativeCapabilityState.fixtureOutputs.first { $0.capability == .camera }?.fixtureName == "profile-photo")
        #expect(session.nativeCapabilityState.clipboard?.text == "Fixture clipboard")
        #expect(session.nativeCapabilityState.keyboard?.focusedElementID == "name-field")
        #expect(session.nativeCapabilityState.fileSelections.first?.selectedFiles == ["Fixtures/profile.pdf"])
        #expect(session.nativeCapabilityState.shareSheetRecords.first?.activityType == "copy")
        #expect(session.nativeCapabilityState.notificationRecords.first?.identifier == "trip-reminder")
        #expect(session.nativeCapabilityEvents.first { $0.capability == .location }?.payload["latitude"] == "40.7128")
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("notification-records"))
        #expect(session.logs.map(\.message).contains("native.permission.camera.prompt"))
        #expect(session.logs.map(\.message).contains("native.fixture.camera.front-camera-still"))
        #expect(session.logs.map(\.message).contains("native.event.location.location-update"))
        #expect(session.logs.map(\.message).contains("native.event.notifications.notification-scheduled"))
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.camera.fixture"] == "profile-photo")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.keyboard.focusedElementID"] == "name-field")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.notification.trip-reminder"] == "scheduled")
    }

    @Test("runtime native mocks model permission prompts fixture outputs and location state deterministically")
    func runtimeNativeMocksModelPermissionsFixturesAndLocationState() throws {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .camera,
                    permissionState: .prompt,
                    strictModeAlternative: "Use a fixture-backed camera capture instead of host camera access."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .photos,
                    permissionState: .granted,
                    strictModeAlternative: "Use fixture-backed photo picker selections."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .location,
                    permissionState: .granted,
                    strictModeAlternative: "Use launch-time location mocks and scripted location updates."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .files,
                    permissionState: .granted,
                    strictModeAlternative: "Use configured document picker fixtures."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .camera,
                    identifier: "front-camera-still",
                    payload: [
                        "fixtureName": "profile-photo",
                        "mediaType": "image",
                        "outputPath": "Fixtures/profile-photo.heic",
                        "result": "granted",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .photos,
                    identifier: "recent-library-pick",
                    payload: [
                        "fixtureName": "gallery-selection",
                        "assetIdentifiers": "profile-photo,receipt-photo",
                        "mediaTypes": "image",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .location,
                    identifier: "home-base",
                    payload: [
                        "latitude": "40.7128",
                        "longitude": "-74.0060",
                        "accuracyMeters": "12",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .location,
                    name: "location-update",
                    atRevision: 2,
                    payload: [
                        "latitude": "40.7130",
                        "longitude": "-74.0058",
                        "accuracyMeters": "10",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .location,
                    name: "location-update",
                    atRevision: 4,
                    payload: [
                        "latitude": "40.7134",
                        "longitude": "-74.0054",
                        "accuracyMeters": "8",
                    ]
                ),
            ]
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch-native-step-9-3",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        nativeCapabilities: manifest
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        let cameraPermission = session.nativeCapabilityState.permissions.first { $0.capability == .camera }
        #expect(cameraPermission?.state == .prompt)
        #expect(cameraPermission?.promptResult == .granted)
        #expect(cameraPermission?.resolvedState == .granted)
        #expect(session.nativeCapabilityState.permissionPrompts.first?.finalState == .granted)
        #expect(session.nativeCapabilityState.cameraCaptures.first?.fixtureName == "profile-photo")
        #expect(session.nativeCapabilityState.cameraCaptures.first?.outputPath == "Fixtures/profile-photo.heic")
        #expect(session.nativeCapabilityState.photoSelections.first?.assetIdentifiers == ["profile-photo", "receipt-photo"])
        #expect(session.nativeCapabilityState.location?.currentCoordinate?.latitude == 40.7134)
        #expect(session.nativeCapabilityState.location?.scriptedUpdates.map(\.atRevision) == [2, 4])
        #expect(session.logs.map(\.message).contains("native.permission.camera.prompt.granted"))
        #expect(session.logs.map(\.message).contains("native.camera.capture.front-camera-still"))
        #expect(session.logs.map(\.message).contains("native.photos.selection.recent-library-pick"))
        #expect(session.logs.map(\.message).contains("native.location.update.location-update.4"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("camera-capture-front-camera-still"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("photos-selection-recent-library-pick"))
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.permission.camera.state"] == "granted")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.photos.selection.recent-library-pick"] == "profile-photo,receipt-photo")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.location.latitude"] == "40.7134")

        let missingFixtureState = RuntimeNativeCapabilityState(
            manifest: RuntimeNativeCapabilityManifest(
                requiredCapabilities: [
                    RuntimeNativeCapabilityRequirement(
                        id: .camera,
                        permissionState: .granted,
                        strictModeAlternative: "Configure a deterministic camera fixture."
                    ),
                ],
                unsupportedSymbols: [
                    RuntimeNativeUnsupportedSymbol(
                        symbolName: "AVCaptureSession.startRunning",
                        capability: .camera,
                        suggestedAdaptation: "Replace live capture with a camera fixture in the native capability manifest."
                    ),
                ]
            )
        )

        #expect(missingFixtureState.diagnosticRecords.map(\.code).contains("missingFixture"))
        #expect(missingFixtureState.diagnosticRecords.map(\.code).contains("unsupportedSymbol"))
        #expect(missingFixtureState.artifactRecords.map(\.kind).contains(.diagnostic))
        #expect(missingFixtureState.logMessages.contains("native.diagnostic.camera.missingFixture"))
    }

    @Test("runtime native mocks model clipboard input files share sheet and notification records deterministically")
    func runtimeNativeMocksModelClipboardInputFilesShareSheetAndNotifications() throws {
        let manifest = RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .clipboard,
                    permissionState: .granted,
                    strictModeAlternative: "Use deterministic pasteboard fixtures."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .keyboardInput,
                    permissionState: .granted,
                    strictModeAlternative: "Use semantic input traits instead of host keyboard state."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .files,
                    permissionState: .granted,
                    strictModeAlternative: "Use deterministic document picker fixtures."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .shareSheet,
                    permissionState: .granted,
                    strictModeAlternative: "Record share sheet activity results without presenting native UI."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .notifications,
                    permissionState: .prompt,
                    strictModeAlternative: "Record deterministic local notification authorization and delivery events."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .clipboard,
                    identifier: "system-pasteboard",
                    payload: [
                        "text": "Initial clipboard",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .keyboardInput,
                    identifier: "email-entry",
                    payload: [
                        "focusedElementID": "name-field",
                        "keyboardType": "emailAddress",
                        "returnKey": "send",
                        "textContentType": "emailAddress",
                        "autocorrection": "no",
                        "secureTextEntry": "false",
                        "isVisible": "true",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .files,
                    identifier: "document-picker",
                    payload: [
                        "selectedFiles": "Fixtures/profile.pdf, Fixtures/receipt.pdf",
                        "contentTypes": "com.adobe.pdf, public.image",
                        "allowsMultipleSelection": "true",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .shareSheet,
                    identifier: "share-receipt",
                    payload: [
                        "activityType": "com.apple.UIKit.activity.Mail",
                        "items": "Fixtures/profile.pdf, Summary",
                        "completionState": "completed",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .notifications,
                    identifier: "notification-permission",
                    payload: [
                        "result": "granted",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .clipboard,
                    name: "clipboard-read",
                    atRevision: 2,
                    payload: [
                        "text": "Initial clipboard",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .clipboard,
                    name: "clipboard-write",
                    atRevision: 3,
                    payload: [
                        "text": "Updated clipboard",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-scheduled",
                    atRevision: 4,
                    payload: [
                        "identifier": "trip-reminder",
                        "title": "Trip Reminder",
                        "body": "Leave for the airport",
                        "trigger": "2026-05-01T09:00:00Z",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-delivered",
                    atRevision: 5,
                    payload: [
                        "identifier": "trip-reminder",
                        "title": "Trip Reminder",
                    ]
                ),
            ]
        )
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch-native-step-9-4",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        nativeCapabilities: manifest
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        #expect(session.nativeCapabilityState.clipboard?.initialText == "Initial clipboard")
        #expect(session.nativeCapabilityState.clipboard?.currentText == "Updated clipboard")
        #expect(session.nativeCapabilityState.clipboard?.readRecords.first?.text == "Initial clipboard")
        #expect(session.nativeCapabilityState.clipboard?.writeRecords.first?.text == "Updated clipboard")
        #expect(session.nativeCapabilityState.keyboard?.inputTraits.first?.textContentType == "emailAddress")
        #expect(session.nativeCapabilityState.keyboard?.inputTraits.first?.isVisible == true)
        #expect(session.nativeCapabilityState.fileSelections.first?.contentTypes == ["com.adobe.pdf", "public.image"])
        #expect(session.nativeCapabilityState.fileSelections.first?.allowsMultipleSelection == true)
        #expect(session.nativeCapabilityState.shareSheetRecords.first?.items == ["Fixtures/profile.pdf", "Summary"])
        #expect(session.nativeCapabilityState.shareSheetRecords.first?.completionState == "completed")
        #expect(session.nativeCapabilityState.notificationRecords.map(\.state) == ["scheduled", "delivered"])
        #expect(session.nativeCapabilityState.notificationRecords.first?.authorizationState == .granted)
        #expect(session.logs.map(\.message).contains("native.clipboard.write.clipboard-write.3"))
        #expect(session.logs.map(\.message).contains("native.keyboard.input.email-entry"))
        #expect(session.logs.map(\.message).contains("native.files.selection.document-picker"))
        #expect(session.logs.map(\.message).contains("native.shareSheet.record.share-receipt"))
        #expect(session.logs.map(\.message).contains("native.notifications.delivered.trip-reminder"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("clipboard-records"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("keyboard-input-email-entry"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("files-selection-document-picker"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("share-sheet-share-receipt"))
        #expect(session.artifactBundle.nativeCapabilityRecords.map(\.name).contains("notification-delivered-trip-reminder"))
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.clipboard.currentText"] == "Updated clipboard")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.keyboard.type"] == "emailAddress")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.files.selection.document-picker"] == "Fixtures/profile.pdf,Fixtures/receipt.pdf")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.shareSheet.share-receipt.activityType"] == "com.apple.UIKit.activity.Mail")
        #expect(session.snapshot.tree.scene.rootNode?.metadata["native.notification.trip-reminder"] == "delivered")
    }

    @Test("runtime native mock regression covers representative strict-mode baseline flow")
    func runtimeNativeMockRegressionCoversRepresentativeStrictModeBaselineFlow() throws {
        var coordinator = RuntimeAutomationCoordinator()
        let launch = try coordinator.handle(
            RuntimeAutomationRequest(
                id: "req-launch-native-step-9-8",
                command: .launch(
                    RuntimeAutomationLaunchConfiguration(
                        appIdentifier: "FixtureApp",
                        fixtureName: "strict-mode-baseline",
                        nativeCapabilities: representativeNativeMockManifest()
                    )
                )
            )
        )

        guard case let .launched(session) = launch.result else {
            Issue.record("expected launch result")
            return
        }

        let metadata = session.snapshot.tree.scene.rootNode?.metadata ?? [:]
        let artifactNames = session.artifactBundle.nativeCapabilityRecords.map(\.name)
        let logMessages = session.logs.map(\.message)

        #expect(session.nativeCapabilityState.permissions.first { $0.capability == .camera }?.resolvedState == .granted)
        #expect(session.nativeCapabilityState.permissions.first { $0.capability == .notifications }?.resolvedState == .granted)
        #expect(session.nativeCapabilityState.cameraCaptures.first?.fixtureName == "profile-photo")
        #expect(session.nativeCapabilityState.cameraCaptures.first?.outputPath == "Fixtures/profile-photo.heic")
        #expect(session.nativeCapabilityState.photoSelections.first?.assetIdentifiers == ["profile-photo", "receipt-photo"])
        #expect(session.nativeCapabilityState.location?.currentCoordinate?.latitude == 40.7134)
        #expect(session.nativeCapabilityState.location?.currentCoordinate?.accuracyMeters == 18)
        #expect(session.nativeCapabilityState.clipboard?.initialText == "Draft profile notes")
        #expect(session.nativeCapabilityState.clipboard?.currentText == "Updated profile notes")
        #expect(session.nativeCapabilityState.clipboard?.readRecords.first?.text == "Draft profile notes")
        #expect(session.nativeCapabilityState.keyboard?.inputTraits.first?.focusedElementID == "name-field")
        #expect(session.nativeCapabilityState.keyboard?.inputTraits.first?.textContentType == "name")
        #expect(session.nativeCapabilityState.fileSelections.first?.selectedFiles == ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"])
        #expect(session.nativeCapabilityState.fileSelections.first?.allowsMultipleSelection == true)
        #expect(session.nativeCapabilityState.shareSheetRecords.first?.activityType == "com.apple.UIKit.activity.Mail")
        #expect(session.nativeCapabilityState.shareSheetRecords.first?.completionState == "completed")
        #expect(session.nativeCapabilityState.notificationRecords.map(\.state) == ["scheduled", "delivered"])
        #expect(session.nativeCapabilityState.notificationRecords.last?.identifier == "profile-reminder")
        #expect(session.nativeCapabilityState.notificationRecords.last?.authorizationState == .granted)
        #expect(session.nativeCapabilityState.diagnosticRecords.first?.payload["symbolName"] == "LAContext.evaluatePolicy")
        #expect(session.nativeCapabilityEvents.map(\.name) == [
            "location-update",
            "clipboard-read",
            "clipboard-write",
            "notification-scheduled",
            "notification-delivered",
        ])

        #expect(logMessages.contains("native.permission.camera.prompt.granted"))
        #expect(logMessages.contains("native.camera.capture.front-camera-still"))
        #expect(logMessages.contains("native.photos.selection.recent-library-pick"))
        #expect(logMessages.contains("native.location.update.location-update.2"))
        #expect(logMessages.contains("native.clipboard.write.clipboard-write.3"))
        #expect(logMessages.contains("native.keyboard.input.name-entry"))
        #expect(logMessages.contains("native.files.selection.document-picker"))
        #expect(logMessages.contains("native.shareSheet.record.share-receipt"))
        #expect(logMessages.contains("native.notifications.delivered.profile-reminder"))
        #expect(logMessages.contains("native.diagnostic.unsupported.unsupportedSymbol"))

        #expect(artifactNames.contains("camera-capture-front-camera-still"))
        #expect(artifactNames.contains("photos-selection-recent-library-pick"))
        #expect(artifactNames.contains("location-scripted-events"))
        #expect(artifactNames.contains("clipboard-records"))
        #expect(artifactNames.contains("keyboard-input-name-entry"))
        #expect(artifactNames.contains("files-selection-document-picker"))
        #expect(artifactNames.contains("share-sheet-share-receipt"))
        #expect(artifactNames.contains("notification-delivered-profile-reminder"))
        #expect(artifactNames.contains("unsupported-diagnostic-unsupportedSymbol"))

        #expect(metadata["native.permission.camera.state"] == "granted")
        #expect(metadata["native.camera.fixture"] == "profile-photo")
        #expect(metadata["native.photos.selection.recent-library-pick"] == "profile-photo,receipt-photo")
        #expect(metadata["native.location.latitude"] == "40.7134")
        #expect(metadata["native.clipboard.currentText"] == "Updated profile notes")
        #expect(metadata["native.keyboard.focusedElementID"] == "name-field")
        #expect(metadata["native.files.selection.document-picker"] == "Fixtures/profile.pdf,Fixtures/receipt.pdf")
        #expect(metadata["native.shareSheet.share-receipt.activityType"] == "com.apple.UIKit.activity.Mail")
        #expect(metadata["native.notification.profile-reminder"] == "delivered")
    }

    @Test("runtime app loader retains compatibility-lowered semantic trees")
    func loaderRetainsCompatibilityLoweredTree() throws {
        let analyzer = CompatibilityAnalyzer(matrix: .v1)
        let analysis = try analyzer.analyze(
            .fixturePath("tests/fixtures/compatibility/SupportedSubsetFixture.swift")
        )
        guard let tree = analysis.loweredTree else {
            Issue.record("expected compatibility analysis to produce a lowered semantic tree")
            return
        }

        let loader = RuntimeAppLoader()
        let snapshot = loader.loadCompatibilityTree(tree)

        #expect(snapshot.appIdentifier == "SupportedSubsetFixture")
        #expect(snapshot.lifecycleState == .active)
        #expect(snapshot.tree.scene.kind == .modal)
        #expect(snapshot.tree.scene.rootNode?.id == "compatibility-modal")
        #expect(snapshot.tree.scene.rootNode?.children.first?.id == "compatibility-stack")
        #expect(snapshot.tree.scene.rootNode?.children.first?.children.map(\.id.rawValue) == [
            "compatibility-text",
            "compatibility-button",
        ])
        #expect(snapshot.tree.scene.modalState?.presentedNode?.id == "compatibility-modal")
    }

    private func representativeNativeMockManifest() -> RuntimeNativeCapabilityManifest {
        RuntimeNativeCapabilityManifest(
            requiredCapabilities: [
                RuntimeNativeCapabilityRequirement(
                    id: .camera,
                    permissionState: .prompt,
                    strictModeAlternative: "Use a deterministic camera fixture instead of live capture."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .photos,
                    permissionState: .granted,
                    strictModeAlternative: "Use photo picker fixtures instead of reading the host photo library."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .location,
                    permissionState: .granted,
                    strictModeAlternative: "Script deterministic coordinates instead of using CoreLocation."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .clipboard,
                    permissionState: .granted,
                    strictModeAlternative: "Use deterministic clipboard fixtures instead of host pasteboard access."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .keyboardInput,
                    permissionState: .granted,
                    strictModeAlternative: "Use semantic input traits instead of host keyboard state."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .files,
                    permissionState: .granted,
                    strictModeAlternative: "Use deterministic file picker fixtures instead of host document UI."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .shareSheet,
                    permissionState: .granted,
                    strictModeAlternative: "Record share sheet outcomes instead of presenting native UI."
                ),
                RuntimeNativeCapabilityRequirement(
                    id: .notifications,
                    permissionState: .prompt,
                    strictModeAlternative: "Record notification schedules instead of using a platform notification center."
                ),
            ],
            configuredMocks: [
                RuntimeNativeCapabilityMock(
                    capability: .camera,
                    identifier: "front-camera-still",
                    payload: [
                        "result": "granted",
                        "fixtureName": "profile-photo",
                        "mediaType": "image",
                        "outputPath": "Fixtures/profile-photo.heic",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .photos,
                    identifier: "recent-library-pick",
                    payload: [
                        "fixtureName": "recent-library",
                        "assetIdentifiers": "profile-photo,receipt-photo",
                        "mediaTypes": "image",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .location,
                    identifier: "initial-location",
                    payload: [
                        "latitude": "40.7128",
                        "longitude": "-74.0060",
                        "accuracyMeters": "25",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .clipboard,
                    identifier: "clipboard",
                    payload: [
                        "initialText": "Draft profile notes",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .keyboardInput,
                    identifier: "name-entry",
                    payload: [
                        "focusedElementID": "name-field",
                        "keyboardType": "default",
                        "returnKey": "done",
                        "textContentType": "name",
                        "isVisible": "true",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .files,
                    identifier: "document-picker",
                    payload: [
                        "selectedFiles": "Fixtures/profile.pdf,Fixtures/receipt.pdf",
                        "contentTypes": "com.adobe.pdf,public.image",
                        "allowsMultipleSelection": "true",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .shareSheet,
                    identifier: "share-receipt",
                    payload: [
                        "activityType": "com.apple.UIKit.activity.Mail",
                        "items": "Fixtures/profile.pdf,Summary",
                        "completionState": "completed",
                    ]
                ),
                RuntimeNativeCapabilityMock(
                    capability: .notifications,
                    identifier: "notification-permission",
                    payload: [
                        "result": "granted",
                    ]
                ),
            ],
            scriptedEvents: [
                RuntimeNativeCapabilityEvent(
                    capability: .location,
                    name: "location-update",
                    atRevision: 2,
                    payload: [
                        "latitude": "40.7134",
                        "longitude": "-74.0059",
                        "accuracyMeters": "18",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .clipboard,
                    name: "clipboard-read",
                    atRevision: 2,
                    payload: [:]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .clipboard,
                    name: "clipboard-write",
                    atRevision: 3,
                    payload: [
                        "text": "Updated profile notes",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-scheduled",
                    atRevision: 4,
                    payload: [
                        "identifier": "profile-reminder",
                        "title": "Profile Reminder",
                        "body": "Review the saved profile.",
                        "trigger": "2026-04-28T12:15:00Z",
                    ]
                ),
                RuntimeNativeCapabilityEvent(
                    capability: .notifications,
                    name: "notification-delivered",
                    atRevision: 5,
                    payload: [
                        "identifier": "profile-reminder",
                        "title": "Profile Reminder",
                        "body": "Review the saved profile.",
                    ]
                ),
            ],
            unsupportedSymbols: [
                RuntimeNativeUnsupportedSymbol(
                    symbolName: "LAContext.evaluatePolicy",
                    capability: .unsupported,
                    suggestedAdaptation: "Biometric policy evaluation is not part of the strict-mode native mock contract."
                ),
            ]
        )
    }

    private func reflectedChild(named name: String, in value: Any) -> Any? {
        Mirror(reflecting: value).children.first { $0.label == name }?.value
    }
}
