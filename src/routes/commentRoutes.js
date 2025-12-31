const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { commentValidators } = require('../validators/taskValidators');

// All routes require authentication
router.use(authMiddleware);

router.get('/task/:taskId', CommentController.getComments);
router.post('/task/:taskId', validate(commentValidators.create), CommentController.createComment);
router.put('/:id', validate(commentValidators.update), CommentController.updateComment);
router.delete('/:id', CommentController.deleteComment);

module.exports = router;
