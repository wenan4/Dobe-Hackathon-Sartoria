import {
  DEFAULT_MODEL,
  getModelPricing,
  getShanghaiDayWindow,
  microsToUsd,
  QUOTA_LIMITS,
} from './pricing.ts';

export interface SqlCursorLike<T = Record<string, unknown>> {
  toArray(): T[];
}

export interface SqlExecutorLike {
  exec<T = Record<string, unknown>>(query: string, ...bindings: unknown[]): SqlCursorLike<T>;
}

export type QuotaRejectCode =
  | 'VISITOR_DAILY_LIMIT_EXCEEDED'
  | 'SITE_DAILY_LIMIT_EXCEEDED'
  | 'BUDGET_EXHAUSTED';

export type CallOutcomeStatus =
  | 'reserved'
  | 'succeeded'
  | 'upstream_error'
  | 'timeout'
  | 'usage_missing'
  | 'schema_invalid'
  | 'stale_expired';

export interface QuotaSnapshot {
  dateShanghai: string;
  resetAt: string;
  model: string;
  pricingVersion: string;
  visitor: {
    used: number;
    limit: number;
    remaining: number;
  };
  site: {
    used: number;
    limit: number;
    remaining: number;
  };
  budget: {
    spentMicros: number;
    reservedMicros: number;
    limitMicros: number;
    spentUsd: number;
    reservedUsd: number;
    limitUsd: number;
    remainingUsd: number;
    exhausted: boolean;
  };
  totalLoggedCalls: number;
}

export interface ReserveRequest {
  visitorKey: string;
  visitorTag: string;
  ipHash: string | null;
  model: string;
  reservedMicros: number;
  nowMs?: number;
}

export type ReserveResult =
  | {
      allowed: true;
      reservationId: string;
      reservedMicros: number;
      snapshot: QuotaSnapshot;
    }
  | {
      allowed: false;
      rejectCode: QuotaRejectCode;
      message: string;
      snapshot: QuotaSnapshot;
    };

export interface SettleRequest {
  reservationId: string;
  status: Exclude<CallOutcomeStatus, 'reserved'>;
  inputTokens?: number | null;
  cachedTokens?: number | null;
  outputTokens?: number | null;
  /** Exact settled cost in micro-dollars; if omitted, uses conservative fallback based on status. */
  settledMicros?: number | null;
  errorCode?: string | null;
  nowMs?: number;
}

/**
 * Pure synchronous SQLite ledger core shared by Cloudflare Durable Object
 * (`this.ctx.storage.sql`) and Vitest (`node:sqlite` DatabaseSync).
 * All state checks & mutations execute atomically inside a single SQLite transaction.
 */
export class QuotaLedgerCore {
  private readonly sql: SqlExecutorLike;

  constructor(sql: SqlExecutorLike) {
    this.sql = sql;
    this.ensureSchema();
  }

  private ensureSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS budget_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        spent_micros INTEGER NOT NULL DEFAULT 0,
        reserved_micros INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      )
    `);
    this.sql.exec(`
      INSERT OR IGNORE INTO budget_state (id, spent_micros, reserved_micros, updated_at)
      VALUES (1, 0, 0, 0)
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS site_daily_usage (
        date_shanghai TEXT PRIMARY KEY,
        calls INTEGER NOT NULL DEFAULT 0
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS visitor_daily_usage (
        date_shanghai TEXT NOT NULL,
        visitor_key TEXT NOT NULL,
        calls INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date_shanghai, visitor_key)
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS ip_daily_usage (
        date_shanghai TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        calls INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date_shanghai, ip_hash)
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        settled_at INTEGER,
        date_shanghai TEXT NOT NULL,
        visitor_tag TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT NOT NULL,
        input_tokens INTEGER,
        cached_tokens INTEGER,
        output_tokens INTEGER,
        reserved_micros INTEGER NOT NULL,
        settled_micros INTEGER NOT NULL DEFAULT 0,
        reject_reason TEXT
      )
    `);

    this.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_call_logs_status_created
      ON call_logs (status, created_at)
    `);
  }

  /**
   * Reconciles abandoned in-flight reservations older than staleReservationTtlMs
   * using conservative accounting (converts expired reserve into settled spend so $40 cap stays strict).
   */
  private sweepStaleReservations(nowMs: number): void {
    const cutoff = nowMs - QUOTA_LIMITS.staleReservationTtlMs;
    const staleRows = this.sql
      .exec<{ id: string; reserved_micros: number }>(
        `SELECT id, reserved_micros FROM call_logs WHERE status = 'reserved' AND created_at < ?`,
        cutoff
      )
      .toArray();

    if (staleRows.length === 0) return;

    let totalExpiredMicros = 0;
    for (const row of staleRows) {
      totalExpiredMicros += Number(row.reserved_micros);
      this.sql.exec(
        `UPDATE call_logs
         SET status = 'stale_expired', settled_at = ?, settled_micros = reserved_micros, reject_reason = 'stale_reservation_timeout'
         WHERE id = ? AND status = 'reserved'`,
        nowMs,
        row.id
      );
    }

    if (totalExpiredMicros > 0) {
      this.sql.exec(
        `UPDATE budget_state
         SET spent_micros = spent_micros + ?,
             reserved_micros = MAX(0, reserved_micros - ?),
             updated_at = ?
         WHERE id = 1`,
        totalExpiredMicros,
        totalExpiredMicros,
        nowMs
      );
    }
  }

  getStatus(params: {
    visitorKey: string;
    ipHash: string | null;
    nowMs?: number;
  }): QuotaSnapshot {
    const nowMs = params.nowMs ?? Date.now();
    this.sweepStaleReservations(nowMs);
    const { dateShanghai, resetAtIso } = getShanghaiDayWindow(nowMs);

    const budgetRow = this.sql
      .exec<{ spent_micros: number; reserved_micros: number }>(
        `SELECT spent_micros, reserved_micros FROM budget_state WHERE id = 1`
      )
      .toArray()[0] ?? { spent_micros: 0, reserved_micros: 0 };

    const siteRow = this.sql
      .exec<{ calls: number }>(
        `SELECT calls FROM site_daily_usage WHERE date_shanghai = ?`,
        dateShanghai
      )
      .toArray()[0];

    const visitorRow = this.sql
      .exec<{ calls: number }>(
        `SELECT calls FROM visitor_daily_usage WHERE date_shanghai = ? AND visitor_key = ?`,
        dateShanghai,
        params.visitorKey
      )
      .toArray()[0];

    const ipRow = params.ipHash
      ? this.sql
          .exec<{ calls: number }>(
            `SELECT calls FROM ip_daily_usage WHERE date_shanghai = ? AND ip_hash = ?`,
            dateShanghai,
            params.ipHash
          )
          .toArray()[0]
      : undefined;

    const countRow = this.sql
      .exec<{ cnt: number }>(`SELECT COUNT(*) AS cnt FROM call_logs`)
      .toArray()[0];

    const visitorUsed = Math.max(Number(visitorRow?.calls ?? 0), Number(ipRow?.calls ?? 0));
    const siteUsed = Number(siteRow?.calls ?? 0);
    const spentMicros = Number(budgetRow.spent_micros ?? 0);
    const reservedMicros = Number(budgetRow.reserved_micros ?? 0);
    const remainingMicros = Math.max(
      0,
      QUOTA_LIMITS.cumulativeBudgetMicros - spentMicros - reservedMicros
    );
    const pricing = getModelPricing(DEFAULT_MODEL);

    return {
      dateShanghai,
      resetAt: resetAtIso,
      model: DEFAULT_MODEL,
      pricingVersion: pricing.version,
      visitor: {
        used: visitorUsed,
        limit: QUOTA_LIMITS.visitorDailyCalls,
        remaining: Math.max(0, QUOTA_LIMITS.visitorDailyCalls - visitorUsed),
      },
      site: {
        used: siteUsed,
        limit: QUOTA_LIMITS.siteDailyCalls,
        remaining: Math.max(0, QUOTA_LIMITS.siteDailyCalls - siteUsed),
      },
      budget: {
        spentMicros,
        reservedMicros,
        limitMicros: QUOTA_LIMITS.cumulativeBudgetMicros,
        spentUsd: microsToUsd(spentMicros),
        reservedUsd: microsToUsd(reservedMicros),
        limitUsd: QUOTA_LIMITS.cumulativeBudgetUsd,
        remainingUsd: microsToUsd(remainingMicros),
        exhausted: remainingMicros <= 0,
      },
      totalLoggedCalls: Number(countRow?.cnt ?? 0),
    };
  }

  /**
   * Atomically verifies all three limits (cumulative $40 budget, site 50/day, visitor/IP 5/day)
   * and reserves both call counts and worst-case cost before any upstream OpenAI request.
   */
  reserve(req: ReserveRequest): ReserveResult {
    const nowMs = req.nowMs ?? Date.now();
    this.sweepStaleReservations(nowMs);
    const { dateShanghai, resetAtIso } = getShanghaiDayWindow(nowMs);
    const safeReserveMicros = Math.max(1, Math.ceil(req.reservedMicros));

    const snapshotBefore = this.getStatus({
      visitorKey: req.visitorKey,
      ipHash: req.ipHash,
      nowMs,
    });

    // 1. Hard project lifetime budget check ($40 cumulative, never resets daily)
    if (
      snapshotBefore.budget.spentMicros +
        snapshotBefore.budget.reservedMicros +
        safeReserveMicros >
      QUOTA_LIMITS.cumulativeBudgetMicros
    ) {
      this.logRejection({
        nowMs,
        dateShanghai,
        visitorTag: req.visitorTag,
        model: req.model,
        rejectCode: 'BUDGET_EXHAUSTED',
      });
      return {
        allowed: false,
        rejectCode: 'BUDGET_EXHAUSTED',
        message: '本项目在线 AI 累计预算（$40）已达硬上限，已停止在线模型调用，请切换本地规则引擎继续体验。',
        snapshot: {
          ...snapshotBefore,
          budget: { ...snapshotBefore.budget, exhausted: true },
        },
      };
    }

    // 2. Site-wide daily limit (50/day, Asia/Shanghai)
    if (snapshotBefore.site.used >= QUOTA_LIMITS.siteDailyCalls) {
      this.logRejection({
        nowMs,
        dateShanghai,
        visitorTag: req.visitorTag,
        model: req.model,
        rejectCode: 'SITE_DAILY_LIMIT_EXCEEDED',
      });
      return {
        allowed: false,
        rejectCode: 'SITE_DAILY_LIMIT_EXCEEDED',
        message: `今日全站在线 AI 调用已达上限（${QUOTA_LIMITS.siteDailyCalls} 次/日），将于 ${resetAtIso}（北京时间次日 00:00）重置；可先使用本地规则引擎。`,
        snapshot: snapshotBefore,
      };
    }

    // 3. Per-visitor & anti-cookie-clear IP daily limit (5/day, Asia/Shanghai)
    if (snapshotBefore.visitor.used >= QUOTA_LIMITS.visitorDailyCalls) {
      this.logRejection({
        nowMs,
        dateShanghai,
        visitorTag: req.visitorTag,
        model: req.model,
        rejectCode: 'VISITOR_DAILY_LIMIT_EXCEEDED',
      });
      return {
        allowed: false,
        rejectCode: 'VISITOR_DAILY_LIMIT_EXCEEDED',
        message: `您今日在线 AI 调用已达上限（${QUOTA_LIMITS.visitorDailyCalls} 次/日），将于 ${resetAtIso}（北京时间次日 00:00）恢复；可切换本地规则引擎继续体验。`,
        snapshot: snapshotBefore,
      };
    }

    // All checks passed -> atomically increment counters & reserve conservative cost
    const reservationId = crypto.randomUUID();

    this.sql.exec(
      `INSERT INTO site_daily_usage (date_shanghai, calls) VALUES (?, 1)
       ON CONFLICT(date_shanghai) DO UPDATE SET calls = calls + 1`,
      dateShanghai
    );

    this.sql.exec(
      `INSERT INTO visitor_daily_usage (date_shanghai, visitor_key, calls) VALUES (?, ?, 1)
       ON CONFLICT(date_shanghai, visitor_key) DO UPDATE SET calls = calls + 1`,
      dateShanghai,
      req.visitorKey
    );

    if (req.ipHash) {
      this.sql.exec(
        `INSERT INTO ip_daily_usage (date_shanghai, ip_hash, calls) VALUES (?, ?, 1)
         ON CONFLICT(date_shanghai, ip_hash) DO UPDATE SET calls = calls + 1`,
        dateShanghai,
        req.ipHash
      );
    }

    this.sql.exec(
      `UPDATE budget_state
       SET reserved_micros = reserved_micros + ?, updated_at = ?
       WHERE id = 1`,
      safeReserveMicros,
      nowMs
    );

    this.sql.exec(
      `INSERT INTO call_logs (
        id, created_at, date_shanghai, visitor_tag, model, status, reserved_micros, settled_micros
      ) VALUES (?, ?, ?, ?, ?, 'reserved', ?, 0)`,
      reservationId,
      nowMs,
      dateShanghai,
      req.visitorTag,
      req.model,
      safeReserveMicros
    );

    const snapshotAfter = this.getStatus({
      visitorKey: req.visitorKey,
      ipHash: req.ipHash,
      nowMs,
    });

    return {
      allowed: true,
      reservationId,
      reservedMicros: safeReserveMicros,
      snapshot: snapshotAfter,
    };
  }

  /**
   * Reconciles a previously reserved call with actual OpenAI usage (or conservative fallback).
   * Idempotent: settling an already-settled reservation is a safe no-op.
   */
  settle(req: SettleRequest, visitorKey: string, ipHash: string | null): QuotaSnapshot {
    const nowMs = req.nowMs ?? Date.now();
    const row = this.sql
      .exec<{ status: string; reserved_micros: number }>(
        `SELECT status, reserved_micros FROM call_logs WHERE id = ?`,
        req.reservationId
      )
      .toArray()[0];

    if (!row || row.status !== 'reserved') {
      return this.getStatus({ visitorKey, ipHash, nowMs });
    }

    const reservedMicros = Number(row.reserved_micros);

    // Determine settled cost per YOU-247 requirements 6 & 7:
    // - Upstream HTTP error (4xx/5xx before generation): release dollar reserve (0 cost), keep call count recorded.
    // - Timeout or missing/unparseable usage: conservative strategy -> charge full reserved amount.
    // - Success / schema_invalid with usage: charge exact actual usage cost.
    let finalSettledMicros: number;
    if (typeof req.settledMicros === 'number' && Number.isFinite(req.settledMicros) && req.settledMicros >= 0) {
      finalSettledMicros = Math.ceil(req.settledMicros);
    } else if (req.status === 'upstream_error') {
      finalSettledMicros = 0;
    } else {
      finalSettledMicros = reservedMicros;
    }

    this.sql.exec(
      `UPDATE call_logs
       SET status = ?,
           settled_at = ?,
           input_tokens = ?,
           cached_tokens = ?,
           output_tokens = ?,
           settled_micros = ?,
           reject_reason = ?
       WHERE id = ? AND status = 'reserved'`,
      req.status,
      nowMs,
      req.inputTokens ?? null,
      req.cachedTokens ?? null,
      req.outputTokens ?? null,
      finalSettledMicros,
      req.errorCode ?? null,
      req.reservationId
    );

    this.sql.exec(
      `UPDATE budget_state
       SET spent_micros = spent_micros + ?,
           reserved_micros = MAX(0, reserved_micros - ?),
           updated_at = ?
       WHERE id = 1`,
      finalSettledMicros,
      reservedMicros,
      nowMs
    );

    return this.getStatus({ visitorKey, ipHash, nowMs });
  }

  private logRejection(params: {
    nowMs: number;
    dateShanghai: string;
    visitorTag: string;
    model: string;
    rejectCode: QuotaRejectCode;
  }): void {
    this.sql.exec(
      `INSERT INTO call_logs (
        id, created_at, settled_at, date_shanghai, visitor_tag, model, status, reserved_micros, settled_micros, reject_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      crypto.randomUUID(),
      params.nowMs,
      params.nowMs,
      params.dateShanghai,
      params.visitorTag,
      params.model,
      `rejected_${params.rejectCode.toLowerCase()}`,
      params.rejectCode
    );
  }
}
