import { ContractProcedure, SchemaOutput } from '@orpc/contract'
import { MapInputMiddleware, Middleware } from './middleware'
import { Procedure, ProcedureHandler } from './procedure'
import { Context, MergeContext } from './types'

export class ProcedureImplementer<
  TContext extends Context,
  TContract extends ContractProcedure<any, any, any, any>,
  TExtraContext extends Context
> {
  constructor(
    public __pb: {
      contract: TContract
      middlewares?: Middleware<any, any, any>[]
    }
  ) {}

  use<UExtraContext extends Partial<MergeContext<Context, MergeContext<TContext, TExtraContext>>>>(
    middleware: Middleware<
      MergeContext<TContext, TExtraContext>,
      UExtraContext,
      TContract extends ContractProcedure<infer UInputSchema, any, any, any>
        ? SchemaOutput<UInputSchema>
        : never
    >
  ): ProcedureImplementer<TContext, TContract, MergeContext<TExtraContext, UExtraContext>>

  use<
    UExtraContext extends Partial<MergeContext<Context, MergeContext<TContext, TExtraContext>>>,
    UMappedInput = TContract extends ContractProcedure<infer UInputSchema, any, any, any>
      ? SchemaOutput<UInputSchema>
      : never
  >(
    middleware: Middleware<MergeContext<TContext, TExtraContext>, UExtraContext, UMappedInput>,
    mapInput: MapInputMiddleware<
      TContract extends ContractProcedure<infer UInputSchema, any, any, any>
        ? SchemaOutput<UInputSchema>
        : never,
      UMappedInput
    >
  ): ProcedureImplementer<TContext, TContract, MergeContext<TExtraContext, UExtraContext>>

  use(
    middleware_: Middleware<any, any, any>,
    mapInput?: MapInputMiddleware<any, any>
  ): ProcedureImplementer<any, any, any> {
    const middleware: Middleware<any, any, any> =
      typeof mapInput === 'function'
        ? (input, ...rest) => middleware_(mapInput(input), ...rest)
        : middleware_

    return new ProcedureImplementer({
      ...this.__pb,
      middlewares: [...(this.__pb.middlewares ?? []), middleware],
    })
  }

  handler<
    UHandlerOutput extends TContract extends ContractProcedure<any, infer UOutputSchema, any, any>
      ? SchemaOutput<UOutputSchema>
      : never
  >(
    handler: ProcedureHandler<TContext, TContract, TExtraContext, UHandlerOutput>
  ): Procedure<TContext, TContract, TExtraContext, UHandlerOutput> {
    return new Procedure({
      middlewares: this.__pb.middlewares,
      contract: this.__pb.contract,
      handler,
    })
  }
}
