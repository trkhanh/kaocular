#!/bin/bash

echo "🔑 Agent System API Key Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.sample .env
    echo "✅ Created .env file"
else
    echo "📝 .env file already exists"
fi

echo ""
echo "🤖 Choose your AI provider:"
echo "1) Anthropic (Claude) - Recommended for computer use"
echo "2) OpenAI (GPT-4)"
echo "3) Cerebras (Note: Limited computer use support)"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔗 Get your Anthropic API key from: https://console.anthropic.com/"
        echo "📝 Add it to your .env file:"
        echo "   ANTHROPIC_API_KEY=your_key_here"
        echo ""
        read -p "Enter your Anthropic API key: " api_key
        if [ ! -z "$api_key" ]; then
            # Remove existing ANTHROPIC_API_KEY line and add new one
            sed -i '' '/^ANTHROPIC_API_KEY=/d' .env
            echo "ANTHROPIC_API_KEY=$api_key" >> .env
            echo "✅ API key added to .env file"
        fi
        ;;
    2)
        echo ""
        echo "🔗 Get your OpenAI API key from: https://platform.openai.com/api-keys"
        echo "📝 Add it to your .env file:"
        echo "   OPENAI_API_KEY=your_key_here"
        echo ""
        read -p "Enter your OpenAI API key: " api_key
        if [ ! -z "$api_key" ]; then
            # Remove existing OPENAI_API_KEY line and add new one
            sed -i '' '/^OPENAI_API_KEY=/d' .env
            echo "OPENAI_API_KEY=$api_key" >> .env
            echo "✅ API key added to .env file"
        fi
        ;;
    3)
        echo ""
        echo "⚠️  Warning: Cerebras has limited computer use support"
        echo "🔗 Get your Cerebras API key from: https://console.cerebras.net/"
        echo "📝 Add it to your .env file:"
        echo "   CEREBRAS_API_KEY=your_key_here"
        echo ""
        read -p "Enter your Cerebras API key: " api_key
        if [ ! -z "$api_key" ]; then
            # Remove existing CEREBRAS_API_KEY line and add new one
            sed -i '' '/^CEREBRAS_API_KEY=/d' .env
            echo "CEREBRAS_API_KEY=$api_key" >> .env
            echo "✅ API key added to .env file"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   ./agent.sh --run"
echo ""
echo "📚 For more information, see .cursorrules file"
