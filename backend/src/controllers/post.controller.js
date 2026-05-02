const { PrismaClient } = require('@prisma/client');
const { success, created, notFound, forbidden, badRequest } = require('../utils/response.utils');

const prisma = new PrismaClient();

const VALID_STATUSES = ['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED'];
const VALID_SORT = ['newest', 'oldest', 'top'];

const getPosts = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const {
      status,
      category,
      sort = 'top',
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return notFound(res, 'Board not found');
    if (!board.isPublic && req.user?.id !== board.ownerId) {
      return forbidden(res, 'This board is private');
    }

    const where = { boardId };
    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy;
    switch (sort) {
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'top':
      default: orderBy = { upvoteCount: 'desc' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
          // If user is logged in, include their upvote
          upvotes: req.user
            ? { where: { userId: req.user.id }, select: { id: true } }
            : false,
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Attach hasUpvoted flag
    const postsWithVoteFlag = posts.map((p) => ({
      ...p,
      hasUpvoted: req.user ? p.upvotes?.length > 0 : false,
      upvotes: undefined,
    }));

    return success(res, {
      posts: postsWithVoteFlag,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { title, description, category, authorName, authorEmail } = req.body;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return notFound(res, 'Board not found');
    if (!board.isPublic && req.user?.id !== board.ownerId) {
      return forbidden(res, 'This board is private');
    }

    const postData = {
      title,
      description,
      category,
      boardId,
    };

    if (req.user) {
      postData.authorId = req.user.id;
    } else {
      postData.authorName = authorName;
      postData.authorEmail = authorEmail;
    }

    const post = await prisma.post.create({
      data: postData,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    });

    return created(res, post, 'Feedback submitted successfully');
  } catch (err) {
    next(err);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true } },
        board: { select: { id: true, name: true, slug: true, ownerId: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) return notFound(res, 'Post not found');

    const hasUpvoted = req.user
      ? !!(await prisma.upvote.findUnique({
          where: { postId_userId: { postId, userId: req.user.id } },
        }))
      : false;

    return success(res, { ...post, hasUpvoted });
  } catch (err) {
    next(err);
  }
};

const updatePostStatus = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status?.toUpperCase())) {
      return badRequest(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { board: { select: { ownerId: true } } },
    });

    if (!post) return notFound(res, 'Post not found');
    if (post.board.ownerId !== req.user.id) {
      return forbidden(res, 'Only the board owner can update post status');
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { status: status.toUpperCase() },
    });

    return success(res, updated, 'Status updated');
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { board: { select: { ownerId: true } } },
    });

    if (!post) return notFound(res, 'Post not found');

    const isOwner = post.authorId === req.user.id;
    const isBoardOwner = post.board.ownerId === req.user.id;

    if (!isOwner && !isBoardOwner) {
      return forbidden(res, 'Not authorized to delete this post');
    }

    await prisma.post.delete({ where: { id: postId } });

    return success(res, null, 'Post deleted');
  } catch (err) {
    next(err);
  }
};

// Toggle upvote
const upvotePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound(res, 'Post not found');

    const existingUpvote = req.user
      ? await prisma.upvote.findUnique({
          where: { postId_userId: { postId, userId: req.user.id } },
        })
      : null;

    let action;

    if (existingUpvote) {
      // Remove upvote
      await prisma.$transaction([
        prisma.upvote.delete({ where: { id: existingUpvote.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);
      action = 'removed';
    } else {
      // Add upvote
      const voterIp = req.ip;
      await prisma.$transaction([
        prisma.upvote.create({
          data: {
            postId,
            userId: req.user?.id,
            voterIp,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { upvoteCount: { increment: 1 } },
        }),
      ]);
      action = 'added';
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { upvoteCount: true },
    });

    return success(res, { action, upvoteCount: updatedPost.upvoteCount });
  } catch (err) {
    next(err);
  }
};

// Comments
const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return success(res, comments);
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, authorName, authorEmail } = req.body;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound(res, 'Post not found');

    const data = { content, postId };

    if (req.user) {
      data.authorId = req.user.id;
    } else {
      data.authorName = authorName || 'Anonymous';
      data.authorEmail = authorEmail;
    }

    const comment = await prisma.comment.create({
      data,
      include: { author: { select: { id: true, name: true } } },
    });

    return created(res, comment, 'Comment added');
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { include: { board: { select: { ownerId: true } } } } },
    });

    if (!comment) return notFound(res, 'Comment not found');

    const isAuthor = comment.authorId === req.user.id;
    const isBoardOwner = comment.post.board.ownerId === req.user.id;

    if (!isAuthor && !isBoardOwner) {
      return forbidden(res, 'Not authorized');
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return success(res, null, 'Comment deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPosts,
  createPost,
  getPost,
  updatePostStatus,
  deletePost,
  upvotePost,
  getComments,
  createComment,
  deleteComment,
};
