import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './drizzle/schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { eq, or } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // Existing verifyUser function
  async verifyUser(data: any) {
    const { name, username, password, email } = data;

    // Check if user already exists
    const existingUser = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, email));

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    // Create verification token
    const token = this.jwtService.sign({ name, username, password, email });

    // Send verification email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your Email',
      text: `Please verify your email by clicking the link below:\n\nhttp://localhost:5173/verify?type=1&token=${token}`,
    });

    return { message: 'Verification email sent successfully' };
  }

  // Existing registerUser function
  async registerUser(authHeader: string) {
    const token = authHeader.split(' ')[1];
    const user = this.jwtService.verify(token);
    const cryptPassword = await bcrypt.hash(user.password, 10);

    // Insert user into the database
    const n = await this.db
      .insert(schema.userTable)
      .values({
        name: user.name,
        email: user.email,
        password: cryptPassword,
        username: user.username,
      })
      .returning({
        id: schema.userTable.id,
        username: schema.userTable.username,
        email: schema.userTable.email,
      })
      .execute();

    // Generate a response token for the newly registered user
    const responseToken = this.jwtService.sign({
      id: n[0].id,
      email: user.email,
      username: user.username,
    });

    return { message: 'User registered successfully', token: responseToken };
  }

  // Existing updateUser function
  async updateUser(req: any, data: any) {
    const updates: Partial<{
      name: string;
      username: string;
      password: string;
    }> = {};

    // Update name, username, and password if provided
    if (data.name) updates.name = data.name;
    if (data.username) updates.username = data.username;
    if (data.password) {
      updates.password = await bcrypt.hash(data.password, 10);
    }

    // Update the user in the database
    await this.db
      .update(schema.userTable)
      .set(updates)
      .where(eq(schema.userTable.id, req.user.id))
      .execute();

    return { message: 'User updated successfully' };
  }

  // New login function
  async loginUser(email: string, password: string) {
    const user = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, email))
      .limit(1);

    if (!user.length) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate and return JWT token for the logged-in user
    const token = this.jwtService.sign({
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
    });

    return { message: 'Login successful', token };
  }

  // New resetPassword function
  async resetPassword(authHeader: string, newPassword: string) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('User needs to log in to access this page.');
      }

      const resetToken = authHeader.split(' ')[1];
      const decodedToken = this.jwtService.verify(resetToken);
      const user = await this.db
        .select()
        .from(schema.userTable)
        .where(eq(schema.userTable.email, decodedToken.email));

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await this.db
        .update(schema.userTable)
        .set({ password: hashedPassword })
        .where(eq(schema.userTable.id, user[0].id))
        .execute();

      return { message: 'Password reset successful' };
    } catch (err) {
      throw new Error(err.message || 'Server Error');
    }
  }

  // New forgotPassword function
  async forgotPassword(email: string) {
    // Check if the email exists
    const user = await this.db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.email, email))
      .limit(1);

    if (!user.length) {
      throw new Error('No user found with this email');
    }

    // Generate password reset token
    const token = this.jwtService.sign({ email });

    // Send reset email with token
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset',
      text: `Please reset your password by clicking the link below:\n\nhttp://example.com/reset-password?token=${token}`,
    });

    return { message: 'Password reset email sent successfully' };
  }

  // New getUserDetails function
  async getUserDetails(token: string) {
    try {
      // Decode and verify the token
      const decodedToken = this.jwtService.verify(token);
      if (!decodedToken.id) {
        throw new HttpException(
          'Authorization token is missing or malformed',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Extract userId from decoded token (assuming userId is in the token)
      const userId = decodedToken.id;

      // Fetch user details from the database
      const user = await this.db
        .select()
        .from(schema.userTable)
        .where(eq(schema.userTable.id, userId))
        .limit(1);

      if (!user.length) {
        throw new HttpException(
          'Authorization token is missing or malformed',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return user[0]; // Return user data
    } catch (err) {
      throw new Error('Error retrieving user details: ' + err.message);
    }
  }
}
