# Azure Devops Pipeline Linter

Lint your Azure DevOps YAML pipelines locally from the command line.

## About
This is a simple linter for Azure DevOps YAML pipelines. It uses the official [Microsoft Azure Pipelines Language Server](https://github.com/microsoft/azure-pipelines-language-server) (the same thing that VS Code uses) to validate your YAML pipelines.

This enables the ability to lint pipelines before committing them to your repository, or creating a pipeline which lints other pipelines (perfect for a build rule if pipelines are modified).
