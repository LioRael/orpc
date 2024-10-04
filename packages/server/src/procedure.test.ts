import { ContractProcedure, initORPCContract } from '@orpc/contract'
import { z } from 'zod'
import { initORPC } from '.'
import { Procedure, isProcedure } from './procedure'

it('isProcedure', () => {
  expect(new Procedure({} as any)).toSatisfy(isProcedure)
  expect({
    __p: {
      contract: new ContractProcedure({}),
      handler: () => {},
    },
  }).toSatisfy(isProcedure)

  expect({
    __p: {
      contract: new ContractProcedure({}),
    },
  }).not.toSatisfy(isProcedure)

  expect({
    __p: {
      handler: () => {},
    },
  }).not.toSatisfy(isProcedure)

  expect({}).not.toSatisfy(isProcedure)
  expect(12233).not.toSatisfy(isProcedure)
  expect('12233').not.toSatisfy(isProcedure)
  expect(undefined).not.toSatisfy(isProcedure)
  expect(null).not.toSatisfy(isProcedure)
})

test('prefix method', () => {
  const p = initORPC.context<{ auth: boolean }>().handler(() => {
    return 'dinwwwh'
  })

  const p2 = p.prefix('/test')

  expect(p2.__p.contract.__cp.path).toBe(undefined)

  const p3 = initORPC
    .context<{ auth: boolean }>()
    .route({ path: '/test1' })
    .handler(() => {
      return 'dinwwwh'
    })

  const p4 = p3.prefix('/test')
  expect(p4.__p.contract.__cp.path).toBe('/test/test1')
})
