// Shown instead of crashing when the app runs on Vercel with no database
// attached. Walks through the one-time Storage setup.
export default function SetupNotice() {
  return (
    <div className="quote-shell" style={{ maxWidth: 640 }}>
      <div className="quote-card">
        <p className="eyebrow">One step left</p>
        <h1 className="quote-title" style={{ fontSize: 30 }}>
          Connect a database
        </h1>
        <p style={{ marginTop: 18 }}>
          This deployment has no <code>DATABASE_URL</code>, so there is nowhere to store
          quotes yet. It only takes a minute to fix in the Vercel dashboard.
        </p>
        <ol style={{ lineHeight: 2 }}>
          <li>Open your project on vercel.com and go to the <strong>Storage</strong> tab.</li>
          <li>Click <strong>Create Database</strong> and choose <strong>Neon</strong> (Postgres, free plan).</li>
          <li>
            When asked which environments to connect, keep <strong>Production, Preview and
            Development</strong> all checked.
          </li>
          <li>
            Go to <strong>Deployments</strong>, open the ⋯ menu on the latest deployment and
            choose <strong>Redeploy</strong>.
          </li>
        </ol>
        <p className="muted">
          While you are there, set an <code>ADMIN_PASSWORD</code> environment variable in
          Settings → Environment Variables if you have not already.
        </p>
      </div>
    </div>
  );
}
