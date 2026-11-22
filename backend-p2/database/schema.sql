CREATE DATABASE IF NOT EXISTS campus_save
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_save;

CREATE TABLE IF NOT EXISTS shops (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  merchant_id VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  type ENUM('Restaurant','Cafétéria','Boulangerie','Fast-food') NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone CHAR(8) NOT NULL,
  openingHours VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  category ENUM('Sandwich','Plat chaud','Salade','Pâtisserie','Boisson','Autre') NOT NULL,
  description TEXT,
  originalPrice DECIMAL(10,2) NOT NULL,
  discountPrice DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  pickupStart DATETIME NOT NULL,
  pickupEnd DATETIME NOT NULL,
  photoUrl VARCHAR(500) NOT NULL,
  status ENUM('active','inactive','sold_out') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_offers_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_offers_shop (shop_id),
  INDEX idx_offers_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(128) NOT NULL PRIMARY KEY,
  student_name VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(128) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('paid','picked_up','cancelled') NOT NULL DEFAULT 'paid',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_shop FOREIGN KEY (shop_id) REFERENCES shops(id),
  INDEX idx_orders_shop_status (shop_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  offer_id BIGINT UNSIGNED NULL,
  offer_title VARCHAR(150) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
) ENGINE=InnoDB;
