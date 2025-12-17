import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { successResponse } from '../utils/response';
import { ValidationError, UnauthorizedError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, gymId, roleId } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !gymId || !roleId) {
      throw new ValidationError('All required fields must be provided');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check if gym exists and is active
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym || !gym.isActive) {
      throw new ValidationError('Invalid or inactive gym');
    }

    // Check if role exists and belongs to the gym
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.gymId !== gymId) {
      throw new ValidationError('Invalid role for this gym');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        gymId,
        roleId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gymId: true,
        roleId: true,
        createdAt: true,
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      gymId: user.gymId,
      roleId: user.roleId,
      role: user.role.name,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      gymId: user.gymId,
      roleId: user.roleId,
      role: user.role.name,
    });

    successResponse(
      res,
      {
        user,
        token,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gymId: true,
        roleId: true,
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if gym is active
    if (!user.gym.isActive) {
      throw new UnauthorizedError('Your gym account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      gymId: user.gymId,
      roleId: user.roleId,
      role: user.role.name,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      gymId: user.gymId,
      roleId: user.roleId,
      role: user.role.name,
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    successResponse(res, {
      user: userWithoutPassword,
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        gymId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            contactPhone: true,
            logoUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    successResponse(res, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token will be handled by auth middleware
    // For now, we'll decode it
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        gymId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new access token
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      gymId: user.gymId,
      roleId: user.roleId,
      role: user.role.name,
    });

    successResponse(res, { token: newToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};
