import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository, UserRepository } from "../repositories/user.repository.js";
import { env } from "../config/env.js";

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  private generateToken(id: string, email: string): string {
    return jwt.sign({ id, email }, env.JWT_SECRET, { expiresIn: "7d" });
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists with this email.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.userRepo.create({
      name,
      email,
      passwordHash,
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
