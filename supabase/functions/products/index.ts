// Supabase Edge Function entry point. The logic and its checks are in handler.ts.
import { handle } from './handler.ts';

Deno.serve((req: Request) => handle(req, (name: string) => Deno.env.get(name)));
