import { oc } from '@orpc/contract'
import { oz } from '@orpc/zod'
import { z } from 'zod'

// Implement the contract

import { ORPCError, os } from '@orpc/server'

// Expose apis to the internet with fetch handler

import { createFetchHandler } from '@orpc/server/fetch'

// Modern runtime that support fetch api like deno, bun, cloudflare workers, even node can used

import { createServer } from 'node:http'
import { createServerAdapter } from '@whatwg-node/server'

// Define your contract first
// This contract can replace server router in most-case

export const contract = oc.router({
  getting: oc
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(
      z.object({
        message: z.string(),
      }),
    ),

  post: oc.prefix('/posts').router({
    find: oc
      .route({
        path: '/{id}',
        method: 'GET',
      })
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .output(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
        }),
      ),

    create: oc
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          thumb: oz.file().type('image/*'),
        }),
      )
      .output(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
        }),
      ),
  }),
})

export type Context = { user?: { id: string } }
export const base = os.context<Context>()
export const pub /** os with ... */ = base.contract(contract) // Ensure every implement must be match contract
export const authed /** require authed */ = base
  .use((input, context, meta) => /** put auth logic here */ meta.next({}))
  .contract(contract)

export const router = pub.router({
  getting: pub.getting.handler((input, context, meta) => {
    return {
      message: `Hello, ${input.name}!`,
    }
  }),

  post: {
    find: pub.post.find
      .use(async (input, context, meta) => {
        if (!context.user) {
          throw new ORPCError({
            code: 'UNAUTHORIZED',
          })
        }

        const result = await meta.next({
          context: {
            user: context.user, // from now user not undefined-able
          },
        })

        const _output = result.output // do something on success

        return result
      })
      .handler((input, context, meta) => {
        return {
          id: 'example',
          title: 'example',
          description: 'example',
        }
      }),

    create: authed.post.create.handler((input, context, meta) => {
      return {
        id: 'example',
        title: input.title,
        description: input.description,
      }
    }),
  },
})

const handler = createFetchHandler({
  router,
  serverless: false, // set true will improve cold start times
})

const server = createServer(
  createServerAdapter((request: Request) => {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api')) {
      return handler({
        request,
        prefix: '/api',
        context: {},
      })
    }

    return new Response('Not found', { status: 404 })
  }),
)

server.listen(2026, () => {
  // eslint-disable-next-line no-console
  console.log('Server is available at http://localhost:2026')
})

//
//
