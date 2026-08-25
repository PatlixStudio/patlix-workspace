import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

/**
 * User entity stored in memory (no DB persistence).
 * Replace with TypeORM entity when DB is configured.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  surname: string;
  isSubscribed: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

const users = new Map<string, User>();
const guestMessageCounts = new Map<string, number>();

@Injectable()
export class AuthService {
  private readonly jwtSecret = 'ai-love-reverse-proxy-shared-secret';

  register(data: {
    email: string;
    password: string;
    name: string;
    surname: string;
  }): AuthResponse {
    if (users.has(data.email)) {
      throw new Error('Email already registered');
    }

    const user: User = {
      id: `u_${Date.now()}`,
      email: data.email,
      passwordHash: bcrypt.hashSync(data.password, 10),
      name: data.name,
      surname: data.surname,
      isSubscribed: false,
      createdAt: new Date(),
    };

    users.set(data.email, user);

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      user: this.toPublic(user),
      token,
    };
  }

  login(email: string, password: string): AuthResponse {
    const user = users.get(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      user: this.toPublic(user),
      token,
    };
  }

  validateToken(token: string): User | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as { sub: string; email: string };
      return users.get(payload.email) ?? null;
    } catch {
      return null;
    }
  }

  getUser(userId: string): User | null {
    for (const user of users.values()) {
      if (user.id === userId) return user;
    }
    return null;
  }

  subscribe(userId: string): User {
    const user = this.getUser(userId);
    if (!user) throw new Error('User not found');
    user.isSubscribed = true;
    return user;
  }

  canSendMessage(userId: string | null, companionId: string): { allowed: boolean; messagesLeft: number } {
    if (userId) return { allowed: true, messagesLeft: -1 }; // -1 means unlimited
    const key = `guest:${companionId}`;
    const used = guestMessageCounts.get(key) ?? 0;
    return { allowed: used < 3, messagesLeft: Math.max(0, 3 - used) };
  }

  incrementMessage(userId: string | null, companionId: string): void {
    if (userId) return; // logged in users have no limit
    const key = `guest:${companionId}`;
    const used = guestMessageCounts.get(key) ?? 0;
    guestMessageCounts.set(key, used + 1);
  }

  private toPublic(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}