CREATE DATABASE IF NOT EXISTS `bookmyshow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bookmyshow`;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `country` VARCHAR(50) NOT NULL DEFAULT 'India',
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cities_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cinemas` (
  `id` VARCHAR(36) PRIMARY KEY,
  `city_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `amenities` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT,
  INDEX `idx_cinemas_city` (`city_id`),
  INDEX `idx_cinemas_coords` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `screens` (
  `id` VARCHAR(36) PRIMARY KEY,
  `cinema_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `screen_type` ENUM('STANDARD_2D', 'IMAX_3D', 'DOLBY_ATMOS_4K', '4DX', 'GOLD_CLASS') NOT NULL DEFAULT 'STANDARD_2D',
  `total_seats` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cinema_id`) REFERENCES `cinemas`(`id`) ON DELETE CASCADE,
  INDEX `idx_screens_cinema` (`cinema_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seats` (
  `id` VARCHAR(36) PRIMARY KEY,
  `screen_id` VARCHAR(36) NOT NULL,
  `row_label` VARCHAR(5) NOT NULL,
  `seat_number` INT NOT NULL,
  `seat_type` ENUM('RECLINER', 'PRIME', 'CLASSIC') NOT NULL DEFAULT 'CLASSIC',
  `base_price` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_screen_seat` (`screen_id`, `row_label`, `seat_number`),
  INDEX `idx_seats_screen_tier` (`screen_id`, `seat_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movies` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `duration_mins` INT NOT NULL,
  `genre` VARCHAR(80) NOT NULL,
  `rating` DECIMAL(3, 1) NOT NULL DEFAULT 8.0,
  `poster_url` VARCHAR(500) NOT NULL,
  `release_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_movies_genre_lang` (`genre`, `language`),
  INDEX `idx_movies_release` (`release_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shows` (
  `id` VARCHAR(36) PRIMARY KEY,
  `movie_id` VARCHAR(36) NOT NULL,
  `screen_id` VARCHAR(36) NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `price_multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE,
  INDEX `idx_shows_movie_time` (`movie_id`, `start_time`),
  INDEX `idx_shows_screen_time` (`screen_id`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `show_seats` (
  `id` VARCHAR(36) PRIMARY KEY,
  `show_id` VARCHAR(36) NOT NULL,
  `seat_id` VARCHAR(36) NOT NULL,
  `status` ENUM('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED') NOT NULL DEFAULT 'AVAILABLE',
  `locked_by_user_id` VARCHAR(100) NULL,
  `lock_expires_at` DATETIME NULL,
  `price` INT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_show_seat` (`show_id`, `seat_id`),
  INDEX `idx_show_seats_lookup` (`show_id`, `status`),
  INDEX `idx_show_seats_sweeper` (`status`, `lock_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(36) PRIMARY KEY,
  `booking_reference` VARCHAR(40) NOT NULL UNIQUE,
  `user_id` VARCHAR(100) NOT NULL,
  `show_id` VARCHAR(36) NOT NULL,
  `total_amount` INT NOT NULL,
  `convenience_fee` INT NOT NULL,
  `status` ENUM('INITIATED', 'CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'INITIATED',
  `idempotency_key` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON DELETE RESTRICT,
  INDEX `idx_bookings_user` (`user_id`, `created_at`),
  INDEX `idx_bookings_analytics` (`created_at`, `status`, `total_amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `booking_seats` (
  `id` VARCHAR(36) PRIMARY KEY,
  `booking_id` VARCHAR(36) NOT NULL,
  `show_seat_id` VARCHAR(36) NOT NULL,
  `price` INT NOT NULL,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`show_seat_id`) REFERENCES `show_seats`(`id`) ON DELETE RESTRICT,
  INDEX `idx_booking_seats_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `booking_id` VARCHAR(36) NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL UNIQUE,
  `gateway` ENUM('RAZORPAY', 'STRIPE', 'PAYTM', 'INTERNAL_MOCK') NOT NULL DEFAULT 'INTERNAL_MOCK',
  `amount` INT NOT NULL,
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paid_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  INDEX `idx_payments_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `partners` (
  `id` VARCHAR(36) PRIMARY KEY,
  `partner_name` VARCHAR(100) NOT NULL,
  `api_key` VARCHAR(64) NOT NULL UNIQUE,
  `api_secret_hash` VARCHAR(128) NOT NULL,
  `rate_limit_rpm` INT NOT NULL DEFAULT 120,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_partners_api_key` (`api_key`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
