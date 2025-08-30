import { describe, it, expect, afterEach } from "bun:test";
import { loadDbVars, getConnectionString } from "../src/env.js";

describe("env", () => {
	const originalEnv = process.env;

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should load DB connection strings from environment", () => {
		process.env = {
			...originalEnv,
			DB_CS_1: "postgresql://user:pass@localhost/db1",
			DB_CS_2: "mysql://user:pass@localhost/db2",
			DB_CS_INVALID: "should be ignored",
			OTHER_VAR: "should be ignored"
		};

		const dbVars = loadDbVars();
		
		expect(dbVars).toEqual({
			1: "postgresql://user:pass@localhost/db1",
			2: "mysql://user:pass@localhost/db2"
		});
	});

	it("should throw error when no connection strings found", () => {
		process.env = { ...originalEnv };
		delete process.env.DB_CS_1;

		expect(() => loadDbVars()).toThrow("No connection strings provided! Use the DB_CS_1 as env var!");
	});

	it("should get connection string by number", () => {
		const dbVars = {
			1: "postgresql://user:pass@localhost/db1",
			2: "mysql://user:pass@localhost/db2"
		};

		expect(getConnectionString(dbVars, 1)).toBe("postgresql://user:pass@localhost/db1");
		expect(getConnectionString(dbVars, 2)).toBe("mysql://user:pass@localhost/db2");
		expect(getConnectionString(dbVars, 3)).toBeUndefined();
	});
});
