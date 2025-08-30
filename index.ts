import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadDbVars, getConnectionString } from "./src/env.js";
import { ensureUsql } from "./src/usql-binary.js";
import { executeUsqlQuery } from "./src/query.js";
import { inputSchema } from "./src/schema.js";

const dbVars = loadDbVars();

const server = new McpServer({
	name: "usql-mcp-server",
	version: "1.0.0",
});

server.registerTool(
	"run-query",
	{
		title: "Run SQL Query",
		inputSchema: inputSchema.shape
	},
	async (input) => {
		const { query, connectionStringNumber } = input;
		const connectionString = getConnectionString(dbVars, connectionStringNumber);

		try {
			if (!connectionString) {
				throw new Error(`Connection string not found for number: ${connectionStringNumber}`);
			}

			const usqlPath = await ensureUsql();
			const result = await executeUsqlQuery(connectionString, query, { usqlPath });
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error executing query: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("USQL MCP Server started successfully");
}

main().catch((error) => {
	console.error("Server failed to start:", error);
	process.exit(1);
});
