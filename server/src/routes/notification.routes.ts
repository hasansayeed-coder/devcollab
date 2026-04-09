import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { getNotifications, markAllRead, markRead } from '../controllers/notification.controller'

const router = Router()

router.use(authenticate)
router.get('/', getNotifications)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)

export default router