#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { LunchFlowImporter } from './importer';

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let configPath: string | undefined;
    let command: string | undefined;
    
    // Extract --config flag and its value
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--config' && i + 1 < args.length) {
        configPath = args[i + 1];
        i++; // skip the next argument
      } else if (args[i].startsWith('--config=')) {
        configPath = args[i].split('=')[1];
      } else if (!command) {
        command = args[i];
      }
    }
    
    const importer = new LunchFlowImporter(configPath);
    
    if (command === 'import') {
      // Direct import command - skip the interactive menu
      await importer.runImport();
    } else if (command === 'help' || command === '--help' || command === '-h') {
      showHelp();
    } else if (command) {
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.yellow('Use "help" to see available commands'));
      process.exit(1);
    } else {
      // No command provided - run interactive mode
      await importer.run();
    }
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.blue.bold('\n🍽️  Lunch Flow → Actual Budget Importer\n'));
  console.log(chalk.gray('Usage: actual-flow [command] [options]\n'));
  console.log(chalk.cyan('Commands:'));
  console.log('  import    Run the import process directly (non-interactive)');
  console.log('  help      Show this help message');
  console.log('  (no args) Run in interactive mode\n');
  console.log(chalk.cyan('Options:'));
  console.log('  --config <path>   Specify a custom config file (default: config.json)');
  console.log('  --config=<path>   Alternative syntax for specifying config file\n');
  console.log(chalk.gray('Examples:'));
  console.log('  actual-flow import                        # Run import with default config.json');
  console.log('  actual-flow --config prod.json    # Run interactive mode with custom config');
  console.log('  actual-flow import --config prod.json     # Run import with custom config');
  console.log('  actual-flow help                          # Show help\n');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

main();
