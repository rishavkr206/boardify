const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/post.controller');

// Posts CRUD
router.get('/boards/:boardId/posts', optionalAuth, ctrl.getPosts);

router.post('/boards/:boardId/posts',
  optionalAuth,
  [
    body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title required (max 200 chars)'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
    body('category').optional().isLength({ max: 50 }),
    body('authorName').optional().trim().isLength({ max: 80 }),
    body('authorEmail').optional().isEmail().normalizeEmail(),
  ],
  validate,
  ctrl.createPost
);

router.get('/posts/:postId', optionalAuth, ctrl.getPost);

router.patch('/posts/:postId/status',
  requireAuth,
  [
    body('status').notEmpty().withMessage('Status is required'),
  ],
  validate,
  ctrl.updatePostStatus
);

router.delete('/posts/:postId', requireAuth, ctrl.deletePost);

// Upvotes
router.post('/posts/:postId/upvote', optionalAuth, ctrl.upvotePost);

// Comments
router.get('/posts/:postId/comments', ctrl.getComments);

router.post('/posts/:postId/comments',
  optionalAuth,
  [
    body('content').trim().notEmpty().isLength({ max: 1000 }).withMessage('Comment required (max 1000 chars)'),
    body('authorName').optional().trim().isLength({ max: 80 }),
    body('authorEmail').optional().isEmail().normalizeEmail(),
  ],
  validate,
  ctrl.createComment
);

router.delete('/comments/:commentId', requireAuth, ctrl.deleteComment);

module.exports = router;
