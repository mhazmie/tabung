DROP DATABASE IF EXISTS tabung;
CREATE DATABASE tabung;
USE tabung; 

CREATE TABLE users (
users_id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(255) UNIQUE NOT NULL,
nickname VARCHAR(255) NOT NULL,
total_paid INT NOT NULL,
created TIMESTAMP DEFAULT NOW()
);

CREATE TABLE months (
month_id INT AUTO_INCREMENT PRIMARY KEY,
month_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE monthly (
monthly_id INT AUTO_INCREMENT PRIMARY KEY,
users_id INT NOT NULL,
monthly_amount INT NOT NULL,
month_name VARCHAR(255) UNIQUE NOT NULL,
monthly_receipt VARCHAR(255) UNIQUE NOT NULL,
created TIMESTAMP DEFAULT NOW(),
FOREIGN KEY (users_id) REFERENCES users(users_id),
FOREIGN KEY (month_name) REFERENCES months(month_name)
);

CREATE TABLE expenses (
expenses_id INT AUTO_INCREMENT PRIMARY KEY,
expenses_amount INT NOT NULL,
expenses_description VARCHAR(255) NOT NULL,
expenses_receipt VARCHAR(255) NOT NULL,
created TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funding (
funding_id INT AUTO_INCREMENT PRIMARY KEY,
funding_description VARCHAR(255) NOT NULL,
funding_amount INT NOT NULL,
funding_receipt VARCHAR(255) NOT NULL,
created TIMESTAMP DEFAULT NOW()
);
