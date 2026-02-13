# Wrong Database Audit Report

**Date:** 2026-02-12
**Issue:** The Supabase MCP tool was connected to the wrong database project during the initial investigation phase of fixing matrx-dm messaging bugs.

## Which Database Was Affected?

The MCP tool was connected to the **main AI Matrx platform database** (the one with 50+ migrations including feedback system, canvas, flashcards, permissions, etc.) instead of the **matrx-dm database** (`deayzgwvqfdeskkdwudy.supabase.co`).

## What Was Done on the Wrong Database

### READ-ONLY Queries (No Changes Made)

All operations performed via `execute_sql` were **SELECT queries only**. No data was modified, no schema was changed, and no migrations were applied. Here is the complete list:

1. **Schema inspection queries:**
   - `SELECT ... FROM information_schema.columns WHERE table_name IN ('conversations', 'conversation_participants', 'messages', ...)` -- read column definitions
   - `SELECT ... FROM pg_policies WHERE tablename IN ('conversations', 'conversation_participants', ...)` -- read RLS policies
   - `SELECT ... FROM pg_proc ... WHERE proname LIKE '%conversation%' OR proname LIKE '%message%' ...` -- read function definitions
   - `SELECT relrowsecurity, relforcerowsecurity FROM pg_class` -- check RLS enabled flags
   - `SELECT ... FROM information_schema.table_constraints ... WHERE constraint_type = 'FOREIGN KEY'` -- read foreign key definitions
   - `SELECT ... FROM information_schema.routine_privileges WHERE routine_name = 'delete_conversation_for_user'` -- check GRANT EXECUTE
   - `SELECT ... FROM information_schema.routine_privileges WHERE routine_name IN (...)` -- check grants on multiple RPCs
   - `SELECT ... FROM pg_policy WHERE polrelid = 'public.conversation_participants'::regclass` -- read policy details
   - `SELECT ... FROM pg_trigger WHERE tgrelid = 'public.conversation_participants'::regclass` -- read triggers

2. **Data inspection queries:**
   - `SELECT c.id, c.type, c.created_by, ... FROM conversations c` -- read conversations (returned empty)
   - `SELECT * FROM conversation_participants` -- read participants (returned empty)
   - `SELECT id, display_name, avatar_url FROM profiles` -- read profiles
   - `SELECT id, email, created_at FROM auth.users` -- read auth users
   - `SELECT 'conversations' as tbl, count(*) FROM conversations UNION ALL ...` -- count records in all messaging tables

3. **Function test (failed, no side effects):**
   - `SELECT delete_conversation_for_user('00000000-...'::uuid)` -- this RAISED an exception ("Not authenticated") and did NOT execute any deletes

4. **MCP built-in tools (read-only):**
   - `list_tables` -- listed public schema tables
   - `list_migrations` -- listed migration history
   - `get_advisors(security)` -- checked security advisors

### Migrations Applied: NONE

No `apply_migration` calls were made to the wrong database.

### DDL Changes: NONE

No CREATE, ALTER, DROP, or other DDL statements were executed.

### Data Modifications: NONE

No INSERT, UPDATE, or DELETE statements were executed on the wrong database.

## Conclusion

**No changes were made to the wrong database.** All operations were read-only SELECT queries and MCP metadata reads. The wrong database's schema, data, functions, policies, and migrations are all untouched.

The only actual code change was to the local file `lib/actions/conversations.ts` in the matrx-dm project, which is correct and unrelated to the wrong database.
