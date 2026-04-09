import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { createProject, getProjects, getProject, updateProject, deleteProject } from '../controllers/project.controller'
import { createTask, updateTask, deleteTask } from '../controllers/task.controller'
import { getMembers, inviteMember, removeMember, updateMemberRole } from '../controllers/member.controller'
import { getComments, createComment, deleteComment } from '../controllers/comment.controller'
import { getProjectAnalytics } from '../controllers/analytics.controller'
import { getActivities } from '../controllers/activity.controller'
import { exportProject } from '../controllers/export.controller'
import { linkRepo, getCommits } from '../controllers/github.controller'
import { getMemberWorkload } from '../controllers/analytics.controller'

const router = Router()

router.use(authenticate)

router.get('/:id/workload', getMemberWorkload)

router.get('/:id/analytics', getProjectAnalytics)

router.get('/:id/activities', getActivities)

router.get('/:id/export', exportProject)

router.patch('/:id/github', linkRepo)
router.get('/:id/github/commits', getCommits)

router.post('/', createProject)
router.get('/', getProjects)
router.get('/:id', getProject)
router.patch('/:id', updateProject)
router.delete('/:id', deleteProject)

router.post('/:id/tasks', createTask)
router.patch('/:id/tasks/:taskId', updateTask)
router.delete('/:id/tasks/:taskId', deleteTask)

router.get('/:id/tasks/:taskId/comments', getComments)
router.post('/:id/tasks/:taskId/comments', createComment)
router.delete('/:id/tasks/:taskId/comments/:commentId', deleteComment)

router.get('/:id/members', getMembers)
router.post('/:id/members', inviteMember)
router.delete('/:id/members/:userId', removeMember)
router.patch('/:id/members/:userId', updateMemberRole)

export default router