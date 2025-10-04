# Railway Deployment Guide for Solana Gold

This guide explains how to deploy your Solana Gold exchange to Railway.

## Prerequisites

- Railway account (https://railway.app)
- Your project pushed to GitHub
- PostgreSQL database ready (Railway can provide this)

## Step 1: Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `solana_gold` repository

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` environment variable

## Step 3: Configure Environment Variables

Go to your project's "Variables" tab and add the following from `.env.railway`:

### Required Variables

```bash
# Django
SECRET_KEY=<generate_a_secure_random_string>
DEBUG=false
DEBUG_PROPAGATE_EXCEPTIONS=true
NODE_ENV=production

# Domain (replace with your Railway domain)
ALLOWED_HOSTS=your-app.up.railway.app,.railway.app
DJANGO_CSRF_TRUSTED_ORIGINS=your-app.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-app.up.railway.app

# Frontend API URL (must match Railway domain with https://)
VITE_API_BASE_URL=https://your-app.up.railway.app

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Fee Configuration
BUY_FEE_TREASURY=300
BUY_FEE_DEV=200
SELL_FEE_TREASURY=300
SELL_FEE_BURN=200
```

### Optional Variables (if using features)

```bash
# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-...
SITE_URL=https://your-app.up.railway.app
```

## Step 4: Configure Build Settings

Railway should auto-detect your Dockerfile, but verify:

1. Go to "Settings" → "Deploy"
2. Ensure "Builder" is set to "Dockerfile"
3. Root Directory should be `/` (the project root)

### Build Args

Add these build arguments in Railway's settings:

- `VITE_API_BASE_URL`: `https://your-app.up.railway.app`

## Step 5: Initialize Solana Token

After the first deployment succeeds:

1. Go to your Railway project
2. Click on the service
3. Go to "Deploy" tab and find the latest deployment
4. Click the three dots → "View Logs"
5. Note the pod name/ID

Run this command using Railway CLI:

```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Initialize the gold token
railway run python src/manage.py init_gold_token
```

This will output:
- `SGOLD_MINT_ADDRESS`
- `MINT_AUTHORITY_KEYPAIR`
- `TREASURY_WALLET`
- etc.

## Step 6: Add Solana Wallet Addresses

Copy the output from Step 5 and add these to Railway environment variables:

```bash
SGOLD_MINT_ADDRESS=<from_init_output>
MINT_AUTHORITY_KEYPAIR=<from_init_output>
TREASURY_WALLET=<from_init_output>
DEV_FUND_WALLET=<from_init_output>
LIQUIDITY_WALLET=<from_init_output>
```

## Step 7: Redeploy

After adding the Solana variables:

1. Railway will automatically trigger a redeploy
2. Or manually trigger: Settings → Deploy → Redeploy

## Step 8: Run Migrations

After successful deployment:

```bash
railway run python src/manage.py migrate
railway run python src/manage.py collectstatic --no-input
```

## Step 9: Create Superuser

```bash
railway run python src/manage.py createsuperuser
```

## Step 10: Verify Deployment

1. Visit your Railway URL (e.g., `https://your-app.up.railway.app`)
2. Check the home page loads
3. Test Solana wallet connection
4. Verify API endpoints work:
   - `https://your-app.up.railway.app/api/v1/gold/price`
   - `https://your-app.up.railway.app/api/v1/themes/current/`

## Troubleshooting

### Static Files Not Loading

Check that `collectstatic` ran during build. View build logs in Railway.

### CORS Errors

Ensure `CORS_ALLOWED_ORIGINS` exactly matches your Railway domain with `https://` prefix.

### API Calls to Localhost

This means `VITE_API_BASE_URL` wasn't set during build. Verify:
1. Build arg is set in Railway settings
2. Redeploy to rebuild frontend with correct API URL

### Database Connection Issues

Railway's PostgreSQL automatically sets `DATABASE_URL`. If you see connection errors:
1. Check the database plugin is running
2. Verify `DATABASE_URL` is in environment variables
3. Check database logs

### Theme API 404

Run collectstatic:
```bash
railway run python src/manage.py collectstatic --no-input --clear
```

## Monitoring

- **Logs**: Railway Dashboard → Deploy → View Logs
- **Metrics**: Railway Dashboard → Metrics tab
- **Database**: Railway Dashboard → PostgreSQL plugin → Connect

## Updating Your Deployment

1. Push changes to GitHub
2. Railway will automatically detect and redeploy
3. Or use Railway CLI:
   ```bash
   railway up
   ```

## Production Checklist

- [ ] `DEBUG=false` set in Railway
- [ ] `SECRET_KEY` is a secure random string (not the dev default)
- [ ] `ALLOWED_HOSTS` includes your Railway domain
- [ ] `CORS_ALLOWED_ORIGINS` includes `https://your-domain.up.railway.app`
- [ ] `VITE_API_BASE_URL` set as build arg and environment variable
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Superuser created
- [ ] Solana token initialized
- [ ] All wallet addresses configured
- [ ] SSL/HTTPS working (Railway handles this automatically)

## Custom Domain (Optional)

To use a custom domain:

1. Railway Settings → Networking → Custom Domain
2. Add your domain
3. Configure DNS with the provided CNAME record
4. Update environment variables:
   ```bash
   ALLOWED_HOSTS=yourdomain.com,.railway.app
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   VITE_API_BASE_URL=https://yourdomain.com
   DJANGO_CSRF_TRUSTED_ORIGINS=yourdomain.com
   ```
5. Redeploy

## Costs

Railway pricing (as of 2024):
- Hobby plan: $5/month
- Includes: 500GB egress, shared CPU/RAM
- Database: Included in Hobby plan
- See https://railway.app/pricing for current rates

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: GitHub Issues in your repository
