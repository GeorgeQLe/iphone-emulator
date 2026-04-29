export const rendererStyles = `
:root {
  color-scheme: light;
  font-family: "SF Pro Display", "Helvetica Neue", Helvetica, sans-serif;
  background:
    radial-gradient(circle at top, #d5ebff 0%, #b9d7f7 24%, #88a3bf 55%, #5a6e87 100%);
  color: #14202b;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  overflow-x: hidden;
}

[data-renderer-root] {
  width: 100%;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.phone-shell {
  width: min(390px, calc(100vw - 24px));
  min-height: 844px;
  padding: clamp(12px, 4vw, 18px);
  border-radius: clamp(30px, 10vw, 42px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(240, 245, 250, 0.95));
  box-shadow:
    0 28px 70px rgba(8, 21, 38, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.phone-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #536578;
}

.phone-notch {
  width: clamp(80px, 28vw, 110px);
  height: 28px;
  border-radius: 999px;
  background: #0f1821;
}

.phone-surface {
  position: relative;
  overflow: hidden;
  min-height: 770px;
  border-radius: clamp(20px, 7vw, 28px);
  background:
    linear-gradient(180deg, rgba(250, 252, 255, 0.96), rgba(239, 244, 249, 0.98));
  border: 1px solid rgba(103, 122, 139, 0.18);
}

.phone-surface[data-keyboard-visible="true"] .surface-body {
  padding-bottom: 220px;
}

.surface-header {
  padding: 20px clamp(14px, 5vw, 20px) 12px;
  border-bottom: 1px solid rgba(103, 122, 139, 0.14);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(12px);
}

.surface-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #607180;
}

.surface-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.surface-body {
  padding: clamp(14px, 5vw, 20px);
  min-width: 0;
}

.node-stack,
.node-screen,
.node-navigationStack,
.node-modal,
.node-alert {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.node-hStack {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.node-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
}

.node-text[data-emphasis="headline"] {
  font-size: clamp(26px, 8vw, 32px);
  line-height: 1.1;
  font-weight: 700;
}

.node-button {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font: inherit;
  font-weight: 600;
  cursor: default;
  background: #d7e2ec;
  color: #13212e;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.node-button:focus-visible {
  outline: 3px solid rgba(25, 134, 255, 0.26);
  outline-offset: 2px;
}

.node-button[data-variant="primary"] {
  background: linear-gradient(180deg, #1986ff, #0b68df);
  color: #ffffff;
}

.node-textField {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 16px;
}

.node-textField[data-focused="true"] {
  background: rgba(25, 134, 255, 0.08);
  box-shadow: 0 0 0 6px rgba(25, 134, 255, 0.08);
}

.node-textField input {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(82, 102, 122, 0.24);
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: rgba(255, 255, 255, 0.92);
}

.node-textField input:focus {
  outline: 3px solid rgba(25, 134, 255, 0.22);
  border-color: #1986ff;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
}

.node-list-item {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(82, 102, 122, 0.12);
}

.node-list-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.tab-bar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 8px;
  border-radius: 18px;
  background: rgba(18, 32, 43, 0.08);
}

.tab-button[data-selected="true"] {
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(18, 32, 43, 0.12);
}

.modal-card,
.alert-card {
  width: min(100%, 280px);
  margin: 0 auto;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 40px rgba(8, 21, 38, 0.16);
}

.modal-backdrop,
.alert-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 21, 35, 0.18);
  backdrop-filter: blur(10px);
}

.scene-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.scene-meta-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(25, 134, 255, 0.1);
  color: #0d5fc8;
  font-size: 12px;
  letter-spacing: 0.04em;
}

@media (max-width: 360px) {
  body {
    padding: 16px 8px;
  }

  .phone-chrome {
    margin-bottom: 12px;
    font-size: 11px;
  }

  .node-hStack {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .node-button {
    width: 100%;
  }
}
`;
