#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Embedding model for Ollama
EMBEDDING_MODEL="embeddinggemma:300m"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for API keys
prompt_api_keys() {
    print_status "Setting up API keys..."
    
    # Check if .env exists, if not copy from env.sample
    if [ ! -f .env ]; then
        print_status "Creating .env file from env.sample..."
        cp env.sample .env
    fi
    
    # Function to update .env file
    update_env() {
        local key=$1
        local value=$2
        if grep -q "^${key}=" .env; then
            sed -i.bak "s/^${key}=.*/${key}=${value}/" .env
        else
            echo "${key}=${value}" >> .env
        fi
    }
    
    # Check if CEREBRAS_API_KEY already exists and is not placeholder
    if grep -q "^CEREBRAS_API_KEY=" .env && ! grep -q "^CEREBRAS_API_KEY=your_cerebras_api_key_here" .env && ! grep -q "^CEREBRAS_API_KEY=$" .env; then
        print_success "Cerebras API key already configured"
    else
        # Prompt for Cerebras API key (securely)
        echo ""
        echo -e "${YELLOW}⚠️  Cerebras API key is required${NC}"
        echo -e "${BLUE}Please enter your CEREBRAS_API_KEY (input will be hidden):${NC}"
        read -rs cerebras_key
        if [ ! -z "$cerebras_key" ]; then
            update_env "CEREBRAS_API_KEY" "$cerebras_key"
            print_success "Cerebras API key set"
        else
            print_error "Cerebras API key is required. Please run setup again."
            exit 1
        fi
    fi
    
    # Read ports from config.toml if it exists
    if [ -f "../supabase/config.toml" ]; then
        API_PORT=$(grep -A1 "^\[api\]" ../supabase/config.toml | grep "^port =" | sed 's/port = //')
        DB_PORT=$(grep -A1 "^\[db\]" ../supabase/config.toml | grep "^port =" | sed 's/port = //')
    else
        # Default ports if config.toml not found (using project-2 port scheme)
        API_PORT="64321"
        DB_PORT="64322"
    fi
    
    # Ensure all required environment variables exist with placeholders
    # These will be updated with real values when Supabase starts
    if ! grep -q "^DATABASE_URL=" .env; then
        echo "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:$DB_PORT/postgres" >> .env
    fi
    
    if ! grep -q "^SUPABASE_URL=" .env; then
        echo "SUPABASE_URL=http://127.0.0.1:$API_PORT" >> .env
    fi
    
    if ! grep -q "^SUPABASE_ANON_KEY=" .env; then
        echo "SUPABASE_ANON_KEY=your_supabase_anon_key_here" >> .env
    fi
    
    if ! grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env; then
        echo "SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here" >> .env
    fi
    
    # Clean up backup file
    rm -f .env.bak
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command_exists pnpm; then
        pnpm install
    elif command_exists npm; then
        npm install
    elif command_exists yarn; then
        yarn install
    else
        print_error "No package manager found. Please install pnpm, npm, or yarn."
        exit 1
    fi
    
    print_success "Dependencies installed"
}

# Function to fix Supabase config issues
fix_supabase_config() {
    print_status "Checking Supabase configuration..."
    
    if [ -f "supabase/config.toml" ]; then
        # Check if network_restrictions section exists and comment it out
        if grep -q "^\[db.network_restrictions\]" supabase/config.toml; then
            print_status "Fixing Supabase config (commenting out unsupported network_restrictions)..."
            
            # Create a temporary file with the fixed config
            awk '
            /^\[db\.network_restrictions\]/ {
                in_section = 1
                print "# " $0
                next
            }
            /^\[/ && in_section {
                in_section = 0
            }
            in_section && /^[^#]/ {
                print "# " $0
                next
            }
            {print}
            ' supabase/config.toml > supabase/config.toml.tmp
            
            # Replace the original file
            mv supabase/config.toml.tmp supabase/config.toml
            print_success "Supabase config fixed"
        fi
    fi
}

# Function to setup Supabase
setup_supabase() {
    print_status "Setting up Supabase..."
    
    # Check if Supabase CLI is installed
    if ! command_exists supabase; then
        print_status "Installing Supabase CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command_exists brew; then
                brew install supabase/tap/supabase
            else
                print_error "Please install Homebrew first: https://brew.sh/"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://supabase.com/install.sh | sh
        else
            print_error "Unsupported OS. Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
            exit 1
        fi
    fi
    
    # Initialize Supabase if not already done
    if [ ! -d "supabase" ]; then
        print_status "Initializing Supabase project..."
        supabase init
    fi
    
    # Fix config issues before starting
    fix_supabase_config
    
    # Stop any existing Supabase instances to avoid port conflicts
    print_status "Stopping any existing Supabase instances..."
    supabase stop 2>/dev/null || true
    
    # Start Supabase and capture output
    print_status "Starting Supabase..."
    SUPABASE_OUTPUT=$(supabase start 2>&1)
    
    # Display the output
    echo "$SUPABASE_OUTPUT"
    
    # Extract values from the output and update .env
    if [ -f .env ]; then
        # Extract API URL (for SUPABASE_URL)
        api_url=$(echo "$SUPABASE_OUTPUT" | grep "API URL:" | sed 's/.*API URL: *//')
        if [ ! -z "$api_url" ]; then
            if grep -q "^SUPABASE_URL=" .env; then
                sed -i.bak "s|^SUPABASE_URL=.*|SUPABASE_URL=${api_url}|" .env
            else
                echo "SUPABASE_URL=${api_url}" >> .env
            fi
            print_success "Supabase URL updated in .env"
        fi
        
        # Extract database URL
        db_url=$(echo "$SUPABASE_OUTPUT" | grep "DB URL:" | sed 's/.*DB URL: *//')
        if [ ! -z "$db_url" ]; then
            if grep -q "^DATABASE_URL=" .env; then
                sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${db_url}|" .env
            else
                echo "DATABASE_URL=${db_url}" >> .env
            fi
            print_success "Database URL updated in .env"
        fi
        
        # Extract anon key
        anon_key=$(echo "$SUPABASE_OUTPUT" | grep "anon key:" | sed 's/.*anon key: *//')
        if [ ! -z "$anon_key" ]; then
            if grep -q "^SUPABASE_ANON_KEY=" .env; then
                sed -i.bak "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${anon_key}|" .env
            else
                echo "SUPABASE_ANON_KEY=${anon_key}" >> .env
            fi
            print_success "Supabase anon key updated in .env"
        fi
        
        # Extract service role key
        service_key=$(echo "$SUPABASE_OUTPUT" | grep "service_role key:" | sed 's/.*service_role key: *//')
        if [ ! -z "$service_key" ]; then
            if grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env; then
                sed -i.bak "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${service_key}|" .env
            else
                echo "SUPABASE_SERVICE_ROLE_KEY=${service_key}" >> .env
            fi
            print_success "Supabase service role key updated in .env"
        fi
        
        # Clean up backup file
        rm -f .env.bak
    fi
    
    print_success "Supabase setup complete"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Generate Prisma client
    if command_exists pnpm; then
        pnpm db:generate
    else
        npx prisma generate
    fi
    
    # Push database schema
    if command_exists pnpm; then
        pnpm db:push
    else
        npx prisma db push
    fi
    
    print_success "Database setup complete"
}

# Function to optionally setup Next.js app
setup_nextjs() {
    print_status "Next.js Setup (Optional)"
    echo "========================"
    echo ""
    echo "This project can work with an existing Next.js application."
    echo "You can skip this step if you already have a Next.js app or will create one later."
    echo ""
    
    read -p "Do you want to create a new Next.js app now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Current directory: $(pwd)"
        echo "Tip: Use Tab for autocomplete"
        read -e -p "Enter the directory name for the Next.js app (default: next-app): " app_dir
        app_dir=${app_dir:-next-app}
        
        if [ -d "$app_dir" ]; then
            print_warning "Directory '$app_dir' already exists"
            
            # Check if it has a package.json
            if [ -f "$app_dir/package.json" ]; then
                print_status "Found existing Node.js project in '$app_dir'"
                
                # Check if node_modules exists
                if [ ! -d "$app_dir/node_modules" ]; then
                    read -p "Install dependencies for existing project? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        print_status "Installing dependencies in $app_dir..."
                        cd "$app_dir"
                        if command_exists pnpm; then
                            pnpm install
                            pnpm add @prisma/client @supabase/supabase-js 2>/dev/null || true
                        else
                            npm install
                            npm install @prisma/client @supabase/supabase-js 2>/dev/null || true
                        fi
                        cd ..
                        print_success "Dependencies installed"
                    fi
                fi
            else
                print_warning "Directory exists but doesn't appear to be a Node.js project"
                read -p "Skip Next.js setup? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Skipping Next.js setup"
                    return
                fi
            fi
        else
            print_status "Creating Next.js app in '$app_dir'..."
            
            if command_exists pnpm; then
                pnpm create next-app@latest "$app_dir" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
            else
                npx create-next-app@latest "$app_dir" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
            fi
            
            if [ -d "$app_dir" ]; then
                # Install additional dependencies for the Next.js app
                cd "$app_dir"
                if command_exists pnpm; then
                    pnpm add @prisma/client @supabase/supabase-js
                else
                    npm install @prisma/client @supabase/supabase-js
                fi
                cd ..
                
                print_success "Next.js app created in '$app_dir'"
            else
                print_error "Failed to create Next.js app"
            fi
        fi
    else
        print_status "Skipping Next.js setup - you can set up your own Next.js app later"
        echo ""
        echo "When you run './setup.sh start', you'll be prompted to specify"
        echo "the path to your Next.js app and the port to run it on."
    fi
}

# Function to prompt for Next.js configuration
prompt_nextjs_config() {
    while true; do
        echo ""
        echo -e "${CYAN}Next.js Configuration${NC}"
        echo "====================="
        
        # Ask if user wants to start Next.js
        read -p "Do you want to start a Next.js application? (y/n): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1  # Return false, don't start Next.js
        fi
        
        # Ask for the path to the Next.js app
        echo ""
        echo "Current directory: $(pwd)"
        echo "Tip: Use Tab for autocomplete, '..' for parent directory"
        echo ""
        read -e -p "Enter the path to your Next.js app (default: next-app): " nextjs_path
        nextjs_path=${nextjs_path:-next-app}
        
        # Check if the path exists
        if [ ! -d "$nextjs_path" ]; then
            # Show the absolute path that was checked
            if [[ "$nextjs_path" = /* ]]; then
                # Already absolute path
                abs_path="$nextjs_path"
            else
                # Relative path - show it relative to current directory
                abs_path="$(pwd)/$nextjs_path"
            fi
            print_error "Directory not found: $abs_path"
            read -p "Would you like to try another path? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                continue  # Try again with the loop
            else
                return 1
            fi
        fi
        
        # Check if it's a valid Next.js app (has package.json)
        if [ ! -f "$nextjs_path/package.json" ]; then
            print_warning "No package.json found in '$nextjs_path'. This may not be a valid Next.js app."
            read -p "Continue anyway? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                read -p "Would you like to try another path? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    continue  # Try again with the loop
                else
                    return 1
                fi
            fi
        fi
        
        # Ask for the port
        echo ""
        read -p "Enter the port for Next.js (default: 3000): " nextjs_port
        nextjs_port=${nextjs_port:-3000}
        
        # Validate port number
        if ! [[ "$nextjs_port" =~ ^[0-9]+$ ]] || [ "$nextjs_port" -lt 1 ] || [ "$nextjs_port" -gt 65535 ]; then
            print_error "Invalid port number. Using default port 3000."
            nextjs_port=3000
        fi
        
        # Export variables for use in start_services
        export NEXTJS_PATH="$nextjs_path"
        export NEXTJS_PORT="$nextjs_port"
        
        return 0  # Return true, start Next.js
    done
}

# Function to start all services
start_services() {
    print_status "Starting all services..."
    
    # Fix config issues before starting
    fix_supabase_config
    
    # Stop any existing Supabase instances to avoid port conflicts
    print_status "Stopping any existing Supabase instances..."
    supabase stop 2>/dev/null || true
    
    # Start Supabase
    print_status "Starting Supabase..."
    supabase start
    
    # Wait a bit for Supabase to start
    sleep 5
    
    # Always ensure Ollama is running
    print_status "Checking Ollama service..."
    if ensure_ollama_running; then
        echo -e "${GREEN}✅ Ollama service is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama service may not have started properly${NC}"
        echo "Please check if Ollama is installed and try running 'ollama serve' manually"
    fi
    
    # Pre-load embedding model for fast response
    if command -v ollama &> /dev/null; then
        print_status "Pre-loading embedding model ${EMBEDDING_MODEL}..."
        if echo "test" | ollama embed ${EMBEDDING_MODEL} > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Embedding model pre-loaded${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not pre-load embedding model${NC}"
        fi
    fi
    
    # Prompt for Next.js configuration
    NEXTJS_PID=""
    if prompt_nextjs_config; then
        # Start Next.js app with custom configuration
        print_status "Starting Next.js app from '$NEXTJS_PATH' on port $NEXTJS_PORT..."
        
        # Save current directory
        ORIGINAL_DIR=$(pwd)
        
        # Change to Next.js app directory
        cd "$NEXTJS_PATH"
        
        # Check if node_modules exists, if not install dependencies
        if [ ! -d "node_modules" ]; then
            print_status "Installing dependencies in $NEXTJS_PATH..."
            if command_exists pnpm; then
                pnpm install
            elif command_exists npm; then
                npm install
            elif command_exists yarn; then
                yarn install
            fi
        fi
        
        # Start the Next.js app with the specified port
        if command_exists pnpm; then
            PORT=$NEXTJS_PORT pnpm dev &
        elif command_exists npm; then
            PORT=$NEXTJS_PORT npm run dev &
        elif command_exists yarn; then
            PORT=$NEXTJS_PORT yarn dev &
        else
            print_error "No package manager found to start Next.js app"
            cd "$ORIGINAL_DIR"
            NEXTJS_PID=""
        fi
        
        if [ "$?" -eq 0 ]; then
            NEXTJS_PID=$!
            print_success "Next.js app started with PID $NEXTJS_PID"
        fi
        
        # Return to original directory
        cd "$ORIGINAL_DIR"
    else
        print_status "Skipping Next.js startup"
    fi
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Shutting down services..."
        if [ ! -z "$NEXTJS_PID" ]; then
            kill $NEXTJS_PID 2>/dev/null
        fi
        supabase stop
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    print_success "All services started!"
    echo ""
    print_status "Services running:"
    
    # Extract ports from environment or use defaults
    if [ -f "$SCRIPT_DIR/../.env" ]; then
        source "$SCRIPT_DIR/../.env"
        # Extract port from SUPABASE_URL
        SUPABASE_API_PORT=$(echo "$SUPABASE_URL" | grep -oE '[0-9]+$' || echo "64321")
        # Studio port is typically API port + 2
        SUPABASE_STUDIO_PORT=$((SUPABASE_API_PORT + 2))
    else
        # Read from config.toml or use new default ports
        if [ -f "$SCRIPT_DIR/../../supabase/config.toml" ]; then
            SUPABASE_API_PORT=$(grep -A1 "^\[api\]" "$SCRIPT_DIR/../../supabase/config.toml" | grep "^port =" | sed 's/port = //' || echo "64321")
            SUPABASE_STUDIO_PORT=$(grep -A1 "^\[studio\]" "$SCRIPT_DIR/../../supabase/config.toml" | grep "^port =" | sed 's/port = //' || echo "64323")
        else
            SUPABASE_API_PORT="64321"
            SUPABASE_STUDIO_PORT="64323"
        fi
    fi
    
    echo "  - Supabase Studio: http://localhost:$SUPABASE_STUDIO_PORT"
    echo "  - Supabase API: http://localhost:$SUPABASE_API_PORT"
    if [ ! -z "$NEXTJS_PID" ]; then
        echo "  - Next.js App: http://localhost:$NEXTJS_PORT (from $NEXTJS_PATH)"
    fi
    echo "  - Ollama API: http://localhost:11434"
    echo ""
    print_status "Press Ctrl+C to stop all services"
    
    # Wait for processes
    wait
}

# Helper function to ensure Ollama is running
ensure_ollama_running() {
    if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        echo -e "${YELLOW}Starting Ollama service...${NC}"
        if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            # Windows - Use start to launch in new window
            start "Ollama" ollama serve &
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            ollama serve > /dev/null 2>&1 &
        else
            # Linux
            systemctl --user start ollama 2>/dev/null || ollama serve > /dev/null 2>&1 &
        fi
        
        # Wait for service to start (up to 10 seconds)
        local attempts=0
        while [ $attempts -lt 10 ]; do
            if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
                return 0
            fi
            sleep 1
            ((attempts++))
        done
        
        return 1
    fi
    return 0
}

# Function to check and setup Ollama
check_and_setup_ollama() {
    echo -e "${BLUE}🦙 Checking Ollama setup...${NC}"
    
    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}⚠️  Ollama is not installed${NC}"
        echo "Ollama is required for embedding generation."
        echo "Please install Ollama from: https://ollama.ai"
        return 1
    fi
    
    echo -e "${GREEN}✅ Ollama is installed${NC}"
    
    # Always ensure Ollama service is running
    if ensure_ollama_running; then
        echo -e "${GREEN}✅ Ollama service is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not start Ollama service${NC}"
        echo "You may need to start it manually: ollama serve"
        return 1
    fi
    
    # Check if embedding model is installed
    echo -e "${BLUE}Checking for embedding model: ${EMBEDDING_MODEL}${NC}"
    
    # Get list of installed models
    if ollama list | grep -q "${EMBEDDING_MODEL%%:*}"; then
        echo -e "${GREEN}✅ Embedding model ${EMBEDDING_MODEL} is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Embedding model ${EMBEDDING_MODEL} is not installed${NC}"
        echo ""
        echo "This model is required for semantic search and embedding generation."
        echo "Model size: ~3-4GB (quantized version)"
        echo ""
        read -p "Would you like to install the embedding model now? (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Downloading embedding model...${NC}"
            echo "This may take a few minutes depending on your internet connection..."
            
            if ollama pull ${EMBEDDING_MODEL}; then
                echo -e "${GREEN}✅ Embedding model installed successfully${NC}"
            else
                echo -e "${RED}❌ Failed to install embedding model${NC}"
                echo "You can install it manually later with:"
                echo "  ollama pull ${EMBEDDING_MODEL}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  Skipping embedding model installation${NC}"
            echo "You can install it later with:"
            echo "  ollama pull ${EMBEDDING_MODEL}"
        fi
    fi
    
    # Pre-load the model for faster first-time use
    echo -e "${BLUE}Pre-loading embedding model...${NC}"
    echo "test" | ollama embed ${EMBEDDING_MODEL} > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ Model pre-loaded and ready${NC}" || \
        echo -e "${YELLOW}⚠️  Could not pre-load model (will load on first use)${NC}"
    
    return 0
}

# Main function
main() {
    echo "🚀 Circular Project Setup"
    echo "========================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-setup}" in
        "setup")
            prompt_api_keys
            install_dependencies
            
            # Ensure Ollama is running early in the setup process
            if command -v ollama &> /dev/null; then
                print_status "Ensuring Ollama service is running for setup..."
                ensure_ollama_running
            fi
            
            setup_supabase
            setup_database
            setup_nextjs
            check_and_setup_ollama
            print_success "Setup complete! Run './setup.sh start' to start all services"
            ;;
        "start")
            start_services
            ;;
        "stop")
            print_status "Stopping Supabase..."
            supabase stop
            print_success "Services stopped"
            ;;
        "reset")
            print_status "Resetting Supabase database..."
            supabase db reset
            setup_database
            print_success "Database reset complete"
            ;;
        "status")
            print_status "Checking service status..."
            supabase status
            ;;
        *)
            echo "Usage: $0 {setup|start|stop|reset|status}"
            echo ""
            echo "Commands:"
            echo "  setup  - Initial setup (install deps, configure API keys, setup Supabase)"
            echo "  start  - Start all services (Supabase + Next.js)"
            echo "  stop   - Stop all services"
            echo "  reset  - Reset database and re-run migrations"
            echo "  status - Show service status"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
