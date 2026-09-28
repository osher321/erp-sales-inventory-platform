import { bearerSecurity, limitParam, pageParam, successData } from "../shared";

export const logsPaths = {
  "/api/logs": {
    get: {
      tags: ["Logs"],
      summary: "List recorded API requests",
      description:
        "Every request under /api/* is recorded automatically (method, path, status, response time, caller, and " +
        "error message on failure). Request bodies, headers, and Authorization are never captured.",
      security: bearerSecurity,
      parameters: [
        pageParam,
        limitParam,
        { name: "search", in: "query", schema: { type: "string" }, description: "Matches against endpoint path or caller email." },
        { name: "method", in: "query", schema: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] } },
        {
          name: "success",
          in: "query",
          schema: { type: "boolean" },
          description: "true = statusCode < 400, false = statusCode >= 400.",
        },
        { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sorted by timestamp." },
      ],
      responses: {
        "200": {
          description: "Logs retrieved.",
          content: { "application/json": { schema: successData("#/components/schemas/LogListData") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
