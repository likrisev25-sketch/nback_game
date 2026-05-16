CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` text,
	`refresh_token_expires_at` text,
	`scope` text,
	`id_token` text,
	`password` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_moves` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`player_id` text NOT NULL,
	`position` integer NOT NULL,
	`step_number` integer NOT NULL,
	`is_match` integer NOT NULL,
	`player_answer` integer,
	`is_correct` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_move_idx` ON `game_moves` (`session_id`,`player_id`,`step_number`);--> statement-breakpoint
CREATE TABLE `game_players` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'Player' NOT NULL,
	`correct_answers` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`is_bot` integer DEFAULT false NOT NULL,
	`bot_accuracy` integer DEFAULT 100 NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`n_value` integer NOT NULL,
	`base_speed_ms` integer NOT NULL,
	`current_speed_ms` integer NOT NULL,
	`max_players` integer DEFAULT 2 NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lobbies` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`n_value` integer DEFAULT 1 NOT NULL,
	`base_speed_ms` integer DEFAULT 2000 NOT NULL,
	`min_players` integer DEFAULT 2 NOT NULL,
	`max_players` integer DEFAULT 2 NOT NULL,
	`current_players` integer DEFAULT 0 NOT NULL,
	`host_id` text NOT NULL,
	`password` text,
	`auto_start_enabled` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`started_at` text,
	`finished_at` text
);
--> statement-breakpoint
CREATE TABLE `lobby_players` (
	`id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_ready` integer DEFAULT false NOT NULL,
	`is_host` integer DEFAULT false NOT NULL,
	`connection_id` text,
	`last_heartbeat` text,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`lobby_id`) REFERENCES `lobbies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_lobby_player_idx` ON `lobby_players` (`lobby_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`positions` text NOT NULL,
	`total_steps` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` text NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `tournament_results` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`player_id` text NOT NULL,
	`is_bot` integer DEFAULT false NOT NULL,
	`bot_accuracy` integer,
	`total_correct` integer DEFAULT 0 NOT NULL,
	`total_errors` integer DEFAULT 0 NOT NULL,
	`round_wins` integer DEFAULT 0 NOT NULL,
	`rank` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text,
	`updated_at` text
);
