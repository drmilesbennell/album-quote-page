# ANP Quote Builder

A live quote page for Anthony Niccoli Photography, modeled on the 17hats quote
experience. You build a quote per client in a password-protected admin, send the
client an unguessable link, and drive the checkboxes and quantities during a
sales call. The client's page updates within a few seconds of every change, and
when they type their name to accept, the quote locks and records the signature,
time and exact totals.

Styling follows the ANP brand standards v3 (Prussian and gold on white,
Newsreader and Plus Jakarta Sans, prices with no dollar signs or commas).

## How it works

- **Quotes** (`/admin`) - create one per client. Each new quote copies your
  current collections and add-ons, so editing the catalog later never changes a
  quote you already sent.
- **Collections & Add-ons** (`/admin/catalog`) - the reusable catalog.
  Collections are checkbox lines with a fixed price and a list of inclusions.
  Add-ons get a quantity box (album pages, additional hours).
- **Quote editor** (`/admin/quotes/…`) - the working surface for a call. Check
  a collection, change a quantity, edit any line's name, price or text, add
  custom lines, set the tax rate. Everything autosaves.
- **Client link** (`/q/…`) - view-only. The client sees checkboxes, prices and
  live totals, and can sign at the bottom. The page polls every 4 seconds, so it
  follows along while you edit during a call.
- **Acceptance** - typing a name and accepting locks the quote permanently. The
  admin shows who signed, when, from what IP, and the totals at signing. The
  Print button on the client page produces a clean printable copy for your
  records or for re-keying into Pixifi.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the password `changeme` (until you
set a real one, see below). Data is stored in `.data/` in this folder, so no
database setup is needed locally.

## Deploying to Vercel (free)

1. Push this repository to GitHub (already done if you are reading this there).
2. Go to [vercel.com](https://vercel.com), sign up with GitHub, and click
   **Add New → Project**, then import this repository. Accept the defaults and
   deploy.
3. In the project's **Storage** tab, click **Create Database** and choose
   **Neon (Postgres)** on the free plan. This sets the `DATABASE_URL`
   environment variable automatically.
4. In **Settings → Environment Variables**, add `ADMIN_PASSWORD` with a strong
   password of your choosing.
5. Redeploy (Deployments tab → ⋯ → Redeploy) so both variables take effect.

Your admin lives at `https://your-project.vercel.app/admin`. Client links look
like `https://your-project.vercel.app/q/AbC123…` and are safe to text or email.
You can attach a custom domain in Settings → Domains later.

Both environment variables matter in production. Without `DATABASE_URL` the app
tries to write local files, which does not persist on Vercel. Without
`ADMIN_PASSWORD` the admin password is `changeme`.

## Day-to-day use on a sales call

1. Before the call, create a quote for the client and copy the link from the
   editor's sidebar. Email or text it to them.
2. On the call, keep the editor open. As you discuss options, check collections
   on and off and adjust add-on quantities. The client watches their link and
   sees the total move in real time.
3. When they are ready, they type their name and accept on their own screen.
   The quote locks and the dashboard shows it as accepted.

## Notes

- The starter catalog was seeded from the July 2026 brand standards (Core 5250,
  Classic 6550, Premier 7750, Additional Hours 550). Edit freely in the admin.
- Tax is a single percentage. The default lives in Settings and each quote can
  override its own rate until it is accepted.
- Accepted quotes cannot be edited or re-signed. Delete a quote from the
  dashboard if you truly want it gone.
