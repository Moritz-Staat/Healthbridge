import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { UserRole } from '@healthbridge/shared-types'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>
    authorize: (roles: UserRole[]) => (req: any, reply: any) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string; role: UserRole }
    user: { userId: string; email: string; role: UserRole }
  }
}

export default fp(async (app) => {
  app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? 'fallback-secret-change-me',
  })

  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  app.decorate('authorize', (roles: UserRole[]) => async (req: any, reply: any) => {
    try {
      await req.jwtVerify()
      if (!roles.includes(req.user.role)) {
        reply.status(403).send({ error: 'Forbidden' })
      }
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
})
