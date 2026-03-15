/**
 * Test Runner for Credits System
 * Runs all credits-related tests and generates coverage report
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  file: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class CreditsTestRunner {
  private testFiles = [
    'credits.service.spec.ts',
    'credits.controller.spec.ts',
    'credits.boundary.spec.ts',
    'credits.concurrent.spec.ts',
    'credits.integration.spec.ts',
  ];

  private results: TestResult[] = [];

  runAll(): void {
    console.log('🧪 Running Credits System Test Suite...\n');
    console.log('=' .repeat(60));

    this.testFiles.forEach((file) => {
      this.runTest(file);
    });

    this.generateReport();
  }

  private runTest(file: string): void {
    const filePath = path.join(__dirname, '..', 'src', 'modules', 'credits', file);
    const testPath = fs.existsSync(filePath) ? filePath : path.join(__dirname, file);

    if (!fs.existsSync(testPath)) {
      console.log(`⚠️  Test file not found: ${file}`);
      return;
    }

    console.log(`\n📋 Running: ${file}`);
    console.log('-'.repeat(60));

    const startTime = Date.now();

    try {
      const output = execSync(
        `npm test -- ${testPath} --coverage --coverageReporters=json-summary --silent`,
        {
          encoding: 'utf-8',
          cwd: path.join(__dirname, '..', '..'),
          stdio: 'pipe',
        },
      );

      const duration = Date.now() - startTime;

      // Parse test results
      const passed = (output.match(/✓/g) || []).length;
      const failed = (output.match(/✕/g) || []).length;
      const skipped = (output.match(/○/g) || []).length;

      // Parse coverage
      let coverage = undefined;
      const coveragePath = path.join(__dirname, '..', '..', 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        const total = coverageData.total;
        coverage = {
          lines: total.lines.pct,
          functions: total.functions.pct,
          branches: total.branches.pct,
          statements: total.statements.pct,
        };
      }

      this.results.push({
        file,
        passed,
        failed,
        skipped,
        duration,
        coverage,
      });

      console.log(`✅ ${passed} passed, ${failed} failed, ${skipped} skipped`);
      console.log(`⏱️  Duration: ${duration}ms`);
      if (coverage) {
        console.log(
          `📊 Coverage: Lines ${coverage.lines}%, Functions ${coverage.functions}%, Branches ${coverage.branches}%`,
        );
      }
    } catch (error: any) {
      console.log(`❌ Test failed: ${file}`);
      console.log(error.message);

      this.results.push({
        file,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
      });
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));

    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📈 Overall Results:');
    console.log(`  ✅ Passed:   ${totalPassed}`);
    console.log(`  ❌ Failed:   ${totalFailed}`);
    console.log(`  ⏭️  Skipped:  ${totalSkipped}`);
    console.log(`  ⏱️  Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    console.log('\n📋 Test Files:');
    this.results.forEach((result) => {
      const status = result.failed > 0 ? '❌' : '✅';
      console.log(
        `  ${status} ${result.file}: ${result.passed} passed, ${result.failed} failed (${result.duration}ms)`,
      );
      if (result.coverage) {
        console.log(
          `     📊 Coverage: Lines ${result.coverage.lines}%, Functions ${result.coverage.functions}%, Branches ${result.coverage.branches}%`,
        );
      }
    });

    // Calculate average coverage
    const coverageResults = this.results.filter((r) => r.coverage);
    if (coverageResults.length > 0) {
      const avgCoverage = {
        lines:
          coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) /
          coverageResults.length,
        functions:
          coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) /
          coverageResults.length,
        branches:
          coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) /
          coverageResults.length,
        statements:
          coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) /
          coverageResults.length,
      };

      console.log('\n📊 Average Coverage:');
      console.log(`  Lines:       ${avgCoverage.lines.toFixed(1)}%`);
      console.log(`  Functions:   ${avgCoverage.functions.toFixed(1)}%`);
      console.log(`  Branches:    ${avgCoverage.branches.toFixed(1)}%`);
      console.log(`  Statements:  ${avgCoverage.statements.toFixed(1)}%`);

      if (avgCoverage.lines >= 90) {
        console.log('\n✅ Coverage target met (>90%)!');
      } else {
        console.log(`\n⚠️  Coverage below target (90%). Current: ${avgCoverage.lines.toFixed(1)}%`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // Write report to file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            totalPassed,
            totalFailed,
            totalSkipped,
            totalDuration,
          },
          results: this.results,
        },
        null,
        2,
      ),
    );
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Run tests
const runner = new CreditsTestRunner();
runner.runAll();
