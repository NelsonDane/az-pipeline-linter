import chalk, { ChalkInstance } from "chalk";

type lspOutput = {
  severity: number,
  range: {
    start: {
      line: number,
      character: number
    },
    end: {
      line: number,
      character: number
    }
  },
  message: string
}

export function printOutput(data: lspOutput): string {
    // https://github.com/microsoft/vscode-languageserver-node/blob/a7c5e6557209ef416526fe509296ee00179c9aa3/types/src/main.ts#L614
    const severityMap: { [key: number]: { type: string; color: ChalkInstance; } } = {
        1: {
            type: "Error",
            color: chalk.red
        },
        2: {
            type: "Warning",
            color: chalk.yellow
        },
        3: {
            type: "Information",
            color: chalk.blue
        },
        4: {
            type: "Hint",
            color: chalk.green
        }
    };
    chalk.level = 1; // Enable color output
    const severity = severityMap[data.severity] || { type: "Unknown", color: "grey" };
    const start = `${data.range.start.line + 1}:${data.range.start.character + 1}`;
    const end = `${data.range.end.line + 1}:${data.range.end.character + 1}`;
    return `${severity.color(severity.type)} at ${start}-${end}: ${data.message}`;
}
