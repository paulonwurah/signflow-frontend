import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import AuthPage    from './pages/AuthPage'
import Dashboard   from './pages/Dashboard'
import Settings    from './pages/Settings'
import SignPage    from './pages/SignPage'

// Landing page — import the static HTML we built or use this placeholder
function Landing() {
  window.location.href = '/landing.html'
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Landing />} />
          <Route path="/sign/:token" element={<SignPage />} />

          {/* Auth only (redirect to /dashboard if already logged in) */}
          <Route path="/login"  element={<PublicOnlyRoute><AuthPage mode="login"  /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings  /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'DM Sans,sans-serif',gap:12 }}>
              <div style={{ fontSize:40 }}>404</div>
              <div style={{ color:'#6B6860' }}>Page not found</div>
              <a href="/" style={{ color:'#2563EB',fontSize:14 }}>Go home</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
