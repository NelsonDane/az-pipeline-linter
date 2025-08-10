import chalk, { ChalkInstance } from "chalk";
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';

export function printOutput(data: Diagnostic): string {
    let error_type: string;
    let color: ChalkInstance;
    switch (data.severity) {
      case DiagnosticSeverity.Error:
        error_type = "Error";
        color = chalk.red;
        break;
      case DiagnosticSeverity.Warning:
        error_type = "Warning";
        color = chalk.yellow;
        break;
      case DiagnosticSeverity.Information:
        error_type = "Information";
        color = chalk.blue;
        break;
      case DiagnosticSeverity.Hint:
        error_type = "Hint";
        color = chalk.green;
        break;
      default:
        error_type = "Unknown";
        color = chalk.gray;
        break;
    }
    chalk.level = 1; // Enable color output
    const start = `${data.range.start.line + 1}:${data.range.start.character + 1}`;
    const end = `${data.range.end.line + 1}:${data.range.end.character + 1}`;
    return `${color(error_type)} at ${start}-${end}: ${data.message}`;
}
