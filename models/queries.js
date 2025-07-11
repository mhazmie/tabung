const util = require('util');
const connection = require('../db');
const query = util.promisify(connection.query).bind(connection);

module.exports = {
    // Authentication & Users
    getUserByUsername: (username) => query('SELECT * FROM users WHERE username = ?', [username]),
    getUserById: (id) => query('SELECT * FROM users WHERE users_id = ?', [id]),
    checkUserExists: (username, nickname) => query('SELECT * FROM users WHERE username = ? OR nickname = ?', [username, nickname]),
    getAllUsers: () => query('SELECT * FROM users'),
    getAllRoles: () => query('SELECT * FROM roles'),
    insertUser: (user) => query('INSERT INTO users SET ?', user),
    updateUserWithPassword: (data) => query('UPDATE users SET username = ?, nickname = ?, password = ?, roles_id = ? WHERE users_id = ?', data),
    updateUserWithoutPassword: (data) => query('UPDATE users SET username = ?, nickname = ?, roles_id = ? WHERE users_id = ?', data),

    // Monthly Contributions
    getAllMonths: () => query('SELECT * FROM months ORDER BY month_id'),
    getMonthlyRecord: (userId, monthId) =>
        query('SELECT * FROM monthly WHERE users_id = ? AND month_id = ?', [userId, monthId]),
    insertMonthly: (data) => query('INSERT INTO monthly SET ?', data),

    // Funding & Expenses
    insertFunding: (data) => query('INSERT INTO funding SET ?', data),
    insertSpending: (data) => query('INSERT INTO expenses SET ?', data),

    // Reports
    getUserReports: () => query('SELECT * FROM user_report'),
    getFundingReports: () => query('SELECT * FROM funding'),
    getExpensesReports: () => query('SELECT * FROM expenses'),

    // Dashboard
    getTotalCollected: () => query('SELECT total_collected FROM total_collected'),
    getTotalSpent: () => query('SELECT total_spent FROM total_spent'),
    getTotalAvailable: () => query('SELECT total_available FROM total_available'),
    getMonthlyPayments: () => query('SELECT users_id, month_id FROM monthly'),

    // Home
    getNotice: () => query('SELECT * FROM notice ORDER BY notice_datetime DESC LIMIT 1'),
    upsertNotice: async (data) => {
        const count = await query('SELECT COUNT(*) AS total FROM notice');
        if (count[0].total > 0) {
            return query(`
            UPDATE notice SET 
                notice_location = ?, 
                notice_court = ?, 
                notice_players = ?, 
                notice_datetime = ?, 
                notice_duration = ?
            ORDER BY notice_id DESC
            LIMIT 1
        `, [
                data.notice_location,
                data.notice_court,
                data.notice_players,
                data.notice_datetime,
                data.notice_duration
            ]);
        } else {
            return query('INSERT INTO notice SET ?', data);
        }
    },
};