-- =====================================================
-- Wedding Gift Manager - MySQL Database Schema
-- =====================================================
-- Compatible with MySQL 8.0+
-- Note: MySQL does not support Row-Level Security (RLS)
-- like PostgreSQL. Access control must be enforced in
-- your application layer (filter by admin_id = current user).
-- =====================================================

CREATE DATABASE IF NOT EXISTS wedding_gift_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wedding_gift_manager;

-- =====================================================
-- Drop tables (in reverse dependency order) for clean reinstall
-- =====================================================
DROP TABLE IF EXISTS guest_entries;
DROP TABLE IF EXISTS weddings;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- =====================================================
-- USERS TABLE
-- Replaces Supabase's built-in auth.users table.
-- Store hashed passwords only (e.g., bcrypt/argon2).
-- =====================================================
CREATE TABLE users (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  email           VARCHAR(255)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  email_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- =====================================================
-- PROFILES TABLE
-- Extra user info (linked 1:1 to users).
-- =====================================================
CREATE TABLE profiles (
  id          CHAR(36)      NOT NULL,            -- same as users.id
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  phone       VARCHAR(50)   DEFAULT NULL,
  dob         DATE          DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- WEDDINGS TABLE
-- Each wedding is owned by an admin (a user).
-- =====================================================
CREATE TABLE weddings (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  admin_id    CHAR(36)      NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  event_date  DATE          DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_weddings_admin (admin_id),
  CONSTRAINT fk_weddings_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- GUEST ENTRIES TABLE
-- Tracks each guest and their gift (money or physical).
-- =====================================================
CREATE TABLE guest_entries (
  id                CHAR(36)                NOT NULL DEFAULT (UUID()),
  wedding_id        CHAR(36)                NOT NULL,
  admin_id          CHAR(36)                NOT NULL,
  guest_name        VARCHAR(255)            NOT NULL,
  type              ENUM('money','gift')    NOT NULL,
  amount            DECIMAL(12,2)           DEFAULT NULL,
  gift_description  TEXT                    DEFAULT NULL,
  address           TEXT                    DEFAULT NULL,
  created_at        TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_guest_entries_wedding (wedding_id),
  KEY idx_guest_entries_admin (admin_id),
  KEY idx_guest_entries_type (type),
  CONSTRAINT fk_guest_entries_wedding
    FOREIGN KEY (wedding_id) REFERENCES weddings(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_guest_entries_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TRIGGER: auto-create profile + default wedding on signup
-- Mirrors the Supabase handle_new_user() function.
-- =====================================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_users_after_insert$$
CREATE TRIGGER trg_users_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  -- Create profile row
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    SUBSTRING_INDEX(NEW.email, '@', 1),
    NEW.email
  );

  -- Create a default wedding owned by this user
  INSERT INTO weddings (id, admin_id, name)
  VALUES (UUID(), NEW.id, 'My Wedding');
END$$

DELIMITER ;

-- =====================================================
-- SAMPLE QUERIES (application must filter by admin_id)
-- =====================================================
-- All weddings for the logged-in admin:
--   SELECT * FROM weddings WHERE admin_id = ?;
--
-- All guest entries for one wedding (with ownership check):
--   SELECT * FROM guest_entries
--   WHERE wedding_id = ? AND admin_id = ?;
--
-- Total money received per wedding:
--   SELECT wedding_id, SUM(amount) AS total_money
--   FROM guest_entries
--   WHERE admin_id = ? AND type = 'money'
--   GROUP BY wedding_id;
-- =====================================================
