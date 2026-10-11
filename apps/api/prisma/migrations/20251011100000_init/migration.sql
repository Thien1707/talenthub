-- CreateTable
CREATE TABLE `users` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_asset_id` BIGINT NULL,
    `role` ENUM('STUDENT', 'COMPANY', 'STAFF', 'SUPER_ADMIN') NOT NULL,
    `status` ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'PENDING',
    `email_verified_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `refresh_token_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`refresh_token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_profiles` (
    `student_profile_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `education_level` VARCHAR(100) NULL,
    `school_name` VARCHAR(255) NULL,
    `major` VARCHAR(150) NULL,
    `graduation_year` SMALLINT NULL,
    `experience_years` DECIMAL(4, 1) NULL,
    `bio` TEXT NULL,
    `linkedin_url` VARCHAR(500) NULL,
    `portfolio_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`student_profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_profiles` (
    `company_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `tax_code` VARCHAR(50) NULL,
    `industry` VARCHAR(150) NULL,
    `company_size` VARCHAR(50) NULL,
    `website` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `logo_asset_id` BIGINT NULL,
    `verification_status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `verified_by` BIGINT NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_profiles` (
    `staff_profile_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `department` VARCHAR(100) NULL,
    `position` VARCHAR(100) NULL,
    `hired_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `staff_profiles_employee_code_key`(`employee_code`),
    PRIMARY KEY (`staff_profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `category_id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `parent_category_id` BIGINT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_category_name_key`(`category_name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `job_id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(300) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `requirements` LONGTEXT NOT NULL,
    `benefits` LONGTEXT NULL,
    `location` VARCHAR(255) NOT NULL,
    `salary_min` DECIMAL(15, 2) NULL,
    `salary_max` DECIMAL(15, 2) NULL,
    `salary_currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `employment_type` ENUM('FULL_TIME') NOT NULL DEFAULT 'FULL_TIME',
    `experience_level` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `job_type` ENUM('NORMAL', 'VIP') NOT NULL DEFAULT 'NORMAL',
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'CLOSED', 'EXPIRED', 'REMOVED') NOT NULL DEFAULT 'DRAFT',
    `is_paid` BOOLEAN NOT NULL DEFAULT false,
    `quota_consumed` BOOLEAN NOT NULL DEFAULT false,
    `moderated_by` BIGINT NULL,
    `moderated_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `jobs_slug_key`(`slug`),
    INDEX `jobs_status_job_type_published_at_idx`(`status`, `job_type`, `published_at`),
    INDEX `jobs_company_id_idx`(`company_id`),
    INDEX `jobs_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_status_history` (
    `history_id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT NOT NULL,
    `old_status` VARCHAR(30) NULL,
    `new_status` VARCHAR(30) NOT NULL,
    `changed_by` BIGINT NOT NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_status_history_job_id_idx`(`job_id`),
    PRIMARY KEY (`history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `application_id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT NOT NULL,
    `student_user_id` BIGINT NOT NULL,
    `cv_version_id` BIGINT NOT NULL,
    `cover_letter` TEXT NULL,
    `status` ENUM('SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `applications_student_user_id_idx`(`student_user_id`),
    UNIQUE INDEX `applications_job_id_student_user_id_key`(`job_id`, `student_user_id`),
    PRIMARY KEY (`application_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_jobs` (
    `saved_job_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_user_id` BIGINT NOT NULL,
    `job_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `saved_jobs_student_user_id_job_id_key`(`student_user_id`, `job_id`),
    PRIMARY KEY (`saved_job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv_templates` (
    `template_id` BIGINT NOT NULL AUTO_INCREMENT,
    `template_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `preview_asset_id` BIGINT NULL,
    `template_config` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cvs` (
    `cv_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_user_id` BIGINT NOT NULL,
    `template_id` BIGINT NULL,
    `cv_name` VARCHAR(200) NOT NULL,
    `current_version_id` BIGINT NULL,
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `cvs_current_version_id_key`(`current_version_id`),
    INDEX `cvs_student_user_id_idx`(`student_user_id`),
    PRIMARY KEY (`cv_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv_versions` (
    `cv_version_id` BIGINT NOT NULL AUTO_INCREMENT,
    `cv_id` BIGINT NOT NULL,
    `version_number` INTEGER NOT NULL,
    `source_type` ENUM('BUILDER', 'UPLOAD') NOT NULL,
    `content_json` JSON NULL,
    `file_asset_id` BIGINT NULL,
    `plain_text_content` LONGTEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cv_versions_cv_id_version_number_key`(`cv_id`, `version_number`),
    PRIMARY KEY (`cv_version_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv_ai_analyses` (
    `analysis_id` BIGINT NOT NULL AUTO_INCREMENT,
    `cv_version_id` BIGINT NOT NULL,
    `job_id` BIGINT NULL,
    `requested_by` BIGINT NOT NULL,
    `analysis_type` ENUM('GENERAL', 'JOB_MATCH') NOT NULL,
    `model_provider` VARCHAR(50) NOT NULL DEFAULT 'GEMINI',
    `model_name` VARCHAR(100) NULL,
    `score` DECIMAL(5, 2) NULL,
    `skill_match_score` DECIMAL(5, 2) NULL,
    `experience_match_score` DECIMAL(5, 2) NULL,
    `education_match_score` DECIMAL(5, 2) NULL,
    `strengths` JSON NULL,
    `weaknesses` JSON NULL,
    `recommendations` JSON NULL,
    `analysis_result` JSON NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `cv_ai_analyses_cv_version_id_idx`(`cv_version_id`),
    INDEX `cv_ai_analyses_requested_by_idx`(`requested_by`),
    PRIMARY KEY (`analysis_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_plans` (
    `plan_id` BIGINT NOT NULL AUTO_INCREMENT,
    `plan_name` VARCHAR(150) NOT NULL,
    `plan_type` ENUM('NORMAL_POST', 'VIP_POST', 'PACKAGE') NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `duration_days` INTEGER NULL,
    `included_posts` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `effective_from` DATETIME(3) NULL,
    `effective_to` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`plan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `order_id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(50) NOT NULL,
    `company_id` BIGINT NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paid_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    INDEX `orders_company_id_status_idx`(`company_id`, `status`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `order_item_id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `plan_id` BIGINT NULL,
    `job_id` BIGINT NULL,
    `item_type` ENUM('NORMAL_POST', 'VIP_UPGRADE', 'PACKAGE') NOT NULL,
    `item_name` VARCHAR(200) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`order_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `payment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `provider` VARCHAR(30) NOT NULL DEFAULT 'VNPAY',
    `provider_transaction_no` VARCHAR(100) NULL,
    `vnp_txn_ref` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `status` ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'INITIATED',
    `response_code` VARCHAR(20) NULL,
    `response_message` VARCHAR(500) NULL,
    `payment_method` VARCHAR(50) NULL,
    `request_data` JSON NULL,
    `response_data` JSON NULL,
    `verified_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_transactions_vnp_txn_ref_key`(`vnp_txn_ref`),
    INDEX `payment_transactions_order_id_idx`(`order_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_posting_quotas` (
    `quota_id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `free_post_limit` INTEGER NOT NULL DEFAULT 3,
    `free_post_used` INTEGER NOT NULL DEFAULT 0,
    `paid_post_count` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_posting_quotas_company_id_key`(`company_id`),
    PRIMARY KEY (`quota_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `asset_id` BIGINT NOT NULL AUTO_INCREMENT,
    `owner_user_id` BIGINT NOT NULL,
    `asset_type` ENUM('AVATAR', 'COMPANY_LOGO', 'CV', 'CV_PREVIEW', 'CHAT_ATTACHMENT', 'OTHER') NOT NULL,
    `provider` VARCHAR(30) NOT NULL DEFAULT 'CLOUDINARY',
    `public_id` VARCHAR(255) NOT NULL,
    `resource_type` VARCHAR(30) NOT NULL,
    `secure_url` VARCHAR(1000) NOT NULL,
    `original_filename` VARCHAR(255) NULL,
    `mime_type` VARCHAR(100) NULL,
    `file_size` BIGINT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `status` ENUM('ACTIVE', 'DELETED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `media_assets_public_id_key`(`public_id`),
    INDEX `media_assets_owner_user_id_asset_type_idx`(`owner_user_id`, `asset_type`),
    PRIMARY KEY (`asset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `conversation_id` BIGINT NOT NULL AUTO_INCREMENT,
    `conversation_type` ENUM('DIRECT', 'APPLICATION') NOT NULL,
    `application_id` BIGINT NULL,
    `created_by` BIGINT NOT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`conversation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_members` (
    `conversation_member_id` BIGINT NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_read_at` DATETIME(3) NULL,
    `is_muted` BOOLEAN NOT NULL DEFAULT false,
    `left_at` DATETIME(3) NULL,

    UNIQUE INDEX `conversation_members_conversation_id_user_id_key`(`conversation_id`, `user_id`),
    PRIMARY KEY (`conversation_member_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `message_id` BIGINT NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT NOT NULL,
    `sender_user_id` BIGINT NOT NULL,
    `message_type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NULL,
    `asset_id` BIGINT NULL,
    `reply_to_message_id` BIGINT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `edited_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `messages_conversation_id_sent_at_idx`(`conversation_id`, `sent_at`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `notification_type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` BIGINT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `review_id` BIGINT NOT NULL AUTO_INCREMENT,
    `reviewer_user_id` BIGINT NOT NULL,
    `reviewed_user_id` BIGINT NOT NULL,
    `application_id` BIGINT NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `status` ENUM('PENDING', 'PUBLISHED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
    `moderated_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`review_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_reports` (
    `report_id` BIGINT NOT NULL AUTO_INCREMENT,
    `reporter_user_id` BIGINT NOT NULL,
    `reported_user_id` BIGINT NULL,
    `job_id` BIGINT NULL,
    `message_id` BIGINT NULL,
    `report_type` VARCHAR(100) NOT NULL,
    `reason` TEXT NOT NULL,
    `evidence_asset_id` BIGINT NULL,
    `status` ENUM('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `assigned_staff_id` BIGINT NULL,
    `resolution_note` TEXT NULL,
    `resolved_by` BIGINT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_reports_status_idx`(`status`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moderation_logs` (
    `moderation_log_id` BIGINT NOT NULL AUTO_INCREMENT,
    `actor_id` BIGINT NOT NULL,
    `target_type` ENUM('JOB', 'COMPANY', 'USER', 'REVIEW', 'REPORT', 'MESSAGE') NOT NULL,
    `target_id` BIGINT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `reason` TEXT NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `moderation_logs_target_type_target_id_idx`(`target_type`, `target_id`),
    PRIMARY KEY (`moderation_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `expense_id` BIGINT NOT NULL AUTO_INCREMENT,
    `expense_code` VARCHAR(50) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `expense_date` DATE NOT NULL,
    `vendor_name` VARCHAR(255) NULL,
    `receipt_asset_id` BIGINT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'DRAFT',
    `created_by` BIGINT NOT NULL,
    `approved_by` BIGINT NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `expenses_expense_code_key`(`expense_code`),
    PRIMARY KEY (`expense_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `audit_log_id` BIGINT NOT NULL AUTO_INCREMENT,
    `actor_id` BIGINT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`audit_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_avatar_asset_id_fkey` FOREIGN KEY (`avatar_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_profiles` ADD CONSTRAINT `company_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_profiles` ADD CONSTRAINT `company_profiles_logo_asset_id_fkey` FOREIGN KEY (`logo_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_profiles` ADD CONSTRAINT `company_profiles_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_category_id_fkey` FOREIGN KEY (`parent_category_id`) REFERENCES `categories`(`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_moderated_by_fkey` FOREIGN KEY (`moderated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_status_history` ADD CONSTRAINT `job_status_history_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_status_history` ADD CONSTRAINT `job_status_history_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_cv_version_id_fkey` FOREIGN KEY (`cv_version_id`) REFERENCES `cv_versions`(`cv_version_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_templates` ADD CONSTRAINT `cv_templates_preview_asset_id_fkey` FOREIGN KEY (`preview_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cvs` ADD CONSTRAINT `cvs_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cvs` ADD CONSTRAINT `cvs_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `cv_templates`(`template_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cvs` ADD CONSTRAINT `cvs_current_version_id_fkey` FOREIGN KEY (`current_version_id`) REFERENCES `cv_versions`(`cv_version_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_versions` ADD CONSTRAINT `cv_versions_cv_id_fkey` FOREIGN KEY (`cv_id`) REFERENCES `cvs`(`cv_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_versions` ADD CONSTRAINT `cv_versions_file_asset_id_fkey` FOREIGN KEY (`file_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_versions` ADD CONSTRAINT `cv_versions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_ai_analyses` ADD CONSTRAINT `cv_ai_analyses_cv_version_id_fkey` FOREIGN KEY (`cv_version_id`) REFERENCES `cv_versions`(`cv_version_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_ai_analyses` ADD CONSTRAINT `cv_ai_analyses_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_ai_analyses` ADD CONSTRAINT `cv_ai_analyses_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `pricing_plans`(`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_posting_quotas` ADD CONSTRAINT `company_posting_quotas_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company_profiles`(`company_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications`(`application_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`conversation_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`conversation_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_reply_to_message_id_fkey` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages`(`message_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewer_user_id_fkey` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewed_user_id_fkey` FOREIGN KEY (`reviewed_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications`(`application_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_moderated_by_fkey` FOREIGN KEY (`moderated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reporter_user_id_fkey` FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reported_user_id_fkey` FOREIGN KEY (`reported_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`message_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_evidence_asset_id_fkey` FOREIGN KEY (`evidence_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_assigned_staff_id_fkey` FOREIGN KEY (`assigned_staff_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_resolved_by_fkey` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moderation_logs` ADD CONSTRAINT `moderation_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_receipt_asset_id_fkey` FOREIGN KEY (`receipt_asset_id`) REFERENCES `media_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

