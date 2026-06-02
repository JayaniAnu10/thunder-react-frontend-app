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

function normalizeRoleValue(value: unknown): Role | null {
  if (typeof value !== 'string') {
    return null
  }

  const lowerValue = value.toLowerCase()
  if (lowerValue.includes('admin') || lowerValue.includes('owner')) return 'admin'
  if (lowerValue.includes('user') || lowerValue.includes('member')) return 'user'
  return null
}

function resolveRoleFromClaims(claims: Record<string, unknown>): Role {
  const candidateKeys = [
    'roles',
    'role',
    'groups',
    'permissions',
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
    claims.displayName ||
      claims.preferred_username ||
      claims.username ||
      claims.email ||
      claims.given_name ||
      claims.name ||
      'User',
  )
}

function resolveEmailFromClaims(claims: Record<string, unknown>): string {
  return typeof claims.email === 'string' ? claims.email : ''
}

function AdminDashboard({ displayName, email }: { displayName: string; email: string }) {
  return (
    <section className="dashboard-card dashboard-admin" aria-labelledby="admin-dashboard-title">
      <p className="eyebrow">Admin</p>
      <h2 id="admin-dashboard-title">Admin Dashboard</h2>
      <p className="page-copy">
        Welcome back, {displayName}. You can manage users and review system data here.
      </p>
      <div className="dashboard-metric-grid">
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Access</span>
          <strong>Full</strong>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Role</span>
          <strong>Admin</strong>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Email</span>
          <strong>{email || 'Not available'}</strong>
        </div>
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
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Access</span>
          <strong>Limited</strong>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Role</span>
          <strong>User</strong>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Email</span>
          <strong>{email || 'Not available'}</strong>
        </div>
      </div>
    </section>
  )
}

function RoleDashboard() {
  const { getDecodedIdToken } = useThunderID()
  const { currentOrganization, isLoading: organizationLoading, error: organizationError } = useOrganization()
  const [displayName, setDisplayName] = useState('User')
  const [email, setEmail] = useState('')
  const [tokenRole, setTokenRole] = useState<Role | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadToken() {
      setIsLoadingToken(true)

      try {
        const userClaims = (await getDecodedIdToken()) as Record<string, unknown>
console.log("ID TOKEN CLAIMS");
console.log(userClaims);
console.log(JSON.stringify(userClaims, null, 2));
        if (ignore) return

        setTokenRole(resolveRoleFromClaims(userClaims))
        setDisplayName(resolveDisplayNameFromClaims(userClaims))
        setEmail(resolveEmailFromClaims(userClaims))
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load token')
        }
      } finally {
        if (!ignore) {
          setIsLoadingToken(false)
        }
      }
    }

    void loadToken()

    return () => {
      ignore = true
    }
  }, [getDecodedIdToken])

  const organizationRole = normalizeRoleValue((currentOrganization as { role?: unknown } | null)?.role)
  const resolvedRole = organizationRole ?? tokenRole ?? 'user'
  const loading = organizationLoading || isLoadingToken
  const dashboardError = error || organizationError

  if (loading) {
    return (
      <section className="profile-card" aria-live="polite">
        <h2>Loading dashboard...</h2>
      </section>
    )
  }

  if (dashboardError) {
    return (
      <section className="profile-card" aria-live="polite">
        <h2>Role unavailable</h2>
        <p className="user-message">{dashboardError}</p>
      </section>
    )
  }

  return (
    <section className="profile-card" aria-labelledby="dashboard-title">
      <h2 id="dashboard-title">{resolvedRole === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}</h2>
      <p className="user-message">
        Signed in as <strong>{displayName}</strong>
        {email ? (
          <>
            {' '}
            ({email})
          </>
        ) : null}{' '}
        with role <strong>{resolvedRole}</strong>.
      </p>
      <div className="profile-summary">
        <p>
          <strong>Resolved role:</strong> {resolvedRole}
        </p>
        <p>
          <strong>Name:</strong> {displayName}
        </p>
        <p>
          <strong>Email:</strong> {email || 'Not available'}
        </p>
        <p>
          <strong>Organization role:</strong>{' '}
          {(currentOrganization as { role?: string } | null)?.role || 'Not available'}
        </p>
      </div>
      {resolvedRole === 'admin' ? (
        <AdminDashboard displayName={displayName} email={email} />
      ) : (
        <UserDashboard displayName={displayName} email={email} />
      )}
    </section>
  )
}

function App() {
  return (
    <>
      <Loading>
        <div>Loading authentication...</div>
      </Loading>

      <header className="auth-header">
        <h1>ThunderID Auth Demo</h1>
        <div className="auth-actions">
          <SignedIn>
            <SignOutButton>Sign Out</SignOutButton>
          </SignedIn>
          <SignedOut>
            <SignInButton onClick={() => console.log('clicked')}>Sign In</SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="auth-main">
        <SignedIn>
          <RoleDashboard />
        </SignedIn>
      </main>
    </>
  )
}

export default App
