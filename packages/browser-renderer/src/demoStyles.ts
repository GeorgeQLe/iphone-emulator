export const demoStyles = `
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f4f7fb;
  color: #17202a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

button,
select {
  font: inherit;
}

.demo-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(420px, 1fr) minmax(360px, 480px);
  background: #f4f7fb;
}

.demo-sidebar,
.demo-editor-pane,
.demo-preview-pane {
  min-width: 0;
  min-height: 100vh;
}

.demo-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d9e1ea;
  background: #ffffff;
}

.demo-brand {
  padding: 22px;
  border-bottom: 1px solid #d9e1ea;
}

.demo-brand h1 {
  margin: 0;
  font-size: 21px;
  line-height: 1.2;
}

.demo-brand p {
  margin: 8px 0 0;
  color: #5e6c7a;
  font-size: 13px;
  line-height: 1.45;
}

.demo-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.demo-file-button {
  width: 100%;
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  padding: 9px 10px;
  text-align: left;
  background: transparent;
  color: #23313f;
  cursor: pointer;
}

.demo-file-button:hover,
.demo-file-button[data-active="true"] {
  background: #e8f0f8;
}

.demo-sidebar-footer {
  margin-top: auto;
  padding: 16px 22px 22px;
  color: #5e6c7a;
  font-size: 12px;
  line-height: 1.5;
  border-top: 1px solid #d9e1ea;
}

.demo-editor-pane {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) minmax(150px, 24vh);
  border-right: 1px solid #d9e1ea;
  background: #101820;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #d9e1ea;
}

.demo-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #34495d;
}

.demo-run-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  min-height: 34px;
  padding: 8px 12px;
  background: #1677ff;
  color: #ffffff;
  font-weight: 650;
  cursor: pointer;
}

.demo-editor {
  min-height: 0;
}

.demo-output {
  overflow: auto;
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #d9e1ea;
}

.demo-output h2,
.demo-preview-header h2 {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.2;
  text-transform: uppercase;
  color: #526170;
}

.demo-diagnostic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.demo-diagnostic {
  border-radius: 6px;
  padding: 9px 10px;
  background: #f4f7fb;
  color: #334354;
  font-size: 13px;
  line-height: 1.4;
}

.demo-diagnostic[data-severity="error"] {
  background: #fff0f0;
  color: #a12626;
}

.demo-diagnostic[data-severity="warning"] {
  background: #fff7e3;
  color: #7a5300;
}

.demo-preview-pane {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) minmax(170px, 28vh);
  background: #e9eef4;
}

.demo-preview-header {
  padding: 16px;
  background: #ffffff;
  border-bottom: 1px solid #d9e1ea;
}

.demo-preview-header h2 {
  margin-bottom: 6px;
}

.demo-execution-mode {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  margin: 0 0 8px;
  border-radius: 6px;
  padding: 4px 8px;
  background: #e8f0f8;
  color: #23425f;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.2;
}

.demo-preview-header p {
  margin: 0;
  color: #5e6c7a;
  font-size: 13px;
  line-height: 1.45;
}

.demo-preview-stage {
  min-height: 0;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 24px 18px;
}

.demo-preview-stage [data-renderer-root] {
  align-items: flex-start;
}

.demo-preview-stage .phone-shell {
  transform: scale(0.78);
  transform-origin: top center;
  margin-bottom: -170px;
}

.demo-preview-stage .phone-surface {
  min-height: 790px;
}

.demo-keyboard {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: grid;
  gap: 7px;
  padding: 12px 10px 16px;
  border-top: 1px solid rgba(102, 116, 130, 0.24);
  background: rgba(214, 221, 229, 0.96);
  box-shadow: 0 -18px 38px rgba(23, 32, 42, 0.16);
  backdrop-filter: blur(18px);
}

.demo-keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.demo-key {
  min-width: 25px;
  min-height: 34px;
  border: 0;
  border-radius: 6px;
  background: #ffffff;
  color: #17202a;
  font-size: 15px;
  line-height: 1;
  box-shadow: 0 1px 0 rgba(23, 32, 42, 0.2);
  cursor: pointer;
}

.demo-key:focus-visible {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}

.demo-key[data-wide="true"] {
  min-width: 72px;
}

.demo-key[data-action="done"] {
  min-width: 58px;
  background: #1677ff;
  color: #ffffff;
  font-weight: 650;
}

.demo-inspector {
  overflow: auto;
  margin: 0;
  padding: 14px 16px;
  border-top: 1px solid #d9e1ea;
  background: #ffffff;
  color: #263442;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 1120px) {
  .demo-shell {
    grid-template-columns: 240px minmax(360px, 1fr);
  }

  .demo-preview-pane {
    grid-column: 1 / -1;
    min-height: 760px;
    border-top: 1px solid #d9e1ea;
  }
}

@media (max-width: 760px) {
  .demo-shell {
    display: block;
  }

  .demo-sidebar,
  .demo-editor-pane,
  .demo-preview-pane {
    min-height: auto;
  }

  .demo-editor-pane {
    grid-template-rows: auto 520px minmax(150px, auto);
  }

  .demo-preview-pane {
    grid-template-rows: auto 720px 260px;
  }
}
`;
