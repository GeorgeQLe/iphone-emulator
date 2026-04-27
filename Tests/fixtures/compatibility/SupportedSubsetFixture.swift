import SwiftUI

struct SupportedSubsetFixture: View {
    @State private var taps = 0

    var body: some View {
        VStack {
            Text("Supported subset")
            Button("Tap me")
        }
    }
}
