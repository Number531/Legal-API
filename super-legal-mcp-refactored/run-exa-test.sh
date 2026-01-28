#!/bin/bash

# Test script for Exa structured outputs
echo "🧪 Running Exa Structured Output Tests..."
echo "========================================"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found"
    echo "Make sure EXA_API_KEY is set in environment"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the test
echo ""
echo "🚀 Starting test..."
echo ""
node test-exa-structured.js

echo ""
echo "✅ Test complete!"