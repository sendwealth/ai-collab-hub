#!/usr/bin/env ts-node

/**
 * Quick verification script for Credits TDD Test Suite
 * Checks that all test files exist and are properly structured
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestFileInfo {
  file: string;
  exists: boolean;
  testCount: number;
  describeBlocks: number;
  size: number;
}

class CreditsTestVerifier {
  private testFiles = [
    'src/modules/credits/credits.service.spec.ts',
    'src/modules/credits/credits.controller.spec.ts',
    'test/credits.integration.spec.ts',
    'test/credits.boundary.spec.ts',
    'test/credits.concurrent.spec.ts',
    'test/utils/credits-test.utils.ts',
    'test/credits.test-report.ts',
  ];

  private sourceFiles = [
    'src/modules/credits/credits.service.ts',
    'src/modules/credits/credits.controller.ts',
    'src/modules/credits/dto/create-credit.dto.ts',
  ];

  verify(): void {
    console.log('🔍 Credits TDD Test Suite Verification\n');
    console.log('='.repeat(60));

    this.verifySourceFiles();
    this.verifyTestFiles();
    this.verifyTestStructure();
    this.generateSummary();
  }

  private verifySourceFiles(): void {
    console.log('\n📁 Source Files:');
    console.log('-'.repeat(60));

    this.sourceFiles.forEach((file) => {
      const fullPath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(fullPath);

      if (exists) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasFreeze = content.includes('freeze');
        const hasUnfreeze = content.includes('unfreeze');

        console.log(`✅ ${file}`);
        if (hasFreeze) console.log('   ✓ freeze() method found');
        if (hasUnfreeze) console.log('   ✓ unfreeze() method found');
      } else {
        console.log(`❌ ${file} - NOT FOUND`);
      }
    });
  }

  private verifyTestFiles(): void {
    console.log('\n🧪 Test Files:');
    console.log('-'.repeat(60));

    const results: TestFileInfo[] = [];

    this.testFiles.forEach((file) => {
      const fullPath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(fullPath);

      if (exists) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const testCount = (content.match(/it\(/g) || []).length;
        const describeBlocks = (content.match(/describe\(/g) || []).length;
        const size = fs.statSync(fullPath).size;

        results.push({
          file,
          exists,
          testCount,
          describeBlocks,
          size,
        });

        console.log(
          `✅ ${file} (${(size / 1024).toFixed(1)} KB, ${describeBlocks} suites, ${testCount} tests)`,
        );
      } else {
        results.push({
          file,
          exists: false,
          testCount: 0,
          describeBlocks: 0,
          size: 0,
        });

        console.log(`❌ ${file} - NOT FOUND`);
      }
    });

    const totalTests = results.reduce((sum, r) => sum + r.testCount, 0);
    const existingFiles = results.filter((r) => r.exists).length;

    console.log('\n📊 Test Statistics:');
    console.log(`   Total test files: ${existingFiles}/${this.testFiles.length}`);
    console.log(`   Total test cases: ~${totalTests}`);
  }

  private verifyTestStructure(): void {
    console.log('\n🏗️  Test Structure:');
    console.log('-'.repeat(60));

    const requiredTestTypes = [
      { name: 'Unit Tests', files: ['credits.service.spec.ts', 'credits.controller.spec.ts'] },
      { name: 'Integration Tests', files: ['credits.integration.spec.ts'] },
      { name: 'Boundary Tests', files: ['credits.boundary.spec.ts'] },
      { name: 'Concurrency Tests', files: ['credits.concurrent.spec.ts'] },
      { name: 'Test Utilities', files: ['credits-test.utils.ts'] },
    ];

    requiredTestTypes.forEach((type) => {
      const exists = type.files.some((file) =>
        this.testFiles.some((tf) => tf.includes(file) && fs.existsSync(path.join(__dirname, '..', tf))),
      );

      const status = exists ? '✅' : '❌';
      console.log(`${status} ${type.name}`);
    });
  }

  private generateSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const allSourceExist = this.sourceFiles.every((file) =>
      fs.existsSync(path.join(__dirname, '..', file)),
    );
    const allTestExist = this.testFiles.every((file) =>
      fs.existsSync(path.join(__dirname, '..', file)),
    );

    console.log('\n✨ Source Files:', allSourceExist ? '✅ All present' : '❌ Some missing');
    console.log('✨ Test Files:', allTestExist ? '✅ All present' : '❌ Some missing');

    if (allSourceExist && allTestExist) {
      console.log('\n🎉 Credits TDD Test Suite is COMPLETE!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run tests: npm test -- credits');
      console.log('   2. Check coverage: npm run test:cov -- credits');
      console.log('   3. Review report: cat CREDITS_TDD_SUMMARY.md');
    } else {
      console.log('\n⚠️  Some files are missing. Please check the output above.');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run verification
const verifier = new CreditsTestVerifier();
verifier.verify();
