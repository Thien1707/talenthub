-- Wallet, posting fee config, promotions, job publish idempotency

ALTER TABLE `jobs`
  ADD COLUMN `promotion_top_until` DATETIME(3) NULL,
  ADD COLUMN `highlight_until` DATETIME(3) NULL,
  ADD COLUMN `featured_until` DATETIME(3) NULL;

CREATE INDEX `jobs_promotion_top_until_idx` ON `jobs`(`promotion_top_until`);

CREATE TABLE `posting_fee_config` (
  `config_id` BIGINT NOT NULL AUTO_INCREMENT,
  `base_post_fee_vnd` INT NOT NULL DEFAULT 5000,
  `free_post_allowance` INT NOT NULL DEFAULT 3,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`config_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `posting_fee_config` (`base_post_fee_vnd`, `free_post_allowance`, `updated_at`)
VALUES (5000, 3, NOW(3));

CREATE TABLE `promotion_feature_definitions` (
  `feature_id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` ENUM('TOP_LISTING', 'HIGHLIGHT', 'FEATURED') NOT NULL,
  `display_name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price_vnd` INT NOT NULL,
  `duration_days` INT NOT NULL DEFAULT 7,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `promotion_feature_definitions_code_key`(`code`),
  PRIMARY KEY (`feature_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `promotion_feature_definitions`
  (`code`, `display_name`, `description`, `price_vnd`, `duration_days`, `is_active`, `sort_order`, `updated_at`)
VALUES
  ('TOP_LISTING', 'Đẩy tin lên đầu', 'Tin xuất hiện ưu tiên trên danh sách việc làm', 10000, 7, true, 1, NOW(3)),
  ('HIGHLIGHT', 'Làm nổi bật tin', 'Hiển thị nhãn nổi bật trên tin tuyển dụng', 5000, 7, true, 2, NOW(3)),
  ('FEATURED', 'Tin nổi bật trang chủ', 'Ưu tiên hiển thị ở khu vực tin nổi bật', 15000, 7, true, 3, NOW(3));

CREATE TABLE `company_wallets` (
  `wallet_id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL,
  `balance_vnd` BIGINT NOT NULL DEFAULT 0,
  `version` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `company_wallets_company_id_key`(`company_id`),
  PRIMARY KEY (`wallet_id`),
  CONSTRAINT `company_wallets_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `company_wallets` (`company_id`, `balance_vnd`, `version`, `updated_at`)
SELECT `company_id`, 100000, 0, NOW(3) FROM `company_profiles`;

CREATE TABLE `wallet_transactions` (
  `transaction_id` BIGINT NOT NULL AUTO_INCREMENT,
  `wallet_id` BIGINT NOT NULL,
  `company_id` BIGINT NOT NULL,
  `job_id` BIGINT NULL,
  `type` ENUM('DEPOSIT', 'JOB_PUBLISH', 'REFUND', 'ADJUSTMENT') NOT NULL,
  `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `amount_vnd` BIGINT NOT NULL,
  `balance_after_vnd` BIGINT NOT NULL,
  `idempotency_key` VARCHAR(64) NULL,
  `description` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) NULL,
  UNIQUE INDEX `wallet_transactions_idempotency_key_key`(`idempotency_key`),
  INDEX `wallet_transactions_company_id_created_at_idx`(`company_id`, `created_at`),
  INDEX `wallet_transactions_wallet_id_idx`(`wallet_id`),
  PRIMARY KEY (`transaction_id`),
  CONSTRAINT `wallet_transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `company_wallets`(`wallet_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `wallet_transactions_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `wallet_transactions_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wallet_transaction_lines` (
  `line_id` BIGINT NOT NULL AUTO_INCREMENT,
  `transaction_id` BIGINT NOT NULL,
  `label` VARCHAR(200) NOT NULL,
  `amount_vnd` INT NOT NULL,
  `feature_code` ENUM('TOP_LISTING', 'HIGHLIGHT', 'FEATURED') NULL,
  PRIMARY KEY (`line_id`),
  CONSTRAINT `wallet_transaction_lines_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `wallet_transactions`(`transaction_id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `job_promotions` (
  `job_promotion_id` BIGINT NOT NULL AUTO_INCREMENT,
  `job_id` BIGINT NOT NULL,
  `feature_id` BIGINT NOT NULL,
  `code` ENUM('TOP_LISTING', 'HIGHLIGHT', 'FEATURED') NOT NULL,
  `price_vnd` INT NOT NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `job_promotions_job_id_idx`(`job_id`),
  INDEX `job_promotions_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`job_promotion_id`),
  CONSTRAINT `job_promotions_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_promotions_feature_id_fkey` FOREIGN KEY (`feature_id`) REFERENCES `promotion_feature_definitions`(`feature_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `job_publish_requests` (
  `request_id` BIGINT NOT NULL AUTO_INCREMENT,
  `idempotency_key` VARCHAR(64) NOT NULL,
  `job_id` BIGINT NOT NULL,
  `company_id` BIGINT NOT NULL,
  `status` ENUM('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
  `wallet_transaction_id` BIGINT NULL,
  `total_vnd` INT NOT NULL DEFAULT 0,
  `response` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) NULL,
  UNIQUE INDEX `job_publish_requests_idempotency_key_key`(`idempotency_key`),
  UNIQUE INDEX `job_publish_requests_wallet_transaction_id_key`(`wallet_transaction_id`),
  INDEX `job_publish_requests_job_id_idx`(`job_id`),
  PRIMARY KEY (`request_id`),
  CONSTRAINT `job_publish_requests_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_publish_requests_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `job_publish_requests_wallet_transaction_id_fkey` FOREIGN KEY (`wallet_transaction_id`) REFERENCES `wallet_transactions`(`transaction_id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
