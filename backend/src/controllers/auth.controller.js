const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  isRefreshTokenValid,
} = require('../utils/jwt.utils');
const { success, created, unauthorized, badRequest } = require('../utils/response.utils');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest(res, 'An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = await generateRefreshToken(user.id);

    return created(res, { user, accessToken, refreshToken }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return unauthorized(res, 'Invalid email or password');
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = await generateRefreshToken(user.id);

    return success(res, {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    }, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return unauthorized(res, 'Refresh token required');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return unauthorized(res, 'Invalid or expired refresh token');
    }

    const isValid = await isRefreshTokenValid(refreshToken);
    if (!isValid) return unauthorized(res, 'Refresh token revoked or expired');

    await revokeRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return unauthorized(res, 'User not found');

    const newAccessToken = generateAccessToken({ userId: user.id });
    const newRefreshToken = await generateRefreshToken(user.id);

    return success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await revokeAllUserRefreshTokens(req.user.id);
    return success(res, null, 'Logged out of all devices');
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { boards: true, posts: true } },
      },
    });
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, logoutAll, me };
