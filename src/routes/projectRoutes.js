const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const projectValidators = require('../validators/projectValidators');

// All routes require authentication
router.use(authMiddleware);

router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProject);
router.post('/', validate(projectValidators.create), ProjectController.createProject);
router.put('/:id', validate(projectValidators.update), ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

// Member management
router.post('/:id/invite', validate(projectValidators.invite), ProjectController.inviteUser);
router.post('/accept-invite/:token', ProjectController.acceptInvite);
router.delete('/:id/members/:memberId', ProjectController.removeMember);
router.put('/:id/members/:memberId/role', validate(projectValidators.updateMember), ProjectController.updateMemberRole);

module.exports = router;
