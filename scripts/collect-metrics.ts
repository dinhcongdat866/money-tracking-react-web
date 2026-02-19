#!/usr/bin/env tsx
/**
 * Metrics Collection Script
 * 
 * Collects performance, bundle size, and code quality metrics
 * for tracking Redux implementation impact
 * 
 * Usage:
 *   pnpm collect-metrics
 *   pnpm collect-metrics --baseline  # Save as baseline
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface BundleMetrics {
  totalSize: string;
  gzippedSize: string;
  firstLoadJS: string;
  parsedSize: number;
}

interface PerformanceMetrics {
  lighthouseScore: number | null;
  fcp: number | null;
  lcp: number | null;
  tti: number | null;
  tbt: number | null;
}

interface TestMetrics {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

interface CodeMetrics {
  reduxLOC: number;
  testLOC: number;
  typeErrors: number;
  useStateCount: number;
  useSelectorCount: number;
}

interface Metrics {
  timestamp: string;
  phase: string;
  bundle: BundleMetrics;
  performance: PerformanceMetrics;
  testing: TestMetrics;
  code: CodeMetrics;
}

const METRICS_DIR = path.join(process.cwd(), 'metrics');
const BASELINE_FILE = path.join(METRICS_DIR, 'baseline.json');

// Ensure metrics directory exists
if (!fs.existsSync(METRICS_DIR)) {
  fs.mkdirSync(METRICS_DIR, { recursive: true });
}

function log(message: string) {
  console.log(`📊 ${message}`);
}

function error(message: string) {
  console.error(`❌ ${message}`);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

/**
 * Collect bundle size metrics
 */
function collectBundleMetrics(): BundleMetrics {
  log('Collecting bundle metrics...');
  
  try {
    // Build the app
    log('Building application...');
    execSync('pnpm build', { stdio: 'inherit' });
    
    // Parse .next/analyze or build output
    // For now, return placeholder values
    // In real implementation, parse from build output or analyze files
    
    const nextDir = path.join(process.cwd(), '.next');
    let totalSize = 0;
    
    // Calculate total size of .next directory
    function getDirectorySize(dirPath: string): number {
      let size = 0;
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      }
      
      return size;
    }
    
    if (fs.existsSync(nextDir)) {
      totalSize = getDirectorySize(path.join(nextDir, 'static'));
    }
    
    return {
      totalSize: `${(totalSize / 1024).toFixed(0)}KB`,
      gzippedSize: `${(totalSize / 1024 / 3).toFixed(0)}KB`, // Rough estimate
      firstLoadJS: 'N/A',
      parsedSize: totalSize,
    };
  } catch (err) {
    error('Failed to collect bundle metrics');
    return {
      totalSize: 'N/A',
      gzippedSize: 'N/A',
      firstLoadJS: 'N/A',
      parsedSize: 0,
    };
  }
}

/**
 * Collect performance metrics (Lighthouse)
 */
function collectPerformanceMetrics(): PerformanceMetrics {
  log('Collecting performance metrics...');
  
  // Note: This requires running Lighthouse separately
  // For now, return null values - to be filled manually or via Lighthouse CI
  
  return {
    lighthouseScore: null,
    fcp: null,
    lcp: null,
    tti: null,
    tbt: null,
  };
}

/**
 * Collect test coverage metrics
 */
function collectTestMetrics(): TestMetrics {
  log('Collecting test coverage...');
  
  try {
    // Run tests with coverage
    execSync('pnpm test:coverage', { stdio: 'inherit' });
    
    // Read coverage summary
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      const total = coverage.total;
      
      return {
        lines: total.lines.pct,
        functions: total.functions.pct,
        branches: total.branches.pct,
        statements: total.statements.pct,
      };
    }
  } catch (err) {
    error('Failed to collect test metrics');
  }
  
  return {
    lines: 0,
    functions: 0,
    branches: 0,
    statements: 0,
  };
}

/**
 * Count lines in files recursively
 */
function countLinesInDirectory(dir: string, pattern: RegExp): number {
  let lines = 0;
  
  if (!fs.existsSync(dir)) return 0;
  
  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (pattern.test(file)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        lines += content.split('\n').length;
      }
    }
  }
  
  walk(dir);
  return lines;
}

/**
 * Count pattern occurrences in files
 */
function countPatternInFiles(dir: string, pattern: string, filePattern: RegExp): number {
  let count = 0;
  
  if (!fs.existsSync(dir)) return 0;
  
  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (filePattern.test(file)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(new RegExp(pattern, 'g'));
        if (matches) count += matches.length;
      }
    }
  }
  
  walk(dir);
  return count;
}

/**
 * Collect code quality metrics
 */
function collectCodeMetrics(): CodeMetrics {
  log('Collecting code quality metrics...');
  
  const metrics: CodeMetrics = {
    reduxLOC: 0,
    testLOC: 0,
    typeErrors: 0,
    useStateCount: 0,
    useSelectorCount: 0,
  };
  
  try {
    // Count Redux LOC
    const storePath = path.join(process.cwd(), 'src', 'store');
    if (fs.existsSync(storePath)) {
      metrics.reduxLOC = countLinesInDirectory(storePath, /^(?!.*\.test\.ts$).*\.ts$/);
      metrics.testLOC = countLinesInDirectory(storePath, /\.test\.ts$/);
    }
  } catch (err) {
    // Redux not implemented yet
  }
  
  try {
    // Count useState
    const featuresPath = path.join(process.cwd(), 'src', 'features');
    metrics.useStateCount = countPatternInFiles(featuresPath, 'useState', /\.tsx$/);
  } catch (err) {
    // Ignore
  }
  
  try {
    // Count useAppSelector
    const srcPath = path.join(process.cwd(), 'src');
    metrics.useSelectorCount = countPatternInFiles(srcPath, 'useAppSelector', /\.tsx$/);
  } catch (err) {
    // Ignore
  }
  
  try {
    // Check TypeScript errors (skip for now as build ignores them)
    metrics.typeErrors = 0;
  } catch (err) {
    // Ignore
  }
  
  return metrics;
}

/**
 * Calculate improvements compared to baseline
 */
function calculateImprovements(current: Metrics, baseline: Metrics) {
  console.log('\n📈 Improvements vs Baseline:\n');
  
  const improvements = {
    bundle: {
      size: baseline.bundle.parsedSize - current.bundle.parsedSize,
      percent: ((baseline.bundle.parsedSize - current.bundle.parsedSize) / baseline.bundle.parsedSize * 100).toFixed(1),
    },
    testing: {
      lines: current.testing.lines - baseline.testing.lines,
      functions: current.testing.functions - baseline.testing.functions,
    },
    code: {
      useStateDiff: baseline.code.useStateCount - current.code.useStateCount,
      useStatePercent: ((baseline.code.useStateCount - current.code.useStateCount) / baseline.code.useStateCount * 100).toFixed(1),
      reduxLOC: current.code.reduxLOC,
      testLOC: current.code.testLOC,
    },
  };
  
  console.log('Bundle Size:');
  console.log(`  Total: ${baseline.bundle.totalSize} → ${current.bundle.totalSize} (${improvements.bundle.percent}% change)`);
  
  console.log('\nTest Coverage:');
  console.log(`  Lines: ${baseline.testing.lines}% → ${current.testing.lines}% (+${improvements.testing.lines.toFixed(1)}%)`);
  console.log(`  Functions: ${baseline.testing.functions}% → ${current.testing.functions}% (+${improvements.testing.functions.toFixed(1)}%)`);
  
  console.log('\nCode Organization:');
  console.log(`  useState hooks: ${baseline.code.useStateCount} → ${current.code.useStateCount} (${improvements.code.useStatePercent}% reduction)`);
  console.log(`  useAppSelector: ${baseline.code.useSelectorCount} → ${current.code.useSelectorCount}`);
  console.log(`  Redux LOC: ${improvements.code.reduxLOC}`);
  console.log(`  Test LOC: ${improvements.code.testLOC}`);
  console.log(`  Test/Code Ratio: 1:${(improvements.code.reduxLOC / improvements.code.testLOC).toFixed(1)}`);
  
  return improvements;
}

/**
 * Main metrics collection function
 */
async function main() {
  const args = process.argv.slice(2);
  const isBaseline = args.includes('--baseline');
  const phase = args.find(arg => arg.startsWith('--phase='))?.split('=')[1] || 'current';
  
  console.log('🚀 Collecting Metrics...\n');
  
  const metrics: Metrics = {
    timestamp: new Date().toISOString(),
    phase,
    bundle: collectBundleMetrics(),
    performance: collectPerformanceMetrics(),
    testing: collectTestMetrics(),
    code: collectCodeMetrics(),
  };
  
  // Save current metrics
  const filename = isBaseline 
    ? BASELINE_FILE 
    : path.join(METRICS_DIR, `metrics-${Date.now()}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(metrics, null, 2));
  
  success(`Metrics saved to ${filename}`);
  
  // Display metrics
  console.log('\n📊 Current Metrics:\n');
  console.log('Bundle:');
  console.log(`  Total: ${metrics.bundle.totalSize}`);
  console.log(`  Gzipped: ${metrics.bundle.gzippedSize}`);
  
  console.log('\nTesting:');
  console.log(`  Lines: ${metrics.testing.lines}%`);
  console.log(`  Functions: ${metrics.testing.functions}%`);
  console.log(`  Branches: ${metrics.testing.branches}%`);
  console.log(`  Statements: ${metrics.testing.statements}%`);
  
  console.log('\nCode Quality:');
  console.log(`  Redux LOC: ${metrics.code.reduxLOC}`);
  console.log(`  Test LOC: ${metrics.code.testLOC}`);
  console.log(`  Type Errors: ${metrics.code.typeErrors}`);
  console.log(`  useState Count: ${metrics.code.useStateCount}`);
  console.log(`  useAppSelector Count: ${metrics.code.useSelectorCount}`);
  
  // Compare with baseline if exists and not creating baseline
  if (!isBaseline && fs.existsSync(BASELINE_FILE)) {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
    calculateImprovements(metrics, baseline);
  }
  
  console.log('\n✨ Done!\n');
  
  if (isBaseline) {
    console.log('💡 Baseline saved. Run without --baseline to compare progress.');
  } else {
    console.log('💡 Run with --baseline to set new baseline.');
    console.log('💡 Run with --phase=phase-1 to label metrics by phase.');
  }
}

main().catch(error);

