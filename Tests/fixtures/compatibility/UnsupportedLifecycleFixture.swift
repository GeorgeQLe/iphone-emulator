import SwiftUI

struct UnsupportedLifecycleFixture: View {
    var body: some View {
        Text("Needs guidance")
            .onAppear {
                print("unsupported hook")
            }
            .padding()
    }
}
