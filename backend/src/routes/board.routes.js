const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/board.controller');

router.post('/',
  requireAuth,
  [
    body('name').trim().notEmpty().isLength({ max: 80 }).withMessage('Board name required (max 80 chars)'),
    body('description').optional().isLength({ max: 300 }).withMessage('Description max 300 chars'),
    body('isPublic').optional().isBoolean(),
    body('accentColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
  ],
  validate,
  ctrl.createBoard
);

router.get('/mine', requireAuth, ctrl.getMyBoards);

router.get('/slug/:slug', optionalAuth, ctrl.getBoardBySlug);

router.get('/:id', requireAuth, ctrl.getBoardById);

router.put('/:id',
  requireAuth,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 80 }),
    body('description').optional().isLength({ max: 300 }),
    body('isPublic').optional().isBoolean(),
    body('accentColor').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  validate,
  ctrl.updateBoard
);

router.delete('/:id', requireAuth, ctrl.deleteBoard);

module.exports = router;
