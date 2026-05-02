#!/bin/bash

# Stagehand Browser Agent Shell Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to show help
show_help() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║            Stagehand Browser Agent CLI                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Usage: ./agent.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  --run           Start the agent server with browser"
    echo "                  (prompts for target port to navigate to)"
    echo "  --test          Send test command to running agent"
    echo "  --store         Store a log entry with embeddings"
    echo "  --retrieve      Search and retrieve logs"
    echo "  --help          Show this help message"
    echo ""
    echo "Test Options:"
    echo "  -context <text> Optional context to add to the test"
    echo "  <instruction>   The instruction for the agent to execute"
    echo ""
    echo "Store Options:"
    echo "  --issue <text>  Issue description (required)"
    echo "  --solve <text>  Solution description (optional)"
    echo "  --tags <tag1> <tag2> ...  Tags for categorization"
    echo ""
    echo "Retrieve Options:"
    echo "  --input <text>  Search query for semantic search"
    echo "  --tags <tag1> <tag2> ...  Search by tags"
    echo "  --limit <num>   Maximum results (default: 5)"
    echo ""
    echo "Examples:"
    echo "  # Start the agent server"
    echo "  ./agent.sh --run"
    echo ""
    echo "  # Send test commands"
    echo "  ./agent.sh --test \"Click the Test Console button\""
    echo "  ./agent.sh --test -context \"Testing forms\" \"Fill the form\""
    echo ""
    echo "  # Store a log entry"
    echo "  ./agent.sh --store --issue \"API returns 500 error\" --solve \"Fixed DB connection\" --tags bug api"
    echo ""
    echo "  # Retrieve logs"
    echo "  ./agent.sh --retrieve --input \"database errors\""
    echo "  ./agent.sh --retrieve --tags bug database --limit 10"
}

# Check if tsx is installed
if ! command -v tsx &> /dev/null; then
    echo -e "${RED}Error: tsx is not installed${NC}"
    echo "Please install tsx first:"
    echo "  npm install -g tsx"
    echo "  or"
    echo "  pnpm add -g tsx"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo -e "${YELLOW}Warning: node_modules not found${NC}"
    echo "Please run 'pnpm install' or 'npm install' first"
    exit 1
fi

# Function to prompt for API key
prompt_for_api_key() {
    local key_name=$1
    local key_value=""
    
    # Check if key exists in .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        key_value=$(grep "^${key_name}=" "$SCRIPT_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    fi
    
    # If key is empty or placeholder, prompt user
    if [ -z "$key_value" ] || [ "$key_value" = "your_cerebras_api_key_here" ] || [ "$key_value" = "your_anthropic_api_key_here" ] || [ "$key_value" = "your_openai_api_key_here" ]; then
        echo -e "${YELLOW}⚠️  ${key_name} not found or invalid${NC}"
        echo -e "${BLUE}Please enter your ${key_name} (input will be hidden):${NC}"
        read -rs key_value
        
        if [ -n "$key_value" ]; then
            # Update .env file
            if [ -f "$SCRIPT_DIR/.env" ]; then
                # Update existing line or add new one
                if grep -q "^${key_name}=" "$SCRIPT_DIR/.env"; then
                    sed -i.bak "s/^${key_name}=.*/${key_name}=${key_value}/" "$SCRIPT_DIR/.env"
                else
                    echo "${key_name}=${key_value}" >> "$SCRIPT_DIR/.env"
                fi
            else
                # Create .env file
                echo "${key_name}=${key_value}" > "$SCRIPT_DIR/.env"
            fi
            echo -e "${GREEN}✅ ${key_name} saved to .env${NC}"
        else
            echo -e "${RED}❌ No API key provided${NC}"
            exit 1
        fi
    fi
    
    export "${key_name}=${key_value}"
}
# Load environment variables from .env if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Check and prompt for API keys
echo -e "${BLUE}🔑 Checking API keys...${NC}"

# Check for API keys (prioritize Anthropic, then OpenAI, then Cerebras)
if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your_anthropic_api_key_here" ]; then
    echo -e "${GREEN}✅ Anthropic API key found${NC}"
elif [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
    echo -e "${GREEN}✅ OpenAI API key found${NC}"
elif [ -n "$CEREBRAS_API_KEY" ] && [ "$CEREBRAS_API_KEY" != "your_cerebras_api_key_here" ]; then
    echo -e "${GREEN}✅ Cerebras API key found${NC}"
else
    echo -e "${YELLOW}No valid API key found.${NC}"
    echo -e "${BLUE}Please set one of the following in your .env file:${NC}"
    echo -e "  ANTHROPIC_API_KEY=your_key_here (recommended)"
    echo -e "  OPENAI_API_KEY=your_key_here"
    echo -e "  CEREBRAS_API_KEY=your_key_here (limited computer use support)"
    exit 1
fi

# Parse command
case "$1" in
    --run|-r)
        echo -e "${GREEN}🚀 Starting agent server...${NC}"
        echo -e "${BLUE}🖥️  Browser will open and stay visible${NC}"
        echo ""
        
        # Prompt for target port
        echo -e "${CYAN}Target Application Configuration${NC}"
        echo "================================="
        read -p "Enter the port of the application to navigate to (default: 3000): " target_port
        target_port=${target_port:-3000}
        
        # Validate port number
        if ! [[ "$target_port" =~ ^[0-9]+$ ]] || [ "$target_port" -lt 1 ] || [ "$target_port" -gt 65535 ]; then
            echo -e "${RED}Invalid port number. Using default port 3000.${NC}"
            target_port=3000
        fi
        
        echo -e "${GREEN}✅ Agent will navigate to: http://localhost:${target_port}${NC}"
        echo ""
        
        # Pass the port as an environment variable
        TARGET_PORT="$target_port" cd "$SCRIPT_DIR" && tsx src/agent/agent-server.ts
        ;;
        
    --test|-t)
        shift # Remove --test from arguments
        cd "$SCRIPT_DIR" && tsx src/agent/agent-client.ts "$@"
        ;;
        
    --store|-s)
        shift # Remove --store from arguments
        echo -e "${GREEN}📝 Storing log entry...${NC}"
        cd "$SCRIPT_DIR" && tsx src/agent/agent-store.ts "$@"
        ;;
        
    --retrieve|--search|-g)
        shift # Remove --retrieve from arguments
        echo -e "${BLUE}🔍 Retrieving logs...${NC}"
        cd "$SCRIPT_DIR" && tsx src/agent/agent-retrieve.ts "$@"
        ;;
        
    --help|-h|"")
        show_help
        ;;
        
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
