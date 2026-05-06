import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  dateOfBirth: z.string(),
  role: z.enum(['PATIENT', 'FAMILY_MEMBER']).default('PATIENT'),
})

export async function authRouter(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const body = LoginSchema.parse(req.body)

    const user = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    const token = app.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.send({ token, user: { id: user.id, email: user.email, role: user.role } })
  })

  app.post('/register', async (req, reply) => {
    const body = RegisterSchema.parse(req.body)

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return reply.status(409).send({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(body.password, 12)

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role,
        ...(body.role === 'PATIENT' && {
          patient: {
            create: {
              fullName: body.fullName,
              dateOfBirth: new Date(body.dateOfBirth),
            },
          },
        }),
      },
    })

    const token = app.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.status(201).send({ token, user: { id: user.id, email: user.email, role: user.role } })
  })

  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { patient: true, familyMember: true, insuranceAdmin: { include: { insurance: true } } },
    })
    return reply.send(user)
  })
}
