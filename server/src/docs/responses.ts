function errorResponse(description: string, example: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { success: false, message: example },
      },
    },
  };
}

export const responses = {
  Unauthorized: errorResponse("Missing, malformed, or expired JWT.", "Authentication required"),
  ValidationError: errorResponse("Request failed validation.", "customerNumber: Customer number is required"),
} as const;
