const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { success, created, notFound, forbidden, badRequest } = require('../utils/response.utils');

const prisma = new PrismaClient();

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.board.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

const createBoard = async (req, res, next) => {
  try {
    const { name, description, isPublic, accentColor } = req.body;
    const slug = await generateUniqueSlug(name);

    const board = await prisma.board.create({
      data: {
        name,
        description,
        slug,
        isPublic: isPublic !== undefined ? isPublic : true,
        accentColor: accentColor || '#6366f1',
        ownerId: req.user.id,
      },
    });

    return created(res, board, 'Board created successfully');
  } catch (err) {
    next(err);
  }
};

const getMyBoards = async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, boards);
  } catch (err) {
    next(err);
  }
};

// Public: get board by slug + its posts
const getBoardBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const board = await prisma.board.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { posts: true } },
      },
    });

    if (!board) return notFound(res, 'Board not found');
    if (!board.isPublic && req.user?.id !== board.ownerId) {
      return forbidden(res, 'This board is private');
    }

    return success(res, board);
  } catch (err) {
    next(err);
  }
};

const getBoardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    });

    if (!board) return notFound(res, 'Board not found');
    if (board.ownerId !== req.user.id) return forbidden(res, 'Access denied');

    return success(res, board);
  } catch (err) {
    next(err);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, accentColor } = req.body;

    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Board not found');
    if (existing.ownerId !== req.user.id) return forbidden(res, 'Access denied');

    const updateData = {};
    if (name) {
      updateData.name = name;
      if (name !== existing.name) {
        updateData.slug = await generateUniqueSlug(name, id);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (accentColor) updateData.accentColor = accentColor;

    const board = await prisma.board.update({ where: { id }, data: updateData });

    return success(res, board, 'Board updated');
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Board not found');
    if (existing.ownerId !== req.user.id) return forbidden(res, 'Access denied');

    await prisma.board.delete({ where: { id } });

    return success(res, null, 'Board deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBoard,
  getMyBoards,
  getBoardBySlug,
  getBoardById,
  updateBoard,
  deleteBoard,
};
