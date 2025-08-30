export async function executeUsqlQuery(
	connectionString: string, 
	query: string, 
	options?: { usqlPath?: string; timeoutMs?: number }
): Promise<any> {
	const usqlPath = options?.usqlPath || "usql";
	const timeoutMs = options?.timeoutMs || 30000; // 30 second default timeout

	return new Promise((resolve, reject) => {
		const args = [usqlPath, connectionString, "-c", query, "-J"];
		const proc = Bun.spawn(args, {
			stdout: "pipe",
			stderr: "pipe",
		});

		// Set up timeout
		const timeoutId = setTimeout(() => {
			proc.kill();
			reject(new Error(`Query timed out after ${timeoutMs}ms`));
		}, timeoutMs);

		proc.exited.then(async (exitCode) => {
			clearTimeout(timeoutId);
			
			if (exitCode !== 0) {
				const stderr = await proc.stderr.text();
				reject(new Error(`usql exited with code ${exitCode}. stderr: ${stderr}`));
				return;
			}

			try {
				const stdout = await proc.stdout.text();
				const result = JSON.parse(stdout);
				resolve(result);
			} catch (parseError) {
				const stdout = await proc.stdout.text();
				reject(new Error(`Failed to parse JSON output: ${parseError}. Output: ${stdout}`));
			}
		}).catch((error) => {
			clearTimeout(timeoutId);
			reject(new Error(`Failed to spawn usql: ${error.message}`));
		});
	});
}
