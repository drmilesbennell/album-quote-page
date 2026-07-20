# ANP Quote Builder

A live quote page for Anthony Niccoli Photography, modeled on the 17hats quote
experience. You build a quote per client in a password-protected admin, send the
client an unguessable link, and drive the checkboxes and quantities during a
sales call. The client's page updates within a few seconds of every change, and
when they type their name to accept, the quote locks and records the signature,
time and exact totals.

Styling follows the ANP brand standards v3 (Prussian and gold on white,
Newsreader and Plus Jakarta Sans). Prices use standard currency formatting
("$6,550.00") since the brand's no-dollar-sign rule applies to the website
only.

## How it works

There is one quote page per client (`/q/…`), and it behaves differently
depending on who is looking at it.

- **Signed in (you)** - the page is live. Checkboxes and quantity boxes work
  directly on the page, a slim toolbar on top holds the client name, tax rate
  and a copy-link button, and every change autosaves. This is the screen you
  share on a sales call.
- **Not signed in (the client)** - the exact same page, read-only. It refreshes
  itself every few seconds, so if they have the link open while you click, the
  prices move in front of them. The signature box at the bottom is theirs.
- **Quotes** (`/admin`) - create a quote per client and pick its type. Wedding
  quotes pull in your wedding collections, album quotes pull in your album
  collections (the post-wedding upsell), and each quote snapshots the catalog
  at creation so later catalog edits never change a sent quote.
- **Collections & Add-ons** (`/admin/catalog`) - the reusable catalog, in three
  sections. Wedding Collections and Album Collections are checkbox lines with a
  price, inclusions and fine print. Add-ons get a quantity box (album pages,
  additional hours) and a setting for which quote type they appear on.
- **Acceptance** - typing a name and accepting locks the quote permanently. The
  dashboard shows who signed and when, and the record keeps the IP and the
  totals at signing. The Print button produces a clean printable copy for your
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

1. Create a quote from the dashboard, choosing wedding or album. It opens the
   live page.
2. Share your screen and click as you talk - check collections on and off,
   change the album-pages count, and the total moves in front of the client.
3. Send them the link (Copy client link in the toolbar) by email or text. On
   their side it is read-only and follows your changes live.
4. When they are ready, they type their name and accept from their own device.
   The quote locks and the dashboard shows it as accepted.

## Notes

- The starter catalog carries the July 2026 pricing - Keepsake $2300, Heirloom
  $4000 and Legacy $5900 with their inclusions and per-collection add-on rates,
  the a-la-carte add-ons, and the wall art and print list on album quotes. Edit
  freely in the admin. It loads only when the catalog is completely empty, so
  deleting every entry and reloading the catalog page restores it.
- Tax is a single percentage. The default lives in Settings and each quote can
  override its own rate until it is accepted.
- Accepted quotes cannot be edited or re-signed. Delete a quote from the
  dashboard if you truly want it gone.
