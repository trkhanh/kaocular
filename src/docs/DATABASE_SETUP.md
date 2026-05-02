# Database Setup Guide

This guide covers the complete setup for Prisma, Supabase (local), pgvector embeddings, and pg_trgm text search.

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh setup
   ```

2. **Start all services:**
   ```bash
   ./setup.sh start
   ```

## What's Included

### 🗄️ Database Stack
- **Prisma**: Type-safe database client
- **Supabase (Local)**: PostgreSQL with extensions
- **pgvector**: Vector similarity search (1536 dimensions)
- **pg_trgm**: Trigram text similarity search
- **tsvector**: Full-text search with ranking

### 🔍 Search Capabilities
- **Text Similarity**: Fuzzy text matching using trigrams
- **Full-Text Search**: PostgreSQL's built-in text search with ranking
- **Vector Similarity**: Semantic search using embeddings (Ollama)
- **Hybrid Search**: Combines text and vector search for best results

### 🚀 Features
- Automatic API key prompting and configuration
- Local Supabase instance with all extensions
- Next.js app with database integration
- Example usage scripts
- Shell script for easy management

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh
```

### 3. Initialize Supabase
```bash
supabase init
supabase start
```

### 4. Configure Environment
Copy `env.sample` to `.env` and fill in your API keys:
```bash
cp env.sample .env
```

Required keys:
- `BROWSERBASE_API_KEY` (optional, for cloud browser)

### 5. Setup Database
```bash
pnpm db:generate
pnpm db:push
```

### 6. Create Next.js App
```bash
pnpm create next-app@latest next-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd next-app
pnpm add @prisma/client @supabase/supabase-js
cd ..
```

## Database Schema

The database includes the following models:

### Document Model
```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  content     String
  embedding   Unsupported("vector(1536)")?  // pgvector
  searchVector Unsupported("tsvector")?     // Full-text search
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Indexes
- **Vector Index**: `ivfflat` for cosine similarity search
- **Text Search Index**: `GIN` for full-text search
- **Trigram Indexes**: `GIN` for fuzzy text matching

## Usage Examples

### Basic Operations
```typescript
import { DatabaseService, generateEmbedding } from './lib/database';

// Create document with embedding
const embedding = await generateEmbedding('Your text here');
const doc = await DatabaseService.createDocument(
  'Title',
  'Content',
  embedding
);

// Search by text similarity
const results = await DatabaseService.searchByText('query', 10);

// Search by vector similarity
const queryEmbedding = await generateEmbedding('query');
const vectorResults = await DatabaseService.searchByVector(queryEmbedding, 10);

// Hybrid search
const hybridResults = await DatabaseService.hybridSearch('query', queryEmbedding, 10);
```

### Run Example
```bash
pnpm run:database
```

## Shell Script Commands

The `setup.sh` script provides several commands:

```bash
./setup.sh setup   # Initial setup
./setup.sh start   # Start all services
./setup.sh stop    # Stop all services
./setup.sh reset   # Reset database
./setup.sh status  # Show service status
```

## Service URLs

When running, the following services are available:

- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Next.js App**: http://localhost:3000
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

## Troubleshooting

### Common Issues

1. **Supabase CLI not found**
   ```bash
   # Install via Homebrew (macOS)
   brew install supabase/tap/supabase
   
   # Or download from GitHub releases
   ```

2. **Database connection issues**
   ```bash
   # Check Supabase status
   supabase status
   
   # Restart Supabase
   supabase stop
   supabase start
   ```

3. **Prisma client issues**
   ```bash
   # Regenerate Prisma client
   pnpm db:generate
   
   # Push schema changes
   pnpm db:push
   ```

4. **Environment variable issues**
   - Check your `.env` file has the correct configuration
   - Ensure Ollama URL is configured for embeddings

### Reset Everything
```bash
./setup.sh reset
```

This will reset the database and re-run all migrations.

## Development Workflow

1. **Start development:**
   ```bash
   ./setup.sh start
   ```

2. **Make changes to schema:**
   - Edit `prisma/schema.prisma`
   - Run `pnpm db:push` to apply changes

3. **Add new migrations:**
   ```bash
   pnpm db:migrate
   ```

4. **View database:**
   ```bash
   pnpm db:studio
   ```

## Production Considerations

For production deployment:

1. Use a managed PostgreSQL database with pgvector support
2. Set up proper environment variables
3. Configure Supabase project (not local)
4. Set up proper indexing strategies
5. Consider connection pooling for high traffic

## Support

If you encounter issues:

1. Check the logs: `supabase logs`
2. Verify all services are running: `./setup.sh status`
3. Test database connection: `pnpm run:database`
4. Check environment variables in `.env`

