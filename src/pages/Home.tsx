import type { MouseEventHandler } from 'react'

type HomeProps = {
  onLogin: MouseEventHandler<HTMLButtonElement>
}

function Home({ onLogin }: HomeProps) {
  return (
    <section className="page page-home" aria-labelledby="home-title">
      <p className="eyebrow">Welcome</p>
      <h1 id="home-title">Home Page</h1>
      <p className="page-copy">Click login to continue to the dashboard.</p>
      <button className="primary-button" type="button" onClick={onLogin}>
        Login
      </button>
    </section>
  )
}

export default Home