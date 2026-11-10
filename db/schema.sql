-- 幻想の城 / AcGay sound library schema
-- Safe to run repeatedly: every statement is CREATE TABLE IF NOT EXISTS
-- or an idempotent category upsert handled by scripts/db-init.ts.

CREATE TABLE IF NOT EXISTS `lab_category` (
  `id` INT UNSIGNED NOT NULL,
  `slug` VARCHAR(32) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `section` VARCHAR(32) NOT NULL,
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `sort` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_category_slug` (`slug`),
  KEY `idx_lab_category_section` (`section`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_music` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` INT UNSIGNED NOT NULL DEFAULT 0,
  `music_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `music_category_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `subject` VARCHAR(255) NOT NULL,
  `summary` TEXT NULL,
  `author` VARCHAR(128) NOT NULL DEFAULT '',
  `url` VARCHAR(500) NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- 0 = 待审核，1 = 已发布，2 = 未通过
  `status` TINYINT NOT NULL DEFAULT 1,
  `review_reason` VARCHAR(500) NOT NULL DEFAULT '',
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  `top` TINYINT NOT NULL DEFAULT 0,
  `hot` TINYINT NOT NULL DEFAULT 0,
  `photo` VARCHAR(500) NOT NULL DEFAULT '',
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `replies` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_lab_music_category_created` (`music_category_id`, `created`),
  KEY `idx_lab_music_created` (`created`),
  KEY `idx_lab_music_status_top` (`status`, `top`),
  KEY `idx_lab_music_status_created` (`status`, `created`),
  KEY `idx_lab_music_uid_status` (`uid`, `status`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `avatar` VARCHAR(500) NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `role` VARCHAR(16) NOT NULL DEFAULT 'user',
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_favorite` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` INT UNSIGNED NOT NULL,
  `music_id` INT UNSIGNED NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_favorite_uid_music` (`uid`, `music_id`),
  KEY `idx_lab_favorite_music` (`music_id`),
  KEY `idx_lab_favorite_uid_created` (`uid`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
