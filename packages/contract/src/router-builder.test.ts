import { z } from 'zod'
import { ContractProcedure, DecoratedContractProcedure, oc } from '.'
import { ContractRouterBuilder } from './router-builder'

it('prefix method', () => {
  expect(oc.prefix('/1').prefix('/2').zz$crb.prefix).toEqual('/1/2')
})

it('tags method', () => {
  expect(oc.tags('1').tags('2').zz$crb.tags).toEqual(['1', '2'])
})

it('define a router', () => {
  const ping = oc.route({ method: 'GET', path: '/ping' })
  const pong = oc.input(z.object({ id: z.string() }))

  const router = oc.router({
    ping,
    pong,

    internal: oc
      .prefix('/internal')
      .tags('internal')
      .router({
        ping,
        pong,

        nested: {
          ping,
        },
      }),
  })

  expect(router.ping.zz$cp.path).toEqual('/ping')
  expect(router.pong.zz$cp.path).toEqual(undefined)

  expect(router.internal.ping.zz$cp.path).toEqual('/internal/ping')
  expect(router.internal.pong.zz$cp.path).toEqual(undefined)
  expect(router.internal.nested.ping.zz$cp.path).toEqual('/internal/ping')

  expect(router.internal.ping.zz$cp.tags).toEqual(['internal'])
  expect(router.internal.pong.zz$cp.tags).toEqual(['internal'])
  expect(router.internal.nested.ping.zz$cp.tags).toEqual(['internal'])
})

it('router: decorate items', () => {
  const builder = new ContractRouterBuilder({})

  const ping = new ContractProcedure({
    InputSchema: undefined,
    OutputSchema: undefined,
  })

  const decorated = new DecoratedContractProcedure({
    InputSchema: undefined,
    OutputSchema: undefined,
    method: 'GET',
    path: '/ping',
  })

  const router = builder.router({ ping, nested: { ping } })

  expectTypeOf(router).toEqualTypeOf<{
    ping: typeof decorated
    nested: { ping: typeof decorated }
  }>()

  expect(router.ping).instanceOf(DecoratedContractProcedure)
  expect(router.nested.ping).instanceOf(DecoratedContractProcedure)
})
