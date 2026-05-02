#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Log Storage System Setup with Embeddings               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Install dependencies
echo -e "${BLUE}📦 Step 1: Installing npm dependencies...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo -e "${RED}❌ Error: Neither pnpm nor npm found. Please install Node.js first.${NC}"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}\n"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Generate Prisma client
echo -e "${BLUE}🔧 Step 2: Generating Prisma client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}\n"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

# Step 3: Run database migrations
echo -e "${BLUE}🗄️  Step 3: Running database migrations...${NC}"
echo -e "${YELLOW}Note: Make sure your DATABASE_URL is set in .env${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from env.sample...${NC}"
    if [ -f env.sample ]; then
        cp env.sample .env
        echo -e "${YELLOW}Please edit .env and set your DATABASE_URL, then run this script again.${NC}"
        exit 1
    fi
fi

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=$" .env; then
    echo -e "${GREEN}DATABASE_URL found in .env${NC}"
else
    echo -e "${RED}❌ DATABASE_URL not set in .env file${NC}"
    echo -e "${YELLOW}Please set DATABASE_URL in your .env file${NC}"
    echo "Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/mydb\""
    exit 1
fi

# Apply migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations applied${NC}\n"
else
    echo -e "${YELLOW}⚠️  Migration failed. Trying prisma db push instead...${NC}"
    npx prisma db push
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database schema pushed${NC}\n"
    else
        echo -e "${RED}❌ Failed to setup database${NC}"
        exit 1
    fi
fi

# Step 4: Download embedding model
echo -e "${BLUE}🤖 Step 4: Preparing embedding model...${NC}"
echo -e "${YELLOW}The embedding model will be downloaded on first use (~50MB)${NC}"
echo -e "${YELLOW}Model: Qwen/Qwen3-Embedding-4B (1536-dimensional embeddings)${NC}\n"

# Step 5: Test the system
echo -e "${BLUE}🧪 Step 5: Testing the system...${NC}"
read -p "Would you like to run a test to verify everything works? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Running test...${NC}\n"
    tsx test-log-system.ts
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test completed successfully!${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Test encountered issues. Please check the output above.${NC}\n"
    fi
else
    echo -e "${YELLOW}Skipping test. You can run it later with: tsx test-log-system.ts${NC}\n"
fi

# Final message
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}You can now use the log storage system:${NC}\n"

echo -e "${GREEN}Store a log:${NC}"
echo "  ./agent.sh --store --issue \"Your issue\" --solve \"Solution\" --tags bug api"
echo ""

echo -e "${GREEN}Retrieve logs:${NC}"
echo "  ./agent.sh --retrieve --input \"search query\""
echo "  ./agent.sh --retrieve --tags bug database"
echo ""

echo -e "${BLUE}For more information, see LOG_STORAGE_GUIDE.md${NC}"
