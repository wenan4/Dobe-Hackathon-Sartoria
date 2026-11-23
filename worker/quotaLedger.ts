import { DurableObject } from 'cloudflare:workers';
import {
  QuotaLedgerCore,
  type QuotaSnapshot,
  type ReserveRequest,
  type ReserveResult,
  type SettleRequest,
  type SqlExecutorLike,
} from './quotaCore.ts';

export class QuotaBudgetLedger extends DurableObject {
  private readonly core: QuotaLedgerCore;

  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    const sqlAdapter: SqlExecutorLike = {
      exec: <T = Record<string, unknown>>(query: string, ...bindings: unknown[]) => {
        const cursor = this.ctx.storage.sql.exec(query, ...bindings);
        return {
          toArray: () => cursor.toArray() as unknown as T[],
        };
      },
    };
    this.core = new QuotaLedgerCore(sqlAdapter);
  }

  async getStatus(visitorKey: string, ipHash: string | null): Promise<QuotaSnapshot> {
    return this.ctx.storage.transactionSync(() =>
      this.core.getStatus({ visitorKey, ipHash, nowMs: Date.now() })
    );
  }

  async reserve(req: ReserveRequest): Promise<ReserveResult> {
    return this.ctx.storage.transactionSync(() =>
      this.core.reserve({ ...req, nowMs: Date.now() })
    );
  }

  async settle(
    req: SettleRequest,
    visitorKey: string,
    ipHash: string | null
  ): Promise<QuotaSnapshot> {
    return this.ctx.storage.transactionSync(() =>
      this.core.settle({ ...req, nowMs: Date.now() }, visitorKey, ipHash)
    );
  }
}
