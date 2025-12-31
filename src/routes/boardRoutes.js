const express = require('express');
const router = express.Router();
const BoardController = require('../controllers/boardController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { boardValidators } = require('../validators/taskValidators');

// All routes require authentication
router.use(authMiddleware);

router.get('/project/:projectId', BoardController.getBoards);
router.get('/:id', BoardController.getBoard);
router.post('/project/:projectId', validate(boardValidators.create), BoardController.createBoard);
router.put('/:id', validate(boardValidators.update), BoardController.updateBoard);
router.delete('/:id', BoardController.deleteBoard);

module.exports = router;
