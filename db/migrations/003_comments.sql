-- 003: 音频评论与评论点赞
-- 可重复执行；只新增表，不改已有列。

CREATE TABLE IF NOT EXISTS `lab_comment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `music_id` INT UNSIGNED NOT NULL,
  `uid` INT UNSIGNED NOT NULL,
  `body` VARCHAR(1000) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_comment_music_status_id` (`music_id`, `status`, `id`),
  KEY `idx_lab_comment_uid_created` (`uid`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_comment_like` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `comment_id` BIGINT UNSIGNED NOT NULL,
  `uid` INT UNSIGNED NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_comment_like_pair` (`comment_id`, `uid`),
  KEY `idx_lab_comment_like_uid` (`uid`, `created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
