import { ORPCError, os } from '@orpc/server'
import { oz } from '@orpc/zod'
import { z } from 'zod'

// Expose apis to the internet with fetch handler

import { createFetchHandler } from '@orpc/server/fetch'

// Modern runtime that support fetch api like deno, bun, cloudflare workers, even node can used

import { createServer } from 'node:http'
import { createServerAdapter } from '@whatwg-node/server'

export type Context = { user?: { id: string } }

// global pub, authed completely optional
export const pub /** public access */ = os.context<Context>()
export const authed /** require authed */ = pub.use((input, context, meta) => /** put auth logic here */ meta.next({}))

export const router = pub.router({
  getting: os
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .handler(async (input, context, meta) => {
      return {
        message: `Hello, ${input.name}!`,
      }
    }),

  post: pub.prefix('/posts').router({
    find: pub
      .route({
        path: '/{id}', // custom your OpenAPI
        method: 'GET',
      })
      .input(
        z.object({
          id: z.string({}),
        }),
      )
      .output(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
        }),
      )
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

    create: authed
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          thumb: oz.file().type('image/*'),
        }),
      )
      .handler(async (input, context, meta) => {
        const _thumb = input.thumb // file upload out of the box

        return {
          id: 'example',
          title: input.title,
          description: input.description,
        }
      }),
  }),
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
