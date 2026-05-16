CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" text,
	"refresh_token_expires_at" text,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_moves" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"player_id" text NOT NULL,
	"position" integer NOT NULL,
	"step_number" integer NOT NULL,
	"is_match" boolean NOT NULL,
	"player_answer" boolean,
	"is_correct" boolean,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Player' NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"bot_accuracy" integer DEFAULT 100 NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"joined_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"n_value" integer NOT NULL,
	"base_speed_ms" integer NOT NULL,
	"current_speed_ms" integer NOT NULL,
	"max_players" integer DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobbies" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"n_value" integer DEFAULT 2 NOT NULL,
	"base_speed_ms" integer DEFAULT 2000 NOT NULL,
	"min_players" integer DEFAULT 2 NOT NULL,
	"max_players" integer DEFAULT 2 NOT NULL,
	"current_players" integer DEFAULT 0 NOT NULL,
	"host_id" text NOT NULL,
	"password" text,
	"auto_start_enabled" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"started_at" text,
	"finished_at" text
);
--> statement-breakpoint
CREATE TABLE "lobby_players" (
	"id" text PRIMARY KEY NOT NULL,
	"lobby_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"connection_id" text,
	"last_heartbeat" text,
	"joined_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"positions" text NOT NULL,
	"total_steps" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" text NOT NULL,
	"token" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tournament_results" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"player_id" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"bot_accuracy" integer,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"total_errors" integer DEFAULT 0 NOT NULL,
	"round_wins" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text,
	"updated_at" text
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_moves" ADD CONSTRAINT "game_moves_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby_players" ADD CONSTRAINT "lobby_players_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_move_idx" ON "game_moves" USING btree ("session_id","player_id","step_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_lobby_player_idx" ON "lobby_players" USING btree ("lobby_id","user_id");