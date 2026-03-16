# Credit Union Subdomain Setup

Each credit union gets its own subdomain on `cuaccount.com`. Their forms are served at:

```
https://[credit-union-slug].cuaccount.com/form/[form-slug]
```

For example, a credit union with slug `riverside` and a form with slug `standard` is at:

```
https://riverside.cuaccount.com/form/standard
```

---

## How It Works

1. **Railway** hosts a single deployment of this application.
2. A **wildcard DNS record** (`*.cuaccount.com`) points all subdomains to the Railway service.
3. A **wildcard custom domain** is configured in Railway to accept all `*.cuaccount.com` requests.
4. The **Next.js middleware** (`src/middleware.ts`) reads the subdomain from the `Host` header and sets an `x-tenant-slug` header on the request.
5. The `/form/[slug]` page reads that header and scopes the form lookup to that credit union only.

The credit union's **slug** (set when the tenant is created in the admin) is what becomes the subdomain. For example, slug `riverside-credit-union` → `riverside-credit-union.cuaccount.com`.

---

## One-Time Infrastructure Setup

These steps are done once when first launching the platform.

### Step 1 — Deploy to Railway

1. Create a new project in [Railway](https://railway.app).
2. Add a **PostgreSQL** service to the project (Railway provides this as an add-on).
3. Connect your GitHub repository. Railway will detect `railway.toml` and use the build/start commands automatically.
4. Set the following environment variables in the Railway service settings:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Auto-filled by Railway when you add the Postgres service |
   | `NEXTAUTH_SECRET` | A long random string (run `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://app.cuaccount.com` (or your Railway-generated URL initially) |
   | `BASE_DOMAIN` | `cuaccount.com` |
   | `INCUTO_API_URL` | Your Incuto API base URL |
   | `INCUTO_API_KEY` | Your Incuto API key |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `VOUCHSAFE_API_URL` | `https://api.vouchsafe.co.uk` |
   | `VOUCHSAFE_API_KEY` | Your Vouchsafe API key |
   | `DEMO_MODE` | `false` (for production) |

5. Deploy and verify the app is running on the Railway-provided URL (e.g. `incuto-join.up.railway.app`).

---

### Step 2 — Add the Wildcard Custom Domain in Railway

1. In your Railway service, go to **Settings → Networking → Custom Domains**.
2. Click **Add Custom Domain**.
3. Enter `*.cuaccount.com` as the domain.
4. Railway will display a **CNAME target** (e.g. `xyz.up.railway.app`). Copy it — you'll need it for DNS.

> Railway supports wildcard domains on paid plans. If you see a restriction, check that you are on a Team or Pro plan.

---

### Step 3 — Configure DNS

In your DNS provider (wherever `cuaccount.com` is managed):

1. Add a **wildcard CNAME record**:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `CNAME` | `*` | `xyz.up.railway.app` (your Railway CNAME target) | 300 |

2. Optionally, add an A/CNAME for the apex domain if you want `cuaccount.com` itself to work:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `CNAME` | `app` | `xyz.up.railway.app` | 300 |

3. DNS propagation typically takes a few minutes but can take up to 48 hours.

> **SSL/TLS**: Railway automatically provisions and renews Let's Encrypt certificates for all custom domains, including wildcards. No action required.

---

## Adding a New Credit Union

Once the infrastructure is set up, adding a new credit union is instant — no DNS changes needed because the wildcard record covers all subdomains automatically.

1. **Create the tenant** in the admin panel. The **slug** you set becomes the subdomain.
   - Use lowercase letters, numbers, and hyphens only.
   - Example: `riverside-credit-union` → `riverside-credit-union.cuaccount.com`

2. **Create and publish a form** with a meaningful slug (e.g. `standard`, `savings-only`, `isa`).

3. The form is immediately live at:
   ```
   https://[tenant-slug].cuaccount.com/form/[form-slug]
   ```

4. Share the URL with the credit union. No further infrastructure work is needed.

---

## URL Reference

| Purpose | URL Pattern | Example |
|---|---|---|
| Standard membership form | `[slug].cuaccount.com/form/standard` | `riverside.cuaccount.com/form/standard` |
| Savings-only form | `[slug].cuaccount.com/form/savings-only` | `riverside.cuaccount.com/form/savings-only` |
| ISA form | `[slug].cuaccount.com/form/isa` | `riverside.cuaccount.com/form/isa` |
| Campaign-specific form | `[slug].cuaccount.com/form/[campaign-slug]?campaign=CODE` | `riverside.cuaccount.com/form/spring-offer?campaign=SPRING24` |
| Admin panel | `app.cuaccount.com` (or Railway URL) | — |

---

## Local Development

Subdomains don't work on `localhost` without extra tooling. For local testing, you can either:

**Option A — Use a hosts file entry** (quick):

Add to `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1  riverside.localhost
```
Then visit `http://riverside.localhost:3000/form/standard`.

Note: You also need to set `BASE_DOMAIN=localhost` in your local `.env`.

**Option B — Use a tunnel** (closer to production):

Use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose your local server with a real subdomain.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Form returns 404 | Tenant slug doesn't match the subdomain | Check that the tenant's slug in the database exactly matches the subdomain |
| Form returns 404 | Form is not published | Set the form status to Published in the form builder |
| SSL certificate error | DNS not yet propagated | Wait and retry; Railway provisions certs automatically once DNS resolves |
| Wrong form loads | Slug collision across tenants | Tenant isolation is enforced — this shouldn't happen; check the `x-tenant-slug` middleware header |
| Works on Railway URL, not subdomain | Wildcard domain not configured in Railway | Re-check Step 2 above |
