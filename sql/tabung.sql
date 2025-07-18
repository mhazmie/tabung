DROP DATABASE IF EXISTS tabung;
CREATE DATABASE tabung;
USE tabung; 

CREATE TABLE roles (
roles_id INT AUTO_INCREMENT PRIMARY KEY,
role_name VARCHAR(10) NOT NULL
);

CREATE TABLE users (
users_id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(255) UNIQUE NOT NULL,
nickname VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
roles_id INT NOT NULL,
created TIMESTAMP DEFAULT NOW(),
FOREIGN KEY (roles_id) REFERENCES roles(roles_id)
);

CREATE TABLE months (
month_id INT AUTO_INCREMENT PRIMARY KEY,
month_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE monthly (
monthly_id INT AUTO_INCREMENT PRIMARY KEY,
users_id INT NOT NULL,
monthly_amount INT NOT NULL,
month_id INT NOT NULL,
monthly_receipt VARCHAR(255) NOT NULL,
created TIMESTAMP DEFAULT NOW(),
FOREIGN KEY (users_id) REFERENCES users(users_id),
FOREIGN KEY (month_id) REFERENCES months(month_id)
);

CREATE TABLE expenses (
expenses_id INT AUTO_INCREMENT PRIMARY KEY,
expenses_description VARCHAR(255) NOT NULL,
expenses_amount INT NOT NULL,
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

CREATE TABLE notice (
  notice_id INT AUTO_INCREMENT PRIMARY KEY,
  notice_location VARCHAR(255) NOT NULL,
  notice_court VARCHAR(50) NOT NULL,
  notice_players VARCHAR(50) NOT NULL,
  notice_datetime DATETIME NOT NULL,
  notice_duration INT NOT NULL
);

CREATE TABLE votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  vote_name VARCHAR(255) NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified TINYINT DEFAULT 0
);

INSERT INTO months(month_name) 
VALUES 
('January'),
('February'),
('March'),
('April'),
('May'),
('June'),
('July'),
('August'),
('September'),
('October'),
('November'),
('December');

INSERT INTO roles(role_name) 
VALUES 
('user'),
('admin');

INSERT INTO users (username, nickname, password, roles_id)
VALUES (
    'admin',
    'Admin',
    '$$2b$10$0RKui8uGPtIx/9wy1mdyeO4fJCJ7q4ewRxp.vGnnenN5H/H8qiSn2',
    2
);

CREATE VIEW total_paid AS
SELECT users.users_id AS id,
users.nickname AS nickname,
SUM(monthly.monthly_amount) AS total_paid
FROM users
LEFT JOIN monthly ON users.users_id = monthly.users_id
GROUP BY users.users_id;

CREATE VIEW total_collected AS
SELECT SUM(amount) AS total_collected
FROM (
SELECT monthly.monthly_amount AS amount  FROM monthly
UNION ALL
SELECT funding.funding_amount AS amount FROM funding
) AS total_collected;

CREATE VIEW total_spent AS
SELECT SUM(expenses.expenses_amount) AS total_spent
FROM expenses;

CREATE VIEW total_available AS
SELECT 
total_collected.total_collected - total_spent.total_spent AS total_available
FROM 
total_collected 
CROSS JOIN 
total_spent;

CREATE VIEW user_report AS
SELECT 
users.username,
users.nickname,
months.month_name,
monthly.monthly_amount,
monthly.monthly_receipt,
monthly.created 
FROM 
monthly
JOIN users ON monthly.users_id = users.users_id
JOIN months ON monthly.month_id = months.month_id
ORDER BY monthly.month_id;
