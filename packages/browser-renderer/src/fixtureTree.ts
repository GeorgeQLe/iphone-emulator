import type { SemanticUITree } from "./types";

export const baselineFixtureTree: SemanticUITree = {
  appIdentifier: "BaselineFixtureApp",
  scene: {
    id: "baseline-screen",
    kind: "screen",
    navigationState: {
      stackIdentifiers: ["baseline-screen", "details-screen"],
      selectedIdentifier: "baseline-screen",
    },
    modalState: {
      isPresented: true,
      presentedNode: {
        id: "welcome-modal",
        role: "modal",
        label: "Welcome",
        children: [
          {
            id: "welcome-modal-body",
            role: "vStack",
            children: [
              {
                id: "welcome-modal-copy",
                role: "text",
                label: "Strict mode renderer fixture loaded.",
                children: [],
                metadata: {},
              },
              {
                id: "welcome-modal-button",
                role: "button",
                label: "Continue",
                children: [],
                metadata: {},
              },
            ],
            metadata: {
              spacing: "12",
            },
          },
        ],
        metadata: {},
      },
    },
    tabState: {
      tabIdentifiers: ["home-tab", "profile-tab"],
      selectedIdentifier: "home-tab",
    },
    alertPayload: {
      title: "Preview Mode",
      message: "Renderer output is deterministic for this fixed fixture.",
    },
    rootNode: {
      id: "root-stack",
      role: "navigationStack",
      label: "Home",
      children: [
        {
          id: "home-screen",
          role: "screen",
          label: "Home",
          children: [
            {
              id: "page-layout",
              role: "vStack",
              children: [
                {
                  id: "headline",
                  role: "text",
                  label: "Hello from strict mode",
                  children: [],
                  metadata: {
                    emphasis: "headline",
                  },
                },
                {
                  id: "profile-row",
                  role: "hStack",
                  children: [
                    {
                      id: "name-field",
                      role: "textField",
                      label: "Name",
                      value: "Taylor",
                      children: [],
                      metadata: {
                        placeholder: "Enter name",
                      },
                    },
                    {
                      id: "save-button",
                      role: "button",
                      label: "Save",
                      children: [],
                      metadata: {
                        variant: "primary",
                      },
                    },
                  ],
                  metadata: {
                    alignment: "center",
                  },
                },
                {
                  id: "items-list",
                  role: "list",
                  label: "Favorites",
                  children: [
                    {
                      id: "favorite-1",
                      role: "text",
                      label: "Messages",
                      children: [],
                      metadata: {},
                    },
                    {
                      id: "favorite-2",
                      role: "text",
                      label: "Calendar",
                      children: [],
                      metadata: {},
                    },
                  ],
                  metadata: {},
                },
                {
                  id: "tab-bar",
                  role: "tabView",
                  children: [
                    {
                      id: "home-tab",
                      role: "button",
                      label: "Home",
                      children: [],
                      metadata: {},
                    },
                    {
                      id: "profile-tab",
                      role: "button",
                      label: "Profile",
                      children: [],
                      metadata: {},
                    },
                  ],
                  metadata: {},
                },
              ],
              metadata: {
                spacing: "16",
              },
            },
          ],
          metadata: {},
        },
      ],
      metadata: {},
    },
  },
};
