import { spawn } from "child_process";
import { readFileSync } from "fs";
import * as rpc from "vscode-jsonrpc/node";
import { printOutput } from "./helper";
import path = require("path");

// Get file to check
let pipelineFile = "./azure-pipelines.yml"; // Default path to the Azure Pipelines YAML file
const fileArgIndex = process.argv.indexOf("--file");
if (fileArgIndex !== -1 && process.argv[fileArgIndex + 1]) {
  pipelineFile = process.argv[fileArgIndex + 1];
}
console.log(`Checking Azure Pipelines YAML file: ${pipelineFile}`);

// Launch the Language Server
const serverPath = path.resolve(__dirname, '../azure-pipelines-language-server/language-server/out/server.js');
const serverProcess = spawn("node", [
  serverPath,
  "--stdio"
], {
  stdio: ["pipe", "pipe", "pipe"]
});
console.log("Language Server started");

// Start listening
const connection = rpc.createMessageConnection(
	new rpc.StreamMessageReader(serverProcess.stdout),
	new rpc.StreamMessageWriter(serverProcess.stdin)
);
connection.listen();
console.log("Connected to Language Server");

// Log output from Language Server
let didOutput = false;
connection.onNotification("textDocument/publishDiagnostics", (params) => {
  if (params.diagnostics.length > 0) {
    params.diagnostics.forEach((diagnostic: { severity: any; range: any; message: any; }) => {
      console.log(printOutput({
        severity: diagnostic.severity,
        range: diagnostic.range,
        message: diagnostic.message
      }));
    });
  } else {
    console.log("No diagnostics found.");
  }
  didOutput = true;
});

// Initialize the connection
connection.sendRequest("initialize", {
  processId: process.pid,
  rootUri: null,
  capabilities: {}
}).then(() => {
  // Send schema association manually
  connection.sendNotification("json/schemaAssociations", {
    "azure-pipelines.yml": ["https://raw.githubusercontent.com/microsoft/azure-pipelines-vscode/main/service-schema.json"]
  });
  const yamlText = readFileSync(pipelineFile, "utf8");

  connection.sendNotification("textDocument/didOpen", {
    textDocument: {
      uri: "file://" + require("path").resolve(pipelineFile),
      languageId: "yaml",
      version: 1,
      text: yamlText
    }
  });
  // Close the connection
  setTimeout(() => {
      connection.sendNotification("textDocument/didClose", {
      textDocument: {
          uri: "file://" + require("path").resolve(pipelineFile)
      }
      });
      serverProcess.kill();
      // Exit with correct status code
      if (!didOutput) {
          console.error("Valid Pipeline: No diagnostics found.");
      }
      console.log(`Exiting with status code:" ${didOutput ? 1 : 0}`);
      process.exit(didOutput ? 1 : 0);
  }, 1500);
});
