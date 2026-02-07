import Link from 'next/link';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 24px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span style={{ fontWeight: 600 }}>Internal</span>
        <Link href="/" style={{ color: '#0066cc', fontSize: 14 }}>
          Home
        </Link>
      </header>
      {children}
    </div>
  );
}
