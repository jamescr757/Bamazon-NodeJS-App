DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;

USE bamazon;

CREATE TABLE IF NOT EXISTS products (
    
    item_id INTEGER NOT NULL KEY AUTO_INCREMENT,

    product_name VARCHAR(50) NOT NULL,

    department_name VARCHAR(50),

    price DECIMAL(5, 2) NOT NULL,

    stock_quantity INTEGER NOT NULL,

    product_sales DECIMAL(12, 2) NOT NULL DEFAULT 0

);

CREATE TABLE IF NOT EXISTS departments (
    
    department_id INTEGER NOT NULL KEY AUTO_INCREMENT,

    department_name VARCHAR(50),

    overhead_costs INTEGER NOT NULL

);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ("Calculator", "Office Supplies", 29.99, 30),
 ("Paper (500 PCS)", "Office Supplies", 7.99, 50),
 ("Ray Ban Sunglasses", "Apparel", 149.99, 20),
 ("Nike Black Sweatpants", "Apparel", 39.99, 40),
 ("HDMI Cable 6FT", "Electronics", 4.99, 100),
 ("HDMI Splitter", "Electronics", 19.99, 30),
 ("The Matrix DVD", "Movies", 12.99, 20),
 ("The Dark Knight DVD", "Movies", 12.99, 30),
 ("Monopoly", "Games", 24.99, 40),
 ("MotoGP 19 (PS4)", "Games", 34.99, 10);

INSERT INTO departments (department_name, overhead_costs)
VALUES ("Office Supplies", 3000),
 ("Apparel", 5000),
 ("Electronics", 4000),
 ("Movies",  2000),
 ("Games", 2000);