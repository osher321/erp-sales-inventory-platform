import { successData } from "../shared";

export const authPaths = {
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Log in with email and password",
      description: "Returns a JWT access token (default 8h expiry) and the public user profile.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email", example: "demo@example.com" },
                password: { type: "string", example: "Demo1234!" },
              },
              required: ["email", "password"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Login succeeded.",
          content: { "application/json": { schema: successData("#/components/schemas/AuthData") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": {
          description: "Invalid email or password (the same generic message is used for both cases).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Invalid email or password" },
            },
          },
        },
      },
    },
  },

  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates a new user with role USER (the seeded demo ADMIN account is not created through this endpoint) and returns a JWT, same shape as login.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email", example: "new.user@example.com" },
                password: { type: "string", minLength: 8, example: "Password123" },
                name: { type: "string", example: "New User" },
              },
              required: ["email", "password", "name"],
            },
          },
        },
      },
      responses: {
        "201": {
          description: "User registered.",
          content: { "application/json": { schema: successData("#/components/schemas/AuthData") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "409": {
          description: "Email already registered.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Email already registered" },
            },
          },
        },
      },
    },
  },
};
