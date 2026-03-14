#!/bin/bash

# Teams Module Test Runner
# Usage: ./run-tests.sh [options]
# Options:
#   --coverage    Run with coverage report
#   --watch       Run in watch mode
#   --verbose     Run with verbose output

cd "$(dirname "$0")/.."

echo "🧪 Running Teams Module Tests..."
echo "================================"

if [[ "$*" == *"--coverage"* ]]; then
    echo "📊 Coverage report enabled"
    npx jest src/modules/teams/ --coverage --coverageReporters=text --coverageReporters=html
elif [[ "$*" == *"--watch"* ]]; then
    echo "👀 Watch mode enabled"
    npx jest src/modules/teams/ --watch
elif [[ "$*" == *"--verbose"* ]]; then
    echo "📝 Verbose output enabled"
    npx jest src/modules/teams/ --verbose
else
    npx jest src/modules/teams/
fi

echo ""
echo "✅ Test run complete!"
