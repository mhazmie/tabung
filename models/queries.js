const util = require('util');
const connection = require('../db');
const query = util.promisify(connection.query).bind(connection);
const { logToFile } = require('../logs/logger');
const { log } = require('console');

module.exports = {
    // Authentication & Users
    getUserByUsername: async (username) => {
        return query('SELECT * FROM users WHERE username = ?', [username]);
    },
    getUserById: async (id) => {
        return query('SELECT * FROM users WHERE users_id = ?', [id]);
    },
    checkUserExists: async (username, nickname) => {
        return query('SELECT * FROM users WHERE username = ? OR nickname = ?', [username, nickname]);
    },
    getAllUsers: async () => {
        return query('SELECT * FROM users');
    },
    getAllRoles: async () => {
        return query('SELECT * FROM roles');
    },
    insertUser: async (user, userId) => {
        console.info(`[DB] [User ${userId}] Inserting new user: ${user.username}`);
        logToFile(`[DB] [User ${userId}] Inserting new user: ${user.username}`);
        return query('INSERT INTO users SET ?', user);
    },
    updateUserWithPassword: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Updating user ${data[4]} (with password)`);
        logToFile(`[DB] [User ${userId}] Updating user ${data[4]} (with password)`);
        return query('UPDATE users SET username = ?, nickname = ?, password = ?, roles_id = ? WHERE users_id = ?', data);
    },
    updateUserWithoutPassword: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Updating user ${data[3]} (without password)`);
        logToFile(`[DB] [User ${userId}] Updating user ${data[3]} (without password)`);
        return query('UPDATE users SET username = ?, nickname = ?, roles_id = ? WHERE users_id = ?', data);
    },

    // Monthly Contributions
    getAllMonths: async () => {
        return query('SELECT * FROM months ORDER BY month_id');
    },
    getMonthlyRecord: async (userId, monthId) => {
        return query('SELECT * FROM monthly WHERE users_id = ? AND month_id = ?', [userId, monthId]);
    },
    insertMonthly: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Inserting monthly contribution for user: ${data.users_id}`);
        logToFile(`[DB] [User ${userId}] Inserting monthly contribution for user: ${data.users_id}`);
        return query('INSERT INTO monthly SET ?', data);
    },

    // Funding & Expenses
    insertFunding: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Inserting funding record`);
        logToFile(`[DB] [User ${userId}] Inserting funding record`);
        return query('INSERT INTO funding SET ?', data);
    },
    insertSpending: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Inserting spending record`);
        logToFile(`[DB] [User ${userId}] Inserting spending record`);
        return query('INSERT INTO expenses SET ?', data);
    },

    // Reports
    getUserReports: async () => {
        return query('SELECT * FROM user_report');
    },
    getFundingReports: async () => {
        return query('SELECT * FROM funding');
    },
    getExpensesReports: async () => {
        return query('SELECT * FROM expenses');
    },

    // Dashboard
    getTotalCollected: async () => {
        return query('SELECT total_collected FROM total_collected');
    },
    getTotalSpent: async () => {
        return query('SELECT total_spent FROM total_spent');
    },
    getTotalAvailable: async () => {
        return query('SELECT total_available FROM total_available');
    },
    getMonthlyPayments: async () => {
        return query('SELECT users_id, month_id FROM monthly');
    },

    // Home
    getNotice: async () => {
        return query('SELECT * FROM notice ORDER BY notice_datetime DESC LIMIT 1');
    },
    upsertNotice: async (data, userId) => {
        console.info(`[DB] [User ${userId}] Upserting notice...`);
        logToFile(`[DB] [User ${userId}] Upserting notice...`);
        const count = await query('SELECT COUNT(*) AS total FROM notice');
        if (count[0].total > 0) {
            console.info(`[DB] [User ${userId}] Updating existing notice`);
            logToFile(`[DB] [User ${userId}] Updating existing notice`);
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
            console.info(`[DB] [User ${userId}] Inserting new notice`);
            logToFile(`[DB] [User ${userId}] Inserting new notice`);
            return query('INSERT INTO notice SET ?', data);
        }
    },

    // Votes
    insertVote: async (name) => {
        return query('INSERT INTO votes (vote_name) VALUES (?)', [name]);
    },
    getAllVotes: async () => {
        return query('SELECT * FROM votes ORDER BY created DESC');
    },
    deleteVote: async (id) => {
        return query('DELETE FROM votes WHERE vote_id = ?', [id]);
    },
    clearVotes: async () => {
        return query('DELETE FROM votes');
    },
    getVoteCount: async () => {
        return query('SELECT COUNT(*) AS total FROM votes');
    }
};