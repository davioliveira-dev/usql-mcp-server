import { describe, it, expect } from "bun:test";
import { inputSchema } from "../src/schema.js";

describe("inputSchema", () => {
	it("should allow valid SELECT queries", () => {
		const valid = {
			query: "SELECT * FROM users",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(valid)).not.toThrow();
	});

	it("should allow WITH queries", () => {
		const valid = {
			query: "WITH cte AS (SELECT id FROM users) SELECT * FROM cte",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(valid)).not.toThrow();
	});

	it("should allow EXPLAIN queries", () => {
		const valid = {
			query: "EXPLAIN SELECT * FROM users",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(valid)).not.toThrow();
	});

	it("should reject INSERT queries", () => {
		const invalid = {
			query: "INSERT INTO users (name) VALUES ('test')",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("DDL/DML queries are not allowed");
	});

	it("should reject UPDATE queries", () => {
		const invalid = {
			query: "UPDATE users SET name = 'test'",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("Only read-only queries are allowed");
	});

	it("should reject DELETE queries", () => {
		const invalid = {
			query: "DELETE FROM users WHERE id = 1",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("Only read-only queries are allowed");
	});

	it("should reject DROP queries", () => {
		const invalid = {
			query: "DROP TABLE users",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("Only read-only queries are allowed");
	});

	it("should reject multiple statements", () => {
		const invalid = {
			query: "SELECT * FROM users; DROP TABLE users;",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("Multiple statements (;) are not allowed");
	});

	it("should reject empty queries", () => {
		const invalid = {
			query: "",
			connectionStringNumber: 1
		};
		
		expect(() => inputSchema.parse(invalid)).toThrow("Query cannot be empty");
	});
});
