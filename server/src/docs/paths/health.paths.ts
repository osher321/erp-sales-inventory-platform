export const healthPaths = {
  "/api/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      description: "Basic liveness check. Does not use the {success,data} envelope used by the rest of the API.",
      security: [],
      responses: {
        "200": {
          description: "Service is up.",
          content: {
            "application/json": {
              schema: { type: "object", properties: { status: { type: "string", example: "ok" } } },
            },
          },
        },
      },
    },
  },
};
