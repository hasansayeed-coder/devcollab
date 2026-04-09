import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { z } from 'zod'

const linkRepoSchema = z.object({
  githubRepo: z.string()
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Format must be owner/repo')
    .nullable(),
})

export const linkRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])
    const parsed = linkRepoSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Invalid repo format. Use owner/repo', 400)

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member || member.role !== 'OWNER')
      throw new AppError('Only owners can link a GitHub repo', 403)

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { githubRepo: parsed.data.githubRepo },
    })

    res.json({ success: true, project })
  } catch (err) { next(err) }
}

export const getCommits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const projectId = String(req.params['id'])

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authReq.user!.id, projectId } },
    })
    if (!member) throw new AppError('Access denied', 403)

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new AppError('Project not found', 404)
    if (!project.githubRepo) throw new AppError('No GitHub repo linked', 400)

    const response = await fetch(
      `https://api.github.com/repos/${project.githubRepo}/commits?per_page=5`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DevCollab-App',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) throw new AppError('Repository not found or is private', 404)
      if (response.status === 403) throw new AppError('GitHub API rate limit exceeded', 429)
      throw new AppError('Failed to fetch commits', 500)
    }

    const commits : any = await response.json()

    const formatted = commits.map((commit: any) => ({
      sha: commit.sha.slice(0, 7),
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
      authorAvatar: commit.author?.avatar_url || null,
      date: commit.commit.author.date,
      url: commit.html_url,
    }))

    res.json({ success: true, commits: formatted, repo: project.githubRepo })
  } catch (err) { next(err) }
}   