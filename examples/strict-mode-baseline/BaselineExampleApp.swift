import StrictModeSDK

struct BaselineExampleApp: App {
    var body: some Scene {
        Alert(
            "Strict Mode Skeleton",
            message: "Phase 1 exports compile-time entry points only."
        )
    }
}

struct BaselineExampleCatalog {
    let title = Text("Hello from strict mode")
    let primaryAction = Button()
    let nameField = TextField("Name", text: "Taylor")
    let list = List()
    let verticalStack = VStack()
    let horizontalStack = HStack()
    let navigation = NavigationStack()
    let modal = Modal()
    let tabs = TabView()
    let localState = State()
}
