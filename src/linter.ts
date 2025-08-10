import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  getLanguageService,
  LanguageService,
  LanguageSettings,
  SchemaRequestService
} from '../azure-pipelines-language-server/language-service/src/yamlLanguageService';
import { parse as parseYAML } from '../azure-pipelines-language-server/language-service/src/parser/yamlParser';
import { printOutput } from './helper';

// Azure Pipelines schema URI
const URI = "https://raw.githubusercontent.com/microsoft/azure-pipelines-vscode/main/service-schema.json";

// Schema Request Service. We only have one, but this could be extended in the future.
const schemaRequestService: SchemaRequestService = (uri: string) => {
  if (!uri || uri === URI) {
    const schema = fs.readFileSync(path.resolve(__dirname, '../schemas/service-schema.json'), 'utf-8');
    return Promise.resolve(JSON.parse(schema));
  }
  return Promise.reject(`Schema URI not supported: ${uri}`);
};

// Current Workspace
const workspaceContext = {
  resolveRelativePath: (relativePath: string, resource: string) => {
    return path.resolve(path.dirname(resource), relativePath);
  }
};

// Create the language service
const languageService: LanguageService = getLanguageService(
  schemaRequestService,
  [], // no JSON worker contributions
  (_uri: string) => Promise.resolve(_uri),
  workspaceContext
);

// Configure it with Azure Pipelines schema
const settings: LanguageSettings = {
  validate: true,
  schemas: [
    {
      uri: URI,
      fileMatch: ['azure-pipelines.yml', 'azure-pipelines.yaml'],
    }
  ]
};
languageService.configure(settings);

// Load input file and parse
if (process.argv.length < 3) {
  console.error('Usage: npx ts-node src/linter.ts --file <path-to-yaml-file>');
  process.exit(1);
}
const filePathIndex = process.argv.indexOf('--file') + 1;
if (filePathIndex === 0 || filePathIndex >= process.argv.length) {
  console.error('Error: Please provide a file path after --file');
  process.exit(1);
}
const filePath = process.argv[filePathIndex];
const content = fs.readFileSync(filePath, 'utf8');
const document = TextDocument.create(`file://${filePath}`, 'yaml', 0, content);
const yamlDocs = parseYAML(document.getText());

// Run validation on each document
yamlDocs.documents.forEach(async (doc) => {
  const diagnostics = await languageService.doValidation(document, { documents: [doc], errors: [], warnings: [] });
  diagnostics.forEach(diag => {
    // const { line, character } = diag.range.start;
    // console.log(`${filePath}:${line + 1}:${character + 1} - ${diag.message}`);
    console.log(printOutput(diag));
  });
});
