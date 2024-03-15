import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const getUser = (req: Request, res: Response) => {
  res.json({ username: req.headers?.username as any });
};
