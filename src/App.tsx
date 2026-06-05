import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  Loading,
  useThunderID,
  useOrganization,
} from '@thunderid/react'
import { useEffect, useState } from 'react'
import './App.css'

type Role = 'admin' | 'user'

type Todo = {
  id: number
  text: string
  done: boolean
  created_by: string
}

function normalizeRoleValue(value: unknown): Role | null {
  if (typeof value !== 'string') return null
  const lowerValue = value.toLowerCase()
  if (lowerValue.includes('admin') || lowerValue.includes('owner')) return 'admin'
  if (lowerValue.includes('user') || lowerValue.includes('member')) return 'user'
  return null
}

function resolveRoleFromClaims(claims: Record<string, unknown>): Role {
  const candidateKeys = [
    'roles', 'role', 'groups', 'permissions',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'https://thunderid.example.com/roles',
  ]
  for (const key of candidateKeys) {
    const value = claims[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        const role = normalizeRoleValue(item)
        if (role) return role
      }
    }
    const role = normalizeRoleValue(value)
    if (role) return role
  }
  return 'user'
}

function resolveDisplayNameFromClaims(claims: Record<string, unknown>): string {
  return String(
    claims.displayName || claims.preferred_username || claims.username ||
    claims.email || claims.given_name || claims.name || 'User',
  )
}

function resolveEmailFromClaims(claims: Record<string, unknown>): string {
  return typeof claims.email === 'string' ? claims.email : ''
}

// ─── Todo Section ─────────────────────────────────────────────────────────────
function TodoSection({ role, email }: { role: string; email: string }) {
  const { getAccessToken } = useThunderID()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getHeaders() {
    const token = await getAccessToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async function fetchTodos() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/todos', { headers: await getHeaders() })
      if (!res.ok) throw new Error('Failed to fetch todos')
      const data = await res.json()
      setTodos(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  async function addTodo() {
    if (!newTodo.trim()) return
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ text: newTodo }),
      })
      if (!res.ok) throw new Error('Failed to add todo')
      setNewTodo('')
      fetchTodos()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add todo')
    }
  }

  async function deleteTodo(id: number) {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      })
      fetchTodos()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete todo')
    }
  }

  useEffect(() => { void fetchTodos() }, [])

  return (
    <section className="dashboard-card" style={{ marginTop: '2rem' }}>
      <h2>
        {role === 'admin' ? '📋 All Users Todos' : '📝 My Todos'}
        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>
          {role === 'admin' ? '(viewing all users — admin)' : '(only your todos)'}
        </span>
      </h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={addTodo} style={{ padding: '0.5rem 1rem' }}>Add</button>
      </div>
      {loading ? (
        <p>Loading todos...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet. Add one above!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map(todo => (
            <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
  <span>
    {todo.text}
    {role === 'admin' && (
      <small style={{ color: '#888', marginLeft: '0.5rem' }}>by {todo.created_by}</small>
    )}
  </span>
  {/* Only show delete button for own todos */}
  {todo.created_by === email && (
    <button onClick={() => deleteTodo(todo.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
  )}
</li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Dashboards ───────────────────────────────────────────────────────────────

function AdminDashboard({ displayName, email }: { displayName: string; email: string }) {
  return (
    <section className="dashboard-card dashboard-admin" aria-labelledby="admin-dashboard-title">
      <p className="eyebrow">Admin</p>
      <h2 id="admin-dashboard-title">Admin Dashboard</h2>
      <p className="page-copy">Welcome back, {displayName}. You can manage users and review system data here.</p>
      <div className="dashboard-metric-grid">
        <div className="dashboard-metric"><span className="dashboard-metric-label">Access</span><strong>Full</strong></div>
        <div className="dashboard-metric"><span className="dashboard-metric-label">Role</span><strong>Admin</strong></div>
        <div className="dashboard-metric"><span className="dashboard-metric-label">Email</span><strong>{email || 'Not available'}</strong></div>
      </div>
    </section>
  )
}

function UserDashboard({ displayName, email }: { displayName: string; email: string }) {
  return (
    <section className="dashboard-card dashboard-user" aria-labelledby="user-dashboard-title">
      <p className="eyebrow">User</p>
      <h2 id="user-dashboard-title">User Dashboard</h2>
      <p className="page-copy">Welcome back, {displayName}. This is your standard user dashboard.</p>
      <div className="dashboard-metric-grid">
        <div className="dashboard-metric"><span className="dashboard-metric-label">Access</span><strong>Limited</strong></div>
        <div className="dashboard-metric"><span className="dashboard-metric-label">Role</span><strong>User</strong></div>
        <div className="dashboard-metric"><span className="dashboard-metric-label">Email</span><strong>{email || 'Not available'}</strong></div>
      </div>
    </section>
  )
}

// ─── Role Dashboard ───────────────────────────────────────────────────────────

function RoleDashboard() {
  const { getDecodedIdToken } = useThunderID()
  const { currentOrganization, isLoading: organizationLoading, error: organizationError } = useOrganization()
  const [displayName, setDisplayName] = useState('User')
  const [email, setEmail] = useState('')
  const [tokenRole, setTokenRole] = useState<Role | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ADD THESE LOGS
  console.log('organizationLoading:', organizationLoading)
  console.log('organizationError:', organizationError)
  console.log('isLoadingToken:', isLoadingToken)
  console.log('error:', error)

  useEffect(() => {
    let ignore = false
    async function loadToken() {
      setIsLoadingToken(true)
      try {
        const userClaims = (await getDecodedIdToken()) as Record<string, unknown>
        if (ignore) return
        setTokenRole(resolveRoleFromClaims(userClaims))
        setDisplayName(resolveDisplayNameFromClaims(userClaims))
        setEmail(resolveEmailFromClaims(userClaims))
      } catch (requestError) {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : 'Failed to load token')
      } finally {
        if (!ignore) setIsLoadingToken(false)
      }
    }
    void loadToken()
    return () => { ignore = true }
  }, [getDecodedIdToken])

  const organizationRole = normalizeRoleValue((currentOrganization as { role?: unknown } | null)?.role)
  const resolvedRole = organizationRole ?? tokenRole ?? 'user'
  const loading = organizationLoading || isLoadingToken
  const dashboardError = error || organizationError

  if (loading) return (
    <section className="profile-card" aria-live="polite">
      <h2>Loading dashboard...</h2>
      <p>organizationLoading: {String(organizationLoading)}</p>
      <p>isLoadingToken: {String(isLoadingToken)}</p>
    </section>
  )

  if (dashboardError) return (
    <section className="profile-card" aria-live="polite">
      <h2>Role unavailable</h2>
      <p className="user-message">{dashboardError}</p>
    </section>
  )

  return (
    <>
      <section className="profile-card" aria-labelledby="dashboard-title">
        <h2 id="dashboard-title">{resolvedRole === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}</h2>
        <p className="user-message">
          Signed in as <strong>{displayName}</strong>
          {email ? <> ({email})</> : null} with role <strong>{resolvedRole}</strong>.
        </p>
        <div className="profile-summary">
          <p><strong>Resolved role:</strong> {resolvedRole}</p>
          <p><strong>Name:</strong> {displayName}</p>
          <p><strong>Email:</strong> {email || 'Not available'}</p>
          <p><strong>Organization role:</strong> {(currentOrganization as { role?: string } | null)?.role || 'Not available'}</p>
        </div>
        {resolvedRole === 'admin'
          ? <AdminDashboard displayName={displayName} email={email} />
          : <UserDashboard displayName={displayName} email={email} />}
      </section>

     <TodoSection role={resolvedRole} email={email} />
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <>
      <Loading><div>Loading authentication...</div></Loading>
      <header className="auth-header">
        <h1>ThunderID Auth Demo</h1>
        <div className="auth-actions">
          <SignedIn><SignOutButton>Sign Out</SignOutButton></SignedIn>
          <SignedOut><SignInButton onClick={() => console.log('clicked')}>Sign In</SignInButton></SignedOut>
        </div>
      </header>
      <main className="auth-main">
        <SignedIn><RoleDashboard /></SignedIn>
      </main>
    </>
  )
}

export default App