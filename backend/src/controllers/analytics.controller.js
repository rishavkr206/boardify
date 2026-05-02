const { PrismaClient } = require('@prisma/client');
const { success, notFound, forbidden } = require('../utils/response.utils');

const prisma = new PrismaClient();

const getBoardAnalytics = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return notFound(res, 'Board not found');
    if (board.ownerId !== req.user.id) return forbidden(res, 'Access denied');

    // Run all analytics queries in parallel
    const [
      postsByStatus,
      topPosts,
      recentActivity,
      totalUpvotes,
      totalComments,
      categoryBreakdown,
      postVolume,
    ] = await Promise.all([

      // Count posts grouped by status
      prisma.post.groupBy({
        by: ['status'],
        where: { boardId },
        _count: { id: true },
      }),

      // Top 5 most upvoted posts
      prisma.post.findMany({
        where: { boardId },
        orderBy: { upvoteCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          upvoteCount: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      }),

      // Last 10 posts (recent activity feed)
      prisma.post.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          upvoteCount: true,
        },
      }),

      // Total upvotes across all posts
      prisma.upvote.count({
        where: { post: { boardId } },
      }),

      // Total comments across all posts
      prisma.comment.count({
        where: { post: { boardId } },
      }),

      // Posts grouped by category
      prisma.post.groupBy({
        by: ['category'],
        where: { boardId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Post volume over last 30 days (daily buckets)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt") AS date,
          COUNT(id)::int AS count
        FROM posts
        WHERE "boardId" = ${boardId}
          AND "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `,
    ]);

    const statusCounts = {};
    postsByStatus.forEach(({ status, _count }) => {
      statusCounts[status] = _count.id;
    });

    const categories = categoryBreakdown.map(({ category, _count }) => ({
      name: category || 'Uncategorised',
      count: _count.id,
    }));

    return success(res, {
      overview: {
        totalPosts: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        totalUpvotes,
        totalComments,
      },
      postsByStatus: statusCounts,
      topPosts,
      recentActivity,
      categories,
      postVolume: postVolume.map((row) => ({
        date: row.date,
        count: row.count,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBoardAnalytics };
