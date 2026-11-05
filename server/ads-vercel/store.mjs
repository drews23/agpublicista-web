import { AccessError, requireThat, token, challengeId, otp, hash, keyed, equal, email, day, seal, open } from './security.mjs';
import { schemaName, schemaSQL } from './schema.mjs';

export class AdsStore {
  #pool; #pepper; #clock; #scope; #schema;
  constructor({ pool, pepper, scope, clock = () => Math.floor(Date.now() / 1000) }) {
    requireThat(typeof pepper === 'string' && /^[a-f0-9]{64}$/.test(pepper), 'IDENTITY_SECRET_REQUIRED', 503);
    this.#pool = pool; this.#pepper = pepper; this.#scope = scope; this.#schema = schemaName(scope); this.#clock = clock;
  }
  now() { return this.#clock(); }
  identity(mailbox) { return keyed(this.#pepper, 'email:' + email(mailbox)); }
  csrf(cookie) { return keyed(this.#pepper, `csrf-v1:${this.#scope}:${cookie}`); }
  async transaction(work, check = true) {
    const client = await this.#pool.connect();
    const q = async (sql, values = []) => (await client.query(sql.replaceAll('@.', this.#schema + '.'), values)).rows;
    try {
      await client.query('BEGIN');
      // One bounded private pilot. Serialize mutations across all serverless instances.
      await client.query('SELECT pg_advisory_xact_lock($1)', [this.#scope === 'production' ? 7140001 : this.#scope === 'preview' ? 7140002 : 7140003]);
      if (check) {
        const [meta] = await q('SELECT * FROM @.meta WHERE id=1');
        requireThat(meta?.version === 1 && equal(meta.key_check, keyed(this.#pepper, `storage-check-v1:${this.#scope}`)), 'STORAGE_CHECKPOINT_REQUIRED', 503);
      }
      const result = await work(q);
      await client.query('COMMIT'); return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      if (error instanceof AccessError) throw error;
      throw new AccessError('ACCESS_STORAGE_UNAVAILABLE', 503);
    } finally { client.release(); }
  }
  async migrate() {
    return this.transaction(async q => {
      await q(schemaSQL(this.#scope));
      const [existing] = await q('SELECT * FROM @.meta WHERE id=1');
      const keyCheck = keyed(this.#pepper, `storage-check-v1:${this.#scope}`);
      requireThat(!existing || (existing.version === 1 && equal(existing.key_check, keyCheck)), 'IDENTITY_SECRET_MISMATCH', 503);
      await q('INSERT INTO @.meta VALUES(1,1,$1) ON CONFLICT(id) DO NOTHING', [keyCheck]);
    }, false);
  }
  async checkpointBudget(carriedMicroUsd, reference) {
    const ceiling = this.#scope === 'preview' ? 0 : 5000000;
    requireThat(Number.isSafeInteger(carriedMicroUsd) && carriedMicroUsd >= 0 && carriedMicroUsd <= ceiling &&
      typeof reference === 'string' && /^[a-zA-Z0-9_.:-]{8,160}$/.test(reference), 'INVALID_BUDGET_CHECKPOINT', 400);
    return this.transaction(async q => {
      const [old] = await q('SELECT * FROM @.budget WHERE id=1');
      requireThat(!old || (Number(old.carried) === carriedMicroUsd && old.checkpoint === reference), 'BUDGET_ALREADY_INITIALIZED', 409);
      await q('INSERT INTO @.budget(id,ceiling,carried,checkpoint) VALUES(1,$1,$2,$3) ON CONFLICT(id) DO NOTHING', [ceiling, carriedMicroUsd, reference]);
    });
  }
  async invite(mailbox, locale = 'es', ttl = 2592000) {
    const identity = this.identity(mailbox);
    requireThat(['es', 'en'].includes(locale) && Number.isInteger(ttl) && ttl > 0 && ttl <= 2592000, 'INVALID_INVITATION', 400);
    return this.transaction(async q => {
      const [exists] = await q('SELECT identity FROM @.allowed WHERE identity=$1', [identity]);
      const [total] = await q('SELECT count(*)::integer AS n FROM @.allowed');
      requireThat(exists || total.n < 20, 'PILOT_FULL', 403);
      await q('INSERT INTO @.allowed(identity,locale,active,expires) VALUES($1,$2,true,$3) ON CONFLICT(identity) DO UPDATE SET locale=EXCLUDED.locale,active=true,expires=EXCLUDED.expires', [identity, locale, this.now() + ttl]);
    });
  }
  async revoke(mailbox) {
    return this.transaction(async q => {
      const identity = this.identity(mailbox);
      await q('UPDATE @.allowed SET active=false WHERE identity=$1', [identity]);
      await q('UPDATE @.sessions SET revoked=true WHERE identity=$1', [identity]);
      await q('UPDATE @.challenges SET used=true WHERE identity=$1', [identity]);
    });
  }
  async clean(q) {
    const now = this.now();
    await q("UPDATE @.mail SET state='uncertain',payload=NULL,updated=$1 WHERE state='sending' AND updated<=$2", [now, now - 45]);
    await q("UPDATE @.mail SET state='expired',payload=NULL,updated=$1 WHERE state='queued' AND expires<=$1", [now]);
    await q("DELETE FROM @.mail WHERE state NOT IN ('queued','sending') AND updated<$1", [now - 86400]);
    await q('DELETE FROM @.challenges WHERE expires<$1', [now - 86400]);
    await q('DELETE FROM @.sessions WHERE expires<$1', [now - 86400]);
    await q('DELETE FROM @.attempts WHERE created<$1', [now - 86400]);
    await q('DELETE FROM @.mail_budget WHERE day<$1', [day(now - 259200)]);
  }
  async rate(q, limits) {
    for (const [bucket, maximum] of Object.entries(limits)) {
      const [row] = await q('SELECT count(*)::integer AS n FROM @.attempts WHERE bucket=$1 AND created>$2', [bucket, this.now() - 900]);
      requireThat(row.n < maximum, 'ACCESS_RATE_LIMIT', 429);
    }
    for (const bucket of Object.keys(limits)) await q('INSERT INTO @.attempts VALUES($1,$2)', [bucket, this.now()]);
  }
  async flow(q, cookie) {
    if (!/^[a-f0-9]{64}$/.test(cookie || '')) return null;
    const [row] = await q('SELECT s.*,a.active,a.expires AS allowed_until,a.activated FROM @.sessions s LEFT JOIN @.allowed a ON a.identity=s.identity WHERE s.id=$1', [hash(cookie)]);
    return row && !row.revoked && Number(row.expires) > this.now() &&
      (!row.identity || (row.active && Number(row.allowed_until) > this.now())) ? row : null;
  }
  async anonymous(q) {
    const cookie = token();
    await q('INSERT INTO @.sessions(id,expires) VALUES($1,$2)', [hash(cookie), this.now() + 1800]);
    return cookie;
  }
  async snapshot(q, cookie, language) {
    const row = await this.flow(q, cookie); requireThat(row, 'ACCESS_REQUIRED', 403);
    let pilot = null;
    if (row.identity && row.activated !== null) pilot = await this.quota(q, row.identity);
    return { authenticated: !!row.identity, mode: 'gemini-pilot', csrfToken: this.csrf(cookie),
      consent: { version: 'gemini-review-v1', text: language === 'en' ?
        'When you confirm, your draft, goal, terms and confirmed facts will be sent to Google Gemini to review suggestions. Review each change before applying it. No ads are published and your Google Ads account is not accessed.' :
        'Al confirmar, el borrador, objetivo, términos y hechos confirmados se enviarán a Google Gemini para revisar propuestas. Debes revisar cada cambio antes de aplicarlo. No se publican anuncios ni se accede a tu cuenta de Google Ads.' },
      reviewAvailable: false, limits: { periodReviews: 5, dailyReviews: 2, periodDays: 30, timezone: 'America/Bogota' },
      ...(row.identity ? { expiresAt: new Date(Math.min(Number(row.expires), Number(row.allowed_until)) * 1000).toISOString(), pilot } : {}),
      challengePending: !!row.challenge_id && (await q('SELECT id FROM @.challenges WHERE id=$1 AND expires>$2 AND used=false', [row.challenge_id, this.now()])).length > 0,
      resendAfter: Math.max(0, Number(row.resend_at) - this.now()) };
  }
  async session(cookie, language) {
    return this.transaction(async q => {
      await this.clean(q);
      const valid = await this.flow(q, cookie);
      if (!valid) cookie = await this.anonymous(q);
      return { body: await this.snapshot(q, cookie, language), cookie: valid ? null : cookie };
    });
  }
  async start(cookie, mailbox, peer) {
    mailbox = email(mailbox); const identity = this.identity(mailbox), id = challengeId(), code = otp();
    return this.transaction(async q => {
      await this.clean(q); const flow = await this.flow(q, cookie);
      requireThat(flow && !flow.identity, flow?.identity ? 'ALREADY_SIGNED_IN' : 'ACCESS_REQUIRED', flow?.identity ? 409 : 403);
      requireThat(Number(flow.resend_at) <= this.now(), 'ACCESS_RESEND_WAIT', 429);
      await this.rate(q, { 'start:global': 30, ['start:peer:' + keyed(this.#pepper, peer)]: 5, ['start:mail:' + identity]: 3 });
      const [allowed] = await q('SELECT * FROM @.allowed WHERE identity=$1', [identity]);
      const active = !!allowed?.active && Number(allowed.expires) > this.now();
      const [capacity] = await q("SELECT count(*)::integer AS n FROM @.mail WHERE state IN ('queued','sending')");
      requireThat(capacity.n < 60, 'MAIL_QUEUE_FULL', 503);
      await q('UPDATE @.challenges SET used=true WHERE identity=$1 AND session_id=$2', [identity, flow.id]);
      await q('INSERT INTO @.challenges(id,identity,session_id,code_hash,expires,allowed) VALUES($1,$2,$3,$4,$5,$6)', [id, identity, flow.id, keyed(this.#pepper, `code:${id}:${code}`), this.now() + 600, active]);
      const message = active ? { to: mailbox, code, locale: allowed.locale } : null;
      await q("INSERT INTO @.mail VALUES($1,$2,'queued',$3,$3,$4,NULL)", [id, seal(this.#pepper, this.#scope, id, message), this.now(), this.now() + 120]);
      await q('UPDATE @.sessions SET challenge_id=$1,resend_at=$2 WHERE id=$3', [id, this.now() + 60, flow.id]);
      return { accepted: true, expiresIn: 600, resendAfter: 60 };
    });
  }
  async verify(cookie, code, peer, language) {
    requireThat(typeof code === 'string' && /^[0-9]{8}$/.test(code), 'ACCESS_REQUIRED', 403);
    const result = await this.transaction(async q => {
      const flow = await this.flow(q, cookie); requireThat(flow && !flow.identity, 'ACCESS_REQUIRED', 403);
      await this.rate(q, { 'verify:global': 200, ['verify:peer:' + keyed(this.#pepper, peer)]: 20 });
      const [challenge] = await q('SELECT c.*,a.active,a.expires AS allowed_until FROM @.challenges c LEFT JOIN @.allowed a ON a.identity=c.identity WHERE c.id=$1', [flow.challenge_id]);
      if (!challenge || challenge.used || Number(challenge.expires) <= this.now() || challenge.attempts >= 5 || challenge.session_id !== flow.id) return null;
      await q('UPDATE @.challenges SET attempts=attempts+1 WHERE id=$1', [challenge.id]);
      if (!challenge.allowed || !challenge.active || Number(challenge.allowed_until) <= this.now() || !equal(challenge.code_hash, keyed(this.#pepper, `code:${challenge.id}:${code}`))) return null;
      await q('UPDATE @.challenges SET used=true WHERE id=$1', [challenge.id]);
      await q('UPDATE @.sessions SET revoked=true WHERE id=$1', [flow.id]);
      const next = token(), expires = Math.min(this.now() + 28800, Number(challenge.allowed_until));
      await q('INSERT INTO @.sessions(id,identity,expires) VALUES($1,$2,$3)', [hash(next), challenge.identity, expires]);
      return { body: await this.snapshot(q, next, language), cookie: next };
    });
    // Wrong guesses must commit. Throwing inside the transaction would undo attempts.
    requireThat(result, 'ACCESS_REQUIRED', 403); return result;
  }
  async logout(cookie, language) {
    return this.transaction(async q => {
      const row = await this.flow(q, cookie); requireThat(row, 'ACCESS_REQUIRED', 403);
      await q('UPDATE @.sessions SET revoked=true WHERE id=$1', [row.id]);
      await q('UPDATE @.challenges SET used=true WHERE session_id=$1', [row.id]);
      const next = await this.anonymous(q); return { cookie: next, body: await this.snapshot(q, next, language) };
    });
  }
  async quota(q, identity) {
    const [allowed] = await q('SELECT * FROM @.allowed WHERE identity=$1', [identity]);
    const [usage] = await q('SELECT count(*)::integer AS total,count(*) FILTER(WHERE day=$2)::integer AS daily FROM @.usage WHERE identity=$1', [identity, day(this.now())]);
    const [budget] = await q('SELECT paused FROM @.budget WHERE id=1');
    return { access: 'active', periodRemaining: Math.max(0, 5 - usage.total), dailyRemaining: Math.max(0, 2 - usage.daily),
      expiresAt: new Date(Math.min(Number(allowed.expires), Number(allowed.activated) + 2592000) * 1000).toISOString(),
      paused: !budget || budget.paused, paidGenerationEnabled: false, timezone: 'America/Bogota' };
  }
  async pause(paused) {
    requireThat(typeof paused === 'boolean', 'INVALID_REQUEST', 400);
    return this.transaction(async q => {
      const rows = await q('UPDATE @.budget SET paused=$1 WHERE id=1 RETURNING id', [paused]);
      requireThat(rows.length === 1, 'BUDGET_CHECKPOINT_REQUIRED', 503);
    });
  }
  async reserve(identity, requestId, fingerprint, maximumCost) {
    requireThat(/^[a-f0-9]{64}$/.test(identity) && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId) && /^[a-f0-9]{64}$/.test(fingerprint) &&
      Number.isSafeInteger(maximumCost) && maximumCost >= 0 && maximumCost <= 5000000, 'INVALID_RESERVATION', 400);
    return this.transaction(async q => {
      const [budget] = await q('SELECT * FROM @.budget WHERE id=1'); requireThat(budget && !budget.paused, 'PILOT_PAUSED', 503);
      requireThat(this.#scope !== 'preview' || (Number(budget.ceiling) === 0 && maximumCost === 0), 'PREVIEW_PAID_GENERATION_DISABLED', 503);
      const [allowed] = await q('SELECT * FROM @.allowed WHERE identity=$1', [identity]);
      requireThat(allowed?.active && Number(allowed.expires) > this.now(), 'ACCESS_REQUIRED', 403);
      requireThat(allowed.activated === null || Number(allowed.activated) + 2592000 > this.now(), 'PILOT_EXPIRED', 403);
      const [previous] = await q('SELECT * FROM @.usage WHERE identity=$1 AND request_id=$2', [identity, requestId]);
      if (previous) { requireThat(equal(previous.fingerprint, fingerprint), 'IDEMPOTENCY_CONFLICT', 409); requireThat(previous.state === 'complete', 'REVIEW_RESERVED', 409); return false; }
      const quota = await this.quota(q, identity);
      requireThat(quota.periodRemaining > 0, 'PILOT_PERIOD_LIMIT', 429); requireThat(quota.dailyRemaining > 0, 'PILOT_DAILY_LIMIT', 429);
      const [used] = await q("SELECT coalesce(sum(CASE WHEN state='complete' THEN spent ELSE greatest(reserved,spent) END),0)::text AS used FROM @.usage");
      requireThat(maximumCost <= Number(budget.ceiling) - Number(budget.carried) - Number(used.used), 'PILOT_BUDGET_LIMIT', 429);
      await q('UPDATE @.allowed SET activated=coalesce(activated,$1) WHERE identity=$2', [this.now(), identity]);
      await q("INSERT INTO @.usage(identity,request_id,fingerprint,created,day,state,reserved) VALUES($1,$2,$3,$4,$5,'pending',$6)", [identity, requestId, fingerprint, this.now(), day(this.now()), maximumCost]);
      return true;
    });
  }
  async finish(identity, requestId, actualCost, uncertain = false) {
    const mismatch = await this.transaction(async q => {
      const [row] = await q('SELECT * FROM @.usage WHERE identity=$1 AND request_id=$2', [identity, requestId]);
      requireThat(row?.state === 'pending', 'RESERVATION_CONFLICT', 409);
      const invalid = !Number.isSafeInteger(actualCost) || actualCost < 0 || actualCost > Number(row.reserved);
      await q('UPDATE @.usage SET state=$1,spent=$2 WHERE identity=$3 AND request_id=$4', [uncertain || invalid ? 'uncertain' : 'complete', Number.isSafeInteger(actualCost) && actualCost > 0 ? actualCost : 0, identity, requestId]);
      if (invalid) await q('UPDATE @.budget SET paused=true WHERE id=1');
      return invalid;
    }); requireThat(!mismatch, 'BUDGET_ACCOUNTING_MISMATCH', 503);
  }
  async runMail(sender) {
    const row = await this.transaction(async q => {
      await this.clean(q);
      const [job] = await q("SELECT * FROM @.mail WHERE state='queued' ORDER BY created,id LIMIT 1");
      if (job) await q("UPDATE @.mail SET state='sending',updated=$1 WHERE id=$2", [this.now(), job.id]);
      return job;
    });
    if (!row) return { state: 'empty' };
    let state = 'uncertain', receipt = null;
    try {
      const message = open(this.#pepper, this.#scope, row.id, row.payload);
      const ready = await this.transaction(async q => {
        const [challenge] = await q('SELECT c.*,a.active,a.expires AS allowed_until,s.revoked,s.expires AS session_until FROM @.challenges c JOIN @.allowed a ON a.identity=c.identity JOIN @.sessions s ON s.id=c.session_id WHERE c.id=$1', [row.id]);
        if (!message || !challenge || challenge.used || challenge.attempts >= 5 || !challenge.active || challenge.revoked ||
          Number(challenge.expires) <= this.now() + 30 || Number(challenge.allowed_until) <= this.now() + 30 ||
          Number(challenge.session_until) <= this.now() || Number(row.expires) <= this.now()) return 'cancelled';
        const date = day(this.now());
        await q('INSERT INTO @.mail_budget VALUES($1,0) ON CONFLICT(day) DO NOTHING', [date]);
        const [budget] = await q('SELECT attempts FROM @.mail_budget WHERE day=$1', [date]);
        if (budget.attempts >= 20) return 'limited';
        await q('UPDATE @.mail_budget SET attempts=attempts+1 WHERE day=$1', [date]); return 'ready';
      });
      if (ready !== 'ready') state = ready;
      else {
        const result = await sender(message, row.id);
        requireThat(['accepted', 'failed', 'uncertain'].includes(result?.state), 'INVALID_MAIL_RECEIPT', 502);
        state = result.state;
        if (state === 'accepted') { requireThat(typeof result.messageId === 'string' && /^[A-Za-z0-9<>@_.:+\/-]{1,254}$/.test(result.messageId), 'INVALID_MAIL_RECEIPT', 502); receipt = result.messageId; }
      }
    } catch { state = 'uncertain'; }
    await this.transaction(async q => {
      // An expired sending lease stays uncertain. Never requeue after a possible send.
      await q("UPDATE @.mail SET state=$1,payload=NULL,updated=$2,receipt=$3 WHERE id=$4 AND state='sending'", [state, this.now(), receipt, row.id]);
      if (['failed', 'limited', 'expired'].includes(state)) await q('UPDATE @.challenges SET used=true WHERE id=$1', [row.id]);
    });
    return { state };
  }
}
