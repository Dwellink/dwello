-- Hand-written migration. drizzle-kit generate is currently blocked by
-- snapshot drift (last snapshot still describes tables/enums in "public",
-- but pgSchema('kan') moved them to "kan" at runtime). Tracked in
-- AGENTS.md "Pending Decisions / Tech Debt"; resolving that drift is a
-- separate project requiring pg_dump from prod.
--
-- ALTER TABLE ... DISABLE ROW LEVEL SECURITY is idempotent — safe to
-- re-apply if a future drizzle-kit-generated migration emits the same
-- statements after the snapshot is rebaselined.

ALTER TABLE "kan"."account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."apiKey" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."board" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card_activity" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."_card_labels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."_card_workspace_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card_comments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card_attachment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card_checklist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."card_checklist_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."feedback" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."import" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."integration" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."label" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."list" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."notification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_role_permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_member_permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."subscription" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."user" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_webhooks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_invite_links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."workspace_slug_checks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kan"."user" ALTER COLUMN "id" SET DEFAULT public.uuid_generate_v4();
