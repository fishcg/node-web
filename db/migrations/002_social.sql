-- 002: 投稿审核 / 关注 / 私信 / 系统通知
-- Run once against an existing database created from 001 (db/schema.sql before this change).

ALTER TABLE `lab_user`
  ADD COLUMN `role` VARCHAR(16) NOT NULL DEFAULT 'user' AFTER `status`;

ALTER TABLE `lab_music`
  ADD COLUMN `review_reason` VARCHAR(500) NOT NULL DEFAULT '' AFTER `status`,
  ADD COLUMN `reviewed_by` INT UNSIGNED NULL AFTER `review_reason`,
  ADD COLUMN `reviewed_at` DATETIME NULL AFTER `reviewed_by`,
  ADD KEY `idx_lab_music_status_created` (`status`, `created`),
  ADD KEY `idx_lab_music_uid_status` (`uid`, `status`, `created`);

CREATE TABLE IF NOT EXISTS `lab_follow` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `follower_id` INT UNSIGNED NOT NULL,
  `following_id` INT UNSIGNED NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_follow_pair` (`follower_id`, `following_id`),
  KEY `idx_lab_follow_following` (`following_id`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_message` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `body` VARCHAR(2000) NOT NULL,
  `read_at` DATETIME NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_message_pair` (`sender_id`, `receiver_id`, `created`),
  KEY `idx_lab_message_inbox` (`receiver_id`, `read_at`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_notification` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` INT UNSIGNED NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `body` VARCHAR(1000) NOT NULL,
  `link` VARCHAR(255) NOT NULL DEFAULT '',
  `read_at` DATETIME NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_notification_uid` (`uid`, `read_at`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
