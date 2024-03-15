import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response } from "express";

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send("User registered successfully");
};

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username });
  console.log("user", user);
  
  if (!user) {
    return res.status(400).send("Invalid username or password");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send("Invalid username or password");
  }

  const accessToken = jwt.sign({ username: user.username }, "SECRET_KEY", { expiresIn: "30m" });
  const refreshToken = jwt.sign({ username: user.username }, "REFRESH_SECRET_KEY", { expiresIn: "43200m" });

  res.json({ accessToken, refreshToken });
};

export const refreshToken = (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, "REFRESH_SECRET_KEY", (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign({ username: user.username }, "SECRET_KEY", { expiresIn: "30m" });
    res.json({ accessToken });
  });
};
