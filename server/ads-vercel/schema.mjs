import { requireThat } from './security.mjs';
export function schemaName(scope) {
  requireThat(['preview', 'production', 'test'].includes(scope), 'INVALID_STORAGE_SCOPE', 503);
  return `lienzo_ads_${scope}`;
}
// Explicit administrative migration only. HTTP requests never create/reset tables,
// identity peppers, invitations or the lifetime budget checkpoint.
export function schemaSQL(scope) {
  const s = schemaName(scope);
  return `CREATE SCHEMA IF NOT EXISTS ${s};
CREATE TABLE IF NOT EXISTS ${s}.meta(id integer PRIMARY KEY CHECK(id=1), version integer NOT NULL, key_check text NOT NULL);
CREATE TABLE IF NOT EXISTS ${s}.allowed(identity text PRIMARY KEY,locale text NOT NULL CHECK(locale IN ('es','en')),active boolean NOT NULL,expires bigint NOT NULL,activated bigint);
CREATE TABLE IF NOT EXISTS ${s}.sessions(id text PRIMARY KEY,identity text,challenge_id text,resend_at bigint NOT NULL DEFAULT 0,expires bigint NOT NULL,revoked boolean NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS ${s}.challenges(id text PRIMARY KEY,identity text NOT NULL,session_id text NOT NULL,code_hash text NOT NULL,expires bigint NOT NULL,attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),used boolean NOT NULL DEFAULT false,allowed boolean NOT NULL);
CREATE TABLE IF NOT EXISTS ${s}.attempts(bucket text NOT NULL,created bigint NOT NULL);
CREATE INDEX IF NOT EXISTS attempts_bucket ON ${s}.attempts(bucket,created);
CREATE TABLE IF NOT EXISTS ${s}.mail(id text PRIMARY KEY,payload text,state text NOT NULL CHECK(state IN ('queued','sending','accepted','failed','uncertain','cancelled','limited','expired')),created bigint NOT NULL,updated bigint NOT NULL,expires bigint NOT NULL,receipt text);
CREATE TABLE IF NOT EXISTS ${s}.mail_budget(day text PRIMARY KEY,attempts integer NOT NULL CHECK(attempts BETWEEN 0 AND 20));
CREATE TABLE IF NOT EXISTS ${s}.budget(id integer PRIMARY KEY CHECK(id=1),ceiling bigint NOT NULL CHECK(ceiling BETWEEN 0 AND 5000000),carried bigint NOT NULL CHECK(carried>=0),paused boolean NOT NULL DEFAULT true,checkpoint text NOT NULL);
CREATE TABLE IF NOT EXISTS ${s}.usage(identity text NOT NULL,request_id text NOT NULL,fingerprint text NOT NULL,created bigint NOT NULL,day text NOT NULL,state text NOT NULL CHECK(state IN ('pending','complete','uncertain')),reserved bigint NOT NULL CHECK(reserved>=0),spent bigint NOT NULL DEFAULT 0 CHECK(spent>=0),PRIMARY KEY(identity,request_id));`;
}
