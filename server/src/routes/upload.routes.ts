import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { upload } from '../middlewares/upload'
import { uploadAvatar } from '../controllers/upload.controller'

const router = Router()

router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar)

export default router