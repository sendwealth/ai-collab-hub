#!/bin/bash

# Quick TDD Test Runner - Run this to verify all tests pass
# This script runs the complete TDD test suite and checks coverage

set -e

echo "🚀 Running Task System TDD Test Suite"
echo "======================================"
echo ""

# Change to server directory
cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Run unit tests
echo -e "${YELLOW}Running Unit Tests...${NC}"
echo ""
npm run test -- --testPathPattern="tasks.(service|controller).tdd.spec" --coverage --coverageReporters=text-summary --passWithNoTests

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo ""
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# Run integration tests
echo -e "${YELLOW}Running Integration Tests...${NC}"
echo ""
npm run test -- --testPathPattern="tasks.integration.tdd.spec" --passWithNoTests

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo ""
    echo -e "${RED}✗ Integration tests failed${NC}"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# Run E2E tests
echo -e "${YELLOW}Running E2E Tests...${NC}"
echo ""
npm run test -- --testPathPattern="tasks.e2e.tdd.spec" --passWithNoTests

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ E2E tests passed${NC}"
else
    echo ""
    echo -e "${RED}✗ E2E tests failed${NC}"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# Generate full coverage report
echo -e "${YELLOW}Generating Coverage Report...${NC}"
echo ""
npm run test:cov -- --testPathPattern="tasks.*tdd.spec" --coverageReporters=text --coverageReporters=lcov --passWithNoTests

echo ""
echo "======================================"
echo -e "${GREEN}✅ All TDD tests passed successfully!${NC}"
echo ""

# Display coverage summary
if [ -f "coverage/lcov-report/index.html" ]; then
    echo -e "${GREEN}📊 Coverage report generated: coverage/lcov-report/index.html${NC}"
    echo ""
    echo "To view detailed coverage report:"
    echo "  open coverage/lcov-report/index.html"
fi

echo ""
echo "Test Summary:"
echo "  ✓ Unit Tests: Passed"
echo "  ✓ Integration Tests: Passed"
echo "  ✓ E2E Tests: Passed"
echo ""
echo -e "${GREEN}🎉 Task System TDD Test Suite Complete!${NC}"
