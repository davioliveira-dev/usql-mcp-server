# usql-mcp-server

This project is not related or affiliated with official [USQL](https://github.com/xo/usql) CLI.

An MCP (Model Context Protocol) server that executes SQL queries using the usql universal SQL client.

## Features

- Execute SELECT queries against various databases through usql
- JSON output format for structured data
- Support for multiple database connection strings
- Automatic usql binary download (optional and not recommended)

## Setup

To install dependencies:

```bash
bun install
```

To tests
```bash
bun test
```

## Configuration

Set database connection strings as environment variables:

```bash
export DB_CS_1="postgres://user:pass@host:port/db"
export DB_CS_2="mysql://user:pass@host:port/db"
export DB_CS_3="/home/davio/northwind.db"  # SQLite file path
# Add more as needed: DB_CS_4, DB_CS_5, etc.
```

Database connection strings can be:
- Standard database URLs (postgres://, mysql://, etc.)
- Absolute file paths for SQLite databases (e.g., `/home/davio/northwind.db`)

## Binary Setup

### Option 1: Use system usql
Install usql on your system and ensure it's in PATH.

### Option 2: Auto-download (unsafe)
Set `UNSAFE_USQL_BINARY=true` to automatically download the usql binary.

```bash
export UNSAFE_USQL_BINARY=true
```

## Usage

Run the MCP server:

```bash
bun run index.ts
```

The server provides a `run-query` tool that:
- Takes a SQL query (SELECT only)
- Takes a connection string number (1, 2, etc.)
- Executes: `usql <connection_string> -c "<query>" -J`
- Returns JSON formatted results

## Security

- Only SELECT queries are allowed
- No DDL/DML operations (INSERT, UPDATE, DELETE, DROP, etc.)

This project was created using `bun init` in bun v1.2.21. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
