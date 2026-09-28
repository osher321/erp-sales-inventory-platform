import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/apiResponse";

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  sendSuccess(res, result);
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201);
}
