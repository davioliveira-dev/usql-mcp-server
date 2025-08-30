export type DbVars = Record<number, string>;

export function loadDbVars(): DbVars {
	const dbVars: Record<string, string> = Object.keys(process.env)
		.filter((key) => key.startsWith("DB_CS_") && /^\d+$/.test(key.slice(6)))
		.reduce((env: Record<string, string>, key) => {
			const envValue = process.env[key];
			// TODO: validate if connection string is valid
			if (envValue) {
				env[key] = envValue;
			}

			return env;
		}, {});

	if (Object.values(dbVars).length === 0) {
		throw new Error(
			"No connection strings provided! Use the DB_CS_1 as env var!",
		);
	}

	// Convert to numeric keys
	const numericDbVars: DbVars = {};
	for (const [key, value] of Object.entries(dbVars)) {
		const number = parseInt(key.slice(6), 10);
		numericDbVars[number] = value;
	}

	return numericDbVars;
}

export function getConnectionString(dbVars: DbVars, number: number): string | undefined {
	return dbVars[number];
}
