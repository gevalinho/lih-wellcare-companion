# WellCare Companion - Sevalla Deployment Guide

## Prerequisites

- Node.js 18+ installed locally
- Sevalla account (sign up at https://sevalla.com)
- Supabase project with configured database and auth

## Quick Deployment

### Option 1: Automated Build Script

```bash
# Make the script executable
chmod +x deploy-sevalla.sh

# Run the deployment script
./deploy-sevalla.sh
```

This will:
1. Install all dependencies
2. Build the production bundle
3. Provide deployment instructions

### Option 2: Manual Build

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

## Deploying to Sevalla

### Step 1: Prepare Your Sevalla Application

1. Log in to [Sevalla Dashboard](https://my.sevalla.com)
2. Create a new application or select an existing one
3. Choose **Static Site** as the application type

### Step 2: Configure Build Settings

In your Sevalla application settings:

- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Node Version:** `18.x` or higher

### Step 3: Set Environment Variables

Add these environment variables in the Sevalla dashboard under **Settings → Environment Variables**:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_database_url
```

**Important:** These values should match your Supabase project configuration.

### Step 4: Deploy

#### Option A: Git Deployment (Recommended)

1. Connect your Git repository (GitHub, GitLab, or Bitbucket) to Sevalla
2. Select the branch to deploy (e.g., `main` or `production`)
3. Sevalla will automatically deploy on each push

#### Option B: Manual Upload

1. Build the project locally using `npm run build`
2. Upload the contents of the `dist` folder via Sevalla's file manager
3. Set the document root to your upload directory

### Step 5: Configure Routing

For Single Page Application (SPA) routing to work correctly:

1. In Sevalla dashboard, go to **Settings → Routing**
2. Add a rewrite rule:
   - **From:** `/*`
   - **To:** `/index.html`
   - **Status Code:** 200

This ensures all routes are handled by React Router.

## Supabase Edge Function Deployment

The backend server (`/supabase/functions/server/`) needs to be deployed to Supabase Edge Functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy make-server-6e6f3496 --no-verify-jwt
```

## Post-Deployment Checklist

- [ ] Application loads successfully at your Sevalla domain
- [ ] Environment variables are correctly set
- [ ] Authentication (login/signup) works
- [ ] Patient, Caregiver, and Doctor dashboards are accessible
- [ ] Backend API calls to Supabase Edge Functions work
- [ ] Vital signs logging and medication tracking function correctly
- [ ] Mobile responsive design displays properly
- [ ] SSL certificate is active (automatic with Sevalla)

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings → Domains** in Sevalla dashboard
2. Add your custom domain
3. Update your DNS records as instructed
4. Wait for SSL certificate provisioning (automatic)

## Monitoring and Logs

- **Access Logs:** Available in Sevalla dashboard under **Logs**
- **Build Logs:** Check build output for any errors
- **Runtime Logs:** Monitor edge function logs in Supabase dashboard

## Troubleshooting

### Build Fails

- Check that Node.js version matches (18+)
- Verify all dependencies are in `package.json`
- Review build logs in Sevalla dashboard

### Blank Page After Deployment

- Verify routing configuration (SPA rewrite rule)
- Check browser console for errors
- Ensure environment variables are set correctly

### API Errors

- Confirm Supabase Edge Function is deployed
- Verify CORS headers in edge function
- Check that API URL in code matches your Supabase project

### Authentication Issues

- Verify Supabase Auth is configured
- Check that environment variables are correct
- Ensure Site URL is set in Supabase Auth settings

## Performance Optimization

The `.sevalla.yml` configuration includes:

- ✅ Static asset caching (1 year for /assets/*)
- ✅ Security headers (XSS, frame options, etc.)
- ✅ SPA routing support
- ✅ Gzip compression (automatic)

## Support

- **Sevalla Documentation:** https://docs.sevalla.com
- **Sevalla Support:** https://my.sevalla.com/support
- **Supabase Documentation:** https://supabase.com/docs

## Security Notes

🔒 **Never commit sensitive environment variables to Git**

- Use Sevalla's environment variable manager
- Keep `.env` files in `.gitignore`
- Rotate keys if accidentally exposed
- Use Supabase RLS policies for data security

---

**Last Updated:** December 2024  
**Application:** WellCare Companion v1.0
