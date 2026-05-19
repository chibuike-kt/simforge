import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { z } from 'zod';

import { getDb } from '../../db/database';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

@Injectable()
export class UsersService {
  private readonly sql = getDb();

  async create(dto: RegisterDto): Promise<SafeUser> {
    const data = RegisterSchema.parse(dto);

    const existing = await this.sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${data.email}
    `;
    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const [user] = await this.sql<SafeUser[]>`
      INSERT INTO users (email, name, password_hash)
      VALUES (${data.email}, ${data.name}, ${passwordHash})
      RETURNING id, email, name, created_at
    `;

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.sql<User[]>`
      SELECT id, email, name, password_hash, created_at
      FROM users WHERE email = ${email}
    `;
    return user ?? null;
  }

  async findById(id: string): Promise<SafeUser | null> {
    const [user] = await this.sql<SafeUser[]>`
      SELECT id, email, name, created_at
      FROM users WHERE id = ${id}
    `;
    return user ?? null;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
