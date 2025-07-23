const util = require('util');
const connection = require('../db');
const query = util.promisify(connection.query).bind(connection);
const { logToFile } = require('../logs/logger');

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
    updateUserWithPassword: async (data, userId, profile_picture = null) => {
        const [username, nickname, password, roles_id, users_id] = data;
        let sql = 'UPDATE users SET username = ?, nickname = ?, password = ?, roles_id = ?';
        const params = [username, nickname, password, roles_id];
        if (profile_picture) {
            sql += ', profile_picture = ?';
            params.push(profile_picture);
        }
        sql += ' WHERE users_id = ?';
        params.push(users_id);
        console.info(`[DB] [User ${userId}] Updating user ${users_id} (with password)`);
        logToFile(`[DB] [User ${userId}] Updating user ${users_id} (with password)`);
        return query(sql, params);
    },
    updateUserWithoutPassword: async (data, userId, profile_picture = null) => {
        const [username, nickname, roles_id, users_id] = data;
        let sql = 'UPDATE users SET username = ?, nickname = ?, roles_id = ?';
        const params = [username, nickname, roles_id];
        if (profile_picture) {
            sql += ', profile_picture = ?';
            params.push(profile_picture);
        }
        sql += ' WHERE users_id = ?';
        params.push(users_id);
        console.info(`[DB] [User ${userId}] Updating user ${users_id} (without password)`);
        logToFile(`[DB] [User ${userId}] Updating user ${users_id} (without password)`);
        return query(sql, params);
    },
    updateProfileWithPassword: async (data, profile_picture = null) => {
        const [nickname, password, users_id] = data;
        let sql = 'UPDATE users SET nickname = ?, password = ?';
        const params = [nickname, password];
        if (profile_picture) {
            sql += ', profile_picture = ?';
            params.push(profile_picture);
        }
        sql += ' WHERE users_id = ?';
        params.push(users_id);
        console.info(`[DB] [User ${users_id}] Updating own profile (with password)`);
        logToFile(`[DB] [User ${users_id}] Updating own profile (with password)`);
        return query(sql, params);
    },
    updateProfileWithoutPassword: async (data, profile_picture = null) => {
        const [nickname, users_id] = data;
        let sql = 'UPDATE users SET nickname = ?';
        const params = [nickname];
        if (profile_picture) {
            sql += ', profile_picture = ?';
            params.push(profile_picture);
        }
        sql += ' WHERE users_id = ?';
        params.push(users_id);
        console.info(`[DB] [User ${users_id}] Updating own profile (without password)`);
        logToFile(`[DB] [User ${users_id}] Updating own profile (without password)`);
        return query(sql, params);
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
                    notice_datetime = ?, 
                    notice_duration = ?
                ORDER BY notice_id DESC
                LIMIT 1
            `, [
                data.notice_location,
                data.notice_court,
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
        return query('SELECT COUNT(*) AS total FROM votes WHERE verified = 1');
    },
    getVoteNames: async () => {
        return query('SELECT vote_name FROM votes WHERE verified = 1');
    },
    verifyVote: async (voteId) => {
        console.info(`[DB] Verifying vote with ID: ${voteId}`);
        logToFile(`[DB] Verifying vote with ID: ${voteId}`);
        return query('UPDATE votes SET verified = 1 WHERE vote_id = ?', [voteId]);
    }
};