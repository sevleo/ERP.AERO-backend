import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import connection from "../db";
import { User } from "../models/user";
import { v4 as uuidv4 } from "uuid";
import {
  generateRefreshToken,
  generateSigninToken,
} from "../helpers/generateTokens";
import jwt from "jsonwebtoken";

const signup = asyncHandler(async (req: Request, res: any) => {
  const { username, password }: User = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Check if user already exists
    const [rows] = await connection
      .promise()
      .query("SELECT * FROM users WHERE username = ?", [username]);

    if ((rows as any[]).length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Hash the password with bcrypt, using 10 rounds of salt
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(password);
    // console.log(hashedPassword);

    // Generate user id
    const newId = uuidv4();
    // Insert new user into the database
    const insertQuery =
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?)";
    await connection
      .promise()
      .query(insertQuery, [newId, username, hashedPassword]);

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("Error signing up:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

const signin = asyncHandler(async (req: Request, res: any) => {
  console.log(req);
  const { username, password }: User = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // Check if user exists
    const [rows] = await connection
      .promise()
      .query<User[]>("SELECT * FROM users WHERE username = ?", [username]);

    const user = rows[0];

    if (!user || !user.id) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    // console.log(password);
    // console.log(user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate tokens
    const accessToken = generateSigninToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Error signing in:", err);
    res.status(500).send("Internal server error.");
  }
});

export const refreshToken = asyncHandler(async (req: any, res: any) => {
  const { token }: { token: string } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET!,
    (err: any, user: any) => {
      if (err) {
        return res.sendStatus(403);
      }

      const accessToken = generateSigninToken(user.username);
      res.json({ accessToken });
    }
  );
});

const auth = {
  signup,
  signin,
  refreshToken,
};

export default auth;
