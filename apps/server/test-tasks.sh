#!/bin/bash

# TDD Test Runner for Task System
# Runs all test suites and generates coverage reports

set -e

echo "🧪 Task System TDD Test Suite"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test types
UNIT_TESTS="tasks.service.tdd.spec tasks.controller.tdd.spec"
INTEGRATION_TESTS="tasks.integration.tdd.spec"
E2E_TESTS="tasks.e2e.tdd.spec"

# Function to run tests
run_tests() {
    local test_type=$1
    local test_files=$2
    
    echo -e "${BLUE}Running ${test_type}...${NC}"
    echo ""
    
    for test_file in $test_files; do
        echo -e "${BLUE}Running ${test_file}...${NC}"
        
        if npm run test -- --testPathPattern="${test_file}" --coverage --coverageReporters=text --coverageReporters=lcov; then
            echo -e "${GREEN}✓ ${test_file} passed${NC}"
        else
            echo -e "${RED}✗ ${test_file} failed${NC}"
            return 1
        fi
        
        echo ""
    done
    
    echo -e "${GREEN}✓ ${test_type} completed successfully${NC}"
    echo ""
}

# Main execution
main() {
    local test_scope=${1:-all}
    local coverage_threshold=90
    
    echo "Test scope: ${test_scope}"
    echo ""
    
    case $test_scope in
        unit)
            run_tests "Unit Tests" "$UNIT_TESTS"
            ;;
        integration)
            run_tests "Integration Tests" "$INTEGRATION_TESTS"
            ;;
        e2e)
            run_tests "E2E Tests" "$E2E_TESTS"
            ;;
        all)
            run_tests "Unit Tests" "$UNIT_TESTS"
            run_tests "Integration Tests" "$INTEGRATION_TESTS"
            run_tests "E2E Tests" "$E2E_TESTS"
            ;;
        coverage)
            echo -e "${BLUE}Running all tests with coverage report...${NC}"
            echo ""
            
            npm run test:cov -- --testPathPattern="tasks.*tdd.spec"
            
            # Check coverage threshold
            if [ -f coverage/lcov-report/index.html ]; then
                echo ""
                echo -e "${GREEN}Coverage report generated: coverage/lcov-report/index.html${NC}"
            fi
            ;;
        watch)
            echo -e "${BLUE}Running tests in watch mode...${NC}"
            npm run test:watch -- --testPathPattern="tasks.*tdd.spec"
            ;;
        *)
            echo "Usage: $0 {unit|integration|e2e|all|coverage|watch}"
            echo ""
            echo "Options:"
            echo "  unit        - Run unit tests only"
            echo "  integration - Run integration tests only"
            echo "  e2e         - Run E2E tests only"
            echo "  all         - Run all test suites (default)"
            echo "  coverage    - Run all tests with detailed coverage report"
            echo "  watch       - Run tests in watch mode"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Test execution completed!${NC}"
}

# Run main function with arguments
main "$@"
