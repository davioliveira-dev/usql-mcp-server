import fs from "node:fs";
import path from "node:path";
import decompress from "decompress";

type SupportedPlatforms = "win32" | "linux" | "darwin";
type SupportedArchs = "arm" | "arm64" | "x64";

export async function findUsqlInPath(): Promise<string | null> {
	// Simple check if usql is in PATH
	try {
		const proc = Bun.spawn(["which", "usql"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		
		await proc.exited;
		if (proc.exitCode === 0) {
			const stdout = await proc.stdout.text();
			return stdout.trim();
		}
	} catch (error) {
		// which command failed or usql not found
	}
	return null;
}

export async function ensureUsql(opts?: { usqlPath?: string }): Promise<string> {
	const unsafeUSQLBinary = process.env.UNSAFE_USQL_BINARY === "true";
	const usqlPath = opts?.usqlPath || (unsafeUSQLBinary ? path.join(process.cwd(), "usql") : "usql");

	if (!unsafeUSQLBinary) {
		// Try to find usql in PATH first
		const pathUsql = await findUsqlInPath();
		if (pathUsql) {
			return pathUsql;
		}
		
		// Check if provided path exists
		if (fs.existsSync(usqlPath)) {
			return usqlPath;
		}

		throw new Error(
			`usql binary not found at path: ${usqlPath}. Please ensure it is installed and accessible or set UNSAFE_USQL_BINARY=true to download it automatically.`,
		);
	}

	// UNSAFE_USQL_BINARY=true - download if not exists
	if (fs.existsSync(usqlPath)) {
		return usqlPath;
	}

	const detectedSystem = process.platform;
	const detectedArch = process.arch;

	if (!["arm", "arm64", "x64"].includes(detectedArch)) {
		throw new Error("Unsupported CPU arch.");
	}

	if (!["win32", "linux", "darwin"].includes(detectedSystem)) {
		throw new Error(
			`Unsupported system: ${detectedSystem}. Supported systems are: win32, linux, darwin.`,
		);
	}

	const binaries: Record<`${SupportedPlatforms}_${SupportedArchs}`, string> = {
		darwin_arm:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-darwin-arm64.tar.bz2",
		darwin_arm64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-darwin-arm64.tar.bz2",
		darwin_x64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-darwin-amd64.tar.bz2",
		linux_arm:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-darwin-amd64.tar.bz2",
		linux_arm64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-linux-arm64.tar.bz2",
		linux_x64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-linux-amd64.tar.bz2",
		win32_arm:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-windows-amd64.zip",
		win32_arm64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-windows-amd64.zip",
		win32_x64:
			"https://github.com/xo/usql/releases/download/v0.19.25/usql-0.19.25-windows-amd64.zip",
	};

	const binaryUrl =
		binaries[
			`${detectedSystem}_${detectedArch}` as `${SupportedPlatforms}_${SupportedArchs}`
		];

	try {
		console.log(`Downloading binary from: ${binaryUrl}`);
		const response = await fetch(binaryUrl);

		if (!response.ok) {
			throw new Error(
				`Failed to download binary: ${response.status} ${response.statusText}`,
			);
		}

		const compressedData = await response.arrayBuffer();
		const uint8Data = new Uint8Array(compressedData);

		console.log(`Downloaded ${uint8Data.length} bytes, extracting...`);

		// Save the compressed file temporarily
		const tempBz2Path = path.join(process.cwd(), "temp.tar.bz2");
		fs.writeFileSync(tempBz2Path, uint8Data);

		// Extract the bz2 file using decompress (which handles bz2 + tar)
		const finalExtractDir = path.join(process.cwd(), "usql_extracted");

		if (!fs.existsSync(finalExtractDir)) {
			fs.mkdirSync(finalExtractDir);
		}

		// Use decompress to handle the .tar.bz2 file directly
		await decompress(tempBz2Path, finalExtractDir);

		// Find the usql binary recursively
		function findUsqlBinary(dir: string): string | null {
			const files = fs.readdirSync(dir, { withFileTypes: true });

			for (const file of files) {
				const fullPath = path.join(dir, file.name);

				if (file.isDirectory()) {
					const result = findUsqlBinary(fullPath);
					if (result) return result;
				} else if (
					file.name === "usql" ||
					(file.name.startsWith("usql") && !file.name.includes("."))
				) {
					return fullPath;
				}
			}
			return null;
		}

		const foundUsqlPath = findUsqlBinary(finalExtractDir);

		if (!foundUsqlPath) {
			throw new Error("usql binary not found in extracted files");
		}

		const finalBinaryPath = path.join(process.cwd(), "usql");

		// Copy the binary to the final location
		fs.copyFileSync(foundUsqlPath, finalBinaryPath);

		// Make it executable (on Unix systems)
		if (process.platform !== "win32") {
			fs.chmodSync(finalBinaryPath, 0o755);
		}

		// Clean up temporary files
		fs.rmSync(tempBz2Path, { force: true });
		fs.rmSync(finalExtractDir, { recursive: true, force: true });

		console.log("Binary extracted and saved as 'usql'");
		return finalBinaryPath;
	} catch (error) {
		console.error("Failed to download or extract binary:", error);
		throw error;
	}
}
