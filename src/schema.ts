import z from 'zod/v3';

const readOnlyStart = /^\s*(with|select|explain)\b/i;
const forbiddenDml = /\b(insert|update|delete|drop|alter|create|truncate|replace|merge)\b/i;

export const inputSchema = z.object({
	query: z.string()
		.min(1, "Query cannot be empty")
		.refine(q => readOnlyStart.test(q), { 
			message: "Only read-only queries are allowed (SELECT, WITH, EXPLAIN)" 
		})
		.refine(q => !forbiddenDml.test(q), { 
			message: "DDL/DML queries are not allowed" 
		})
		.refine(q => !q.includes(";"), { 
			message: "Multiple statements (;) are not allowed" 
		}),
	connectionStringNumber: z
		.number()
		.int()
		.min(1, "Connection string number must be at least 1")
});
