# LSP
FROM node:23-slim AS lsp-builder

# Install LSP dependencies
COPY ./azure-pipelines-language-server/language-server /language-server
WORKDIR /language-server
RUN npm ci

# Build the LSP
RUN npm run-script build
RUN npm prune --production


# Our Linter
FROM node:23-slim AS linter-builder

# Install Linter dependencies
COPY . /linter
WORKDIR /linter
RUN npm ci

# Build the Linter
RUN npm run build
RUN npm prune --production


# Final image
FROM node:23-slim
WORKDIR /app

# LSP output
COPY --from=lsp-builder /language-server/out /app/azure-pipelines-language-server/language-server/out
COPY --from=lsp-builder /language-server/node_modules /app/azure-pipelines-language-server/language-server/node_modules

# Linter output
COPY --from=linter-builder /linter/dist /app/dist
COPY --from=linter-builder /linter/node_modules /app/node_modules

# Run on execution and accept CLI args
ENTRYPOINT ["node", "/app/dist/linter.js"]
CMD []
