import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', margin: '20px', fontFamily: 'sans-serif' }}>
          <h3 style={{ margin: '0 0 10px' }}>Oops, algo deu errado!</h3>
          <p style={{ margin: '0 0 10px', fontSize: '14px' }}>{this.state.error ? this.state.error.toString() : ''}</p>
          <pre style={{ margin: 0, fontSize: '12px', overflowX: 'auto', background: '#e9afb4', padding: '10px', borderRadius: '4px' }}>
            {this.state.error ? this.state.error.stack : ''}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: '15px', padding: '6px 12px', cursor: 'pointer' }}>
            Limpar Cache/Dados e Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
