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
  overflow-x: hidden;
}

button,
select {
  font: inherit;
}

.demo-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(380px, 1fr) minmax(360px, 460px);
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
  grid-template-rows: auto minmax(0, 1fr) minmax(150px, clamp(160px, 24vh, 260px));
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
  grid-template-rows: auto minmax(0, 1fr) minmax(170px, clamp(180px, 28vh, 300px));
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
  padding: 20px 16px;
}

.demo-preview-stage [data-renderer-root] {
  align-items: flex-start;
}

.demo-preview-stage .phone-shell {
  transform: scale(clamp(0.68, calc((100vw - 660px) * 0.001470588), 0.78));
  transform-origin: top center;
  margin-bottom: calc(-220px * (1 - clamp(0.68, calc((100vw - 660px) * 0.001470588), 0.78)));
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
  padding: 12px clamp(6px, 2.2vw, 10px) 16px;
  border-top: 1px solid rgba(102, 116, 130, 0.24);
  background: rgba(214, 221, 229, 0.96);
  box-shadow: 0 -18px 38px rgba(23, 32, 42, 0.16);
  backdrop-filter: blur(18px);
}

.demo-keyboard-row {
  display: flex;
  justify-content: center;
  gap: clamp(3px, 1.3vw, 6px);
}

.demo-key {
  min-width: clamp(20px, 6.2vw, 25px);
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
  min-width: clamp(54px, 18vw, 72px);
}

.demo-key[data-action="done"] {
  min-width: clamp(50px, 15vw, 58px);
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
    grid-template-columns: 230px minmax(340px, 1fr);
  }

  .demo-preview-pane {
    grid-column: 1 / -1;
    min-height: min(820px, 100vh);
    border-top: 1px solid #d9e1ea;
  }

  .demo-preview-stage .phone-shell {
    transform: scale(0.82);
    margin-bottom: -150px;
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
    grid-template-rows: auto minmax(380px, 52vh) minmax(150px, auto);
  }

  .demo-preview-pane {
    grid-template-rows: auto minmax(560px, 72vh) minmax(220px, 32vh);
  }

  .demo-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .demo-run-button {
    width: 100%;
  }

  .demo-preview-stage {
    padding: 16px 10px;
  }

  .demo-preview-stage .phone-shell {
    transform: scale(min(0.78, calc((100vw - 24px) * 0.002347418)));
    margin-bottom: calc(-190px * (1 - min(0.78, calc((100vw - 24px) * 0.002347418))));
  }
}

@media (max-width: 430px) {
  .demo-brand,
  .demo-sidebar-footer,
  .demo-preview-header,
  .demo-output,
  .demo-inspector {
    padding-left: 14px;
    padding-right: 14px;
  }

  .demo-file-list {
    padding-left: 10px;
    padding-right: 10px;
  }

  .demo-preview-pane {
    grid-template-rows: auto minmax(520px, 68vh) minmax(220px, 34vh);
  }

  .demo-preview-stage .phone-shell {
    transform: scale(calc((100vw - 20px) * 0.002347418));
    margin-bottom: calc(-210px * (1 - calc((100vw - 20px) * 0.002347418)));
  }
}
`;
