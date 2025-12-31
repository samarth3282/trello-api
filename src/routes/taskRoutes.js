const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { taskValidators } = require('../validators/taskValidators');

// All routes require authentication
router.use(authMiddleware);

router.get('/', TaskController.getTasks);
router.get('/:id', TaskController.getTask);
router.post('/board/:boardId', validate(taskValidators.create), TaskController.createTask);
router.put('/:id', validate(taskValidators.update), TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);
router.post('/:id/attachments', TaskController.addAttachment);

module.exports = router;
