export function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid rgba(91,141,239,0.15)',
        borderTopColor: '#5b8def',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}
