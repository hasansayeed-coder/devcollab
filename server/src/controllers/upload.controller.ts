import { Request, Response, NextFunction } from 'express'
import { cloudinary } from '../config/cloudinary'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    if (!req.file) throw new AppError('No file uploaded', 400)

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'devcollab/avatars',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(new AppError('Upload failed', 500))
          else resolve(result)
        }
      )
      stream.end(req.file!.buffer)
    })

    const user = await prisma.user.update({
      where: { id: authReq.user!.id },
      data: { avatarUrl: result.secure_url },
      select: { id: true, email: true, username: true, avatarUrl: true },
    })

    res.json({ success: true, user })
  } catch (err) { next(err) }
}