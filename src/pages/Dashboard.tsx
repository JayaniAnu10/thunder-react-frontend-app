type DashboardProps = {
  onBack: () => void
}

function Dashboard({ onBack }: DashboardProps) {
  return (
    <section className="page page-dashboard" aria-labelledby="dashboard-title">
      <p className="eyebrow">Signed in</p>
      <h1 id="dashboard-title">Dashboard Page</h1>
      <p className="page-copy">This is a simple dashboard view after login.</p>
      <div className="dashboard-card">
        <h2>Quick summary</h2>
        <p>Everything is connected and ready for your next feature.</p>
      </div>
      <button className="secondary-button" type="button" onClick={onBack}>
        Back to Home
      </button>
    </section>
  )
}

export default Dashboard