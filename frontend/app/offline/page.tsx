/* eslint-disable i18next/no-literal-string */
export const metadata = {
  title: '오프라인 — Global Invitation',
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        background: '#ffffff',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>오프라인입니다</h1>
      <p style={{ marginTop: 8, color: '#6b7280', fontSize: 14, maxWidth: 320 }}>
        네트워크 연결이 끊겼습니다. 연결이 복구되면 자동으로 다시 시도됩니다.
      </p>
    </main>
  );
}
