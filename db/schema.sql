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
  `status` TINYINT NOT NULL DEFAULT 1,
  `top` TINYINT NOT NULL DEFAULT 0,
  `hot` TINYINT NOT NULL DEFAULT 0,
  `photo` VARCHAR(500) NOT NULL DEFAULT '',
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `replies` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_lab_music_category_created` (`music_category_id`, `created`),
  KEY `idx_lab_music_created` (`created`),
  KEY `idx_lab_music_status_top` (`status`, `top`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `avatar` VARCHAR(500) NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
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
