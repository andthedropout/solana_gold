#!/bin/bash

# Setup script for DALL-E MCP Server integration
# This script clones and sets up the DALL-E MCP server to run alongside Docker containers

set -e

echo "🎨 Setting up DALL-E MCP Server for local development..."

# Check if dalle-mcp directory already exists
if [ -d "dalle-mcp" ]; then
    echo "📁 DALL-E MCP directory already exists. Updating..."
    cd dalle-mcp
    git pull origin main
    cd ..
else
    echo "📥 Cloning DALL-E MCP repository..."
    git clone https://github.com/garoth/dalle-mcp.git
fi

# Enter the dalle-mcp directory
cd dalle-mcp

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the project..."
npm run build

cd ..

echo "✅ DALL-E MCP Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. The MCP server is configured to work with Cursor's MCP settings"
echo "2. Add this configuration to your Cursor MCP settings:"
echo ""
echo "   Path: ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
echo ""
echo "   Configuration:"
echo '   {'
echo '     "mcpServers": {'
echo '       "dalle-mcp": {'
echo '         "command": "node",'
echo "         \"args\": [\"$(pwd)/dalle-mcp/build/index.js\"],"
echo '         "env": {'
echo '           "OPENAI_API_KEY": "your-api-key-here",'
echo "           \"SAVE_DIR\": \"$(pwd)/public/images\""
echo '         },'
echo '         "disabled": false,'
echo '         "autoApprove": []'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "3. Replace 'your-api-key-here' with your actual OpenAI API key"
echo "4. Restart Cursor to load the MCP server"
echo ""
echo "🚨 IMPORTANT - Django Static File Paths:"
echo "   • AI images are saved to: $(pwd)/public/images/"
echo "   • Reference in React components as: /static/images/filename.png"
echo "   • Example: <img src=\"/static/images/ai-hero.png\" alt=\"AI image\" />"
echo ""
echo "🎯 The DALL-E MCP server will be available for AI image generation!" 