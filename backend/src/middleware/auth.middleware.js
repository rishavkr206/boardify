const { PrismaClient } = require('@prisma/client');
const { verifyAccessToken } = require('../utils/jwt.utils');
const { unauthorized } = require('../utils/response.utils');

const prisma = new PrismaClient();

// Require a valid JWT — rejects if missing or expired
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) return unauthorized(res, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    return unauthorized(res, 'Invalid token');
  }
};

// Attach user if token present, but don't reject if missing
// Used for public routes that behave differently for logged-in users
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

// Verify the authenticated user owns the board
const requireBoardOwner = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, ownerId: true, slug: true, name: true },
    });

    if (!board) {
      const { notFound } = require('../utils/response.utils');
      return notFound(res, 'Board not found');
    }

    if (board.ownerId !== req.user.id) {
      const { forbidden } = require('../utils/response.utils');
      return forbidden(res, 'You do not own this board');
    }

    req.board = board;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, optionalAuth, requireBoardOwner };
