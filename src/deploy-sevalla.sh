#!/bin/bash

# WellCare Companion - Sevalla Deployment Script
# This script prepares and deploys the application to Sevalla hosting

set -e  # Exit on any error

echo "🏥 WellCare Companion - Sevalla Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required commands exist
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed. Aborting.${NC}" >&2; exit 1; }

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building production bundle...${NC}"
npm run build

echo -e "${YELLOW}📋 Checking build output...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📤 Deployment Instructions for Sevalla:${NC}"
echo "1. Log in to your Sevalla account at https://my.sevalla.com"
echo "2. Navigate to your application"
echo "3. Go to 'Deployments' section"
echo "4. Upload the contents of the 'dist' folder"
echo "5. Set the document root to the upload directory"
echo "6. Configure environment variables in Sevalla dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - SUPABASE_DB_URL"
echo ""
echo -e "${GREEN}✅ Build is ready for deployment!${NC}"
echo -e "${YELLOW}📁 Deploy the 'dist' folder to Sevalla${NC}"
