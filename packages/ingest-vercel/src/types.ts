import type { ActionPayloadCallback } from '@stackpress/ingest/dist/framework/types';

export type FetchRequest = globalThis.Request;
export type FetchResponse = globalThis.Response;
export type ActionSet = Set<ActionPayloadCallback>;