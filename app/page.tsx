export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Global Invitation</h1>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
          <a href="/payment-info" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Payment Information
          </a>
        </p>
      </div>
    </div>
  )
}
