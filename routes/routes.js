const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../models/queries');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { logToFile } = require('../logs/logger');

const errorm = 'Error 400 : Unable to fetch data';
const erroru = 'Error 402 : Update failed';

router.get('/login', (req, res) => {
    const errors = req.session.error || [];
    req.session.error = null;
    res.render('login', { error: errors });
});

router.get('/', async (req, res) => {
    const errors = req.session.error || [];
    req.session.error = null;
    try {
        const notice = await db.getNotice();
        const votecount = await db.getVoteCount();
        const voters = await db.getVoteNames();
        res.render('home', {
            notice: notice[0] || {},
            votecount: votecount[0]?.total || 0,
            voters: voters || [],
            error: errors,
        });
    } catch (err) {
        console.error(`[HOME] Failed to fetch data:`, err);
        logToFile(`[HOME] Failed to fetch data:`, err);
        res.render('error', { message: errorm });
    }
});


router.get('/vote', (req, res) => {
    res.render('vote');
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    const userId = req.session.user?.id;
    try {
        const [collected, spent, available, users, months, payments] = await Promise.all([
            db.getTotalCollected(userId),
            db.getTotalSpent(userId),
            db.getTotalAvailable(userId),
            db.getAllUsers(userId),
            db.getAllMonths(userId),
            db.getMonthlyPayments(userId),
        ]);
        res.render('dashboard', {
            collected: collected[0]?.total_collected || 0,
            spent: spent[0]?.total_spent || 0,
            available: available[0]?.total_available || 0,
            users,
            months,
            payments,
        });
    } catch (err) {
        console.error(`[DASHBOARD] Failed to retrieve data (user ${userId}):`, err);
        logToFile(`[DASHBOARD] Failed to retrieve data (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/report', isAuthenticated, async (req, res) => {
    const userId = req.session.user?.id;
    try {
        const [user_report, funding, expenses] = await Promise.all([
            db.getUserReports(userId),
            db.getFundingReports(userId),
            db.getExpensesReports(userId),
        ]);
        res.render('report', { user_report, funding, expenses });
    } catch (err) {
        console.error(`[REPORT] Failed to fetch reports (user ${userId}):`, err);
        logToFile(`[REPORT] Failed to fetch reports (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/spending', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.session.user?.id;
    const errors = req.session.error || [];
    req.session.error = null;
    try {
        const users = await db.getAllUsers(userId);
        const months = await db.getAllMonths(userId);
        res.render('spending', { users, months, error: errors });
    } catch (err) {
        console.error(`[SPENDING] Failed to load (user ${userId}):`, err);
        logToFile(`[SPENDING] Failed to load (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.session.user?.id;
    const errors = req.session.error || [];
    const votes = await db.getAllVotes();
    req.session.error = null;
    try {
        const [users, roles, noticeResult] = await Promise.all([
            db.getAllUsers(userId),
            db.getAllRoles(userId),
            db.getNotice(userId),
        ]);
        const notice = noticeResult?.[0] || null;
        const logFilePath = path.join(__dirname, '..', 'logs', 'system.log');
        let logs = '';
        if (fs.existsSync(logFilePath)) {
            const raw = fs.readFileSync(logFilePath, 'utf-8');
            const today = new Date().toISOString().slice(0, 10);
            logs = raw
                .split('\n')
                // .filter(line => line.startsWith(today))
                .filter(line => line.trim() !== '')
                .map(line => {
                    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)\s+(.*)$/);
                    if (match) {
                        const iso = match[1];
                        const msg = match[2];
                        const readable = new Date(iso).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: true,
                        });
                        return { raw: line, formatted: `${readable} — ${msg}` };
                    } else {
                        return { raw: line, formatted: line };
                    }
                });
        }
        res.render('admin', { users, roles, notice, error: errors, logs, votes });
    } catch (err) {
        console.error(`[ADMIN] Failed to load admin data (user ${userId}):`, err);
        logToFile(`[ADMIN] Failed to load admin data (user ${userId}):`, err);
        res.render('error', { message: 'Failed to load admin panel.' });
    }
});

router.get('/api/users/:id', async (req, res) => {
    try {
        const results = await db.getUserById(req.params.id);
        if (!results.length) {
            console.warn(`[API] User not found: ${req.params.id}`);
            logToFile(`[API] User not found: ${req.params.id}`);
            return res.render('error', { message: erroru });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(`[API] Failed to fetch user:`, err);
        logToFile(`[API] Failed to fetch user:`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/logout', (req, res) => {
    const userId = req.session.user?.id;
    req.session.destroy();
    console.log(`[LOGOUT] User ${userId} logged out`);
    logToFile(`[LOGOUT] User ${userId} logged out`);
    res.redirect('/');
});

router.get('/error', (req, res) => {
    res.render('error', { message: errorm });
});

router.post('/login',
    body('username').notEmpty(),
    body('password').notEmpty(),
    async (req, res) => {
        const { username, password } = req.body;
        try {
            const results = await db.getUserByUsername(username);
            if (!results.length) {
                console.warn(`[LOGIN] Invalid username: ${username}`);
                logToFile(`[LOGIN] Invalid username: ${username}`);
                req.session.error = ['invalidcredu'];
                return res.redirect('/login');
            }
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                console.warn(`[LOGIN] Invalid password for user: ${username}`);
                logToFile(`[LOGIN] Invalid password for user: ${username}`);
                req.session.error = ['invalidcredp'];
                return res.redirect('/login');
            }
            console.info(`[LOGIN] User authenticated: ${username}`);
            logToFile(`[LOGIN] User authenticated: ${username}`);
            req.session.user = {
                id: user.users_id,
                username: user.username,
                role: user.roles_id
            };
            req.session.error = ['successlogin'];
            return res.redirect('/');
        } catch (err) {
            console.error(`[LOGIN] Error during login for ${username}:`, err);
            logToFile(`[LOGIN] Error during login for ${username}:`, err);
            res.render('error', { message: errorm });
        }
    }
);

router.post('/vote', async (req, res) => {
    const { name } = req.body;
    try {
        await db.insertVote(name.trim());
        req.session.error = ['votesuccess', 'votenotify'];
        console.info(`[VOTE] User voted for: ${name}`);
        logToFile(`[VOTE] User voted for: ${name}`);
        res.redirect('/');
    } catch (err) {
        req.session.error = ['votefail'];
        console.error('[VOTE] Failed to insert vote:', err);
        logToFile('[VOTE] Failed to insert vote:', err);
        res.redirect('/');
    }
});

router.post('/admin/votes/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.session.user?.id;
    const voteId = req.params.id;
    try {
        const result = await db.deleteVote(voteId);
        if (result.affectedRows > 0) {
            req.session.error = ['votedelsuccess'];
            console.info(`[ADMIN] User ID ${userId} deleted vote ID: ${voteId}`);
            logToFile(`[ADMIN] User ID ${userId} deleted vote ID: ${voteId}`);
        } else {
            req.session.error = ['votedelfail'];
            console.warn(`[ADMIN] User ID ${userId} attempted to delete vote ID: ${voteId} (not found)`);
            logToFile(`[ADMIN] User ID ${userId} attempted to delete vote ID: ${voteId} (not found)`);
        }
    } catch (err) {
        req.session.error = ['dberror'];
        console.error(`[ADMIN] User ID ${userId} error deleting vote ID: ${voteId}`, err);
        logToFile(`[ADMIN] User ID ${userId} error deleting vote ID: ${voteId}`, err);
    }
    res.redirect('/admin');
});

router.post('/admin/votes/clear', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.session.user?.id;
    try {
        const result = await db.clearVotes();
        if (result.affectedRows > 0) {
            req.session.error = ['voteclearsuccess'];
            console.info(`[ADMIN] User ID ${userId} cleared all votes`);
            logToFile(`[ADMIN] User ID ${userId} cleared all votes`);
        } else {
            req.session.error = ['voteclearfail'];
            console.warn(`[ADMIN] User ID ${userId} attempted to clear votes, but no votes existed`);
            logToFile(`[ADMIN] User ID ${userId} attempted to clear votes, but no votes existed`);
        }
    } catch (err) {
        req.session.error = ['dberror'];
        console.error(`[ADMIN] User ID ${userId} error clearing votes:`, err);
        logToFile(`[ADMIN] User ID ${userId} error clearing votes:`, err);
    }
    res.redirect('/admin');
});

router.post('/admin/votes/verify/:id', async (req, res) => {
    const voteId = req.params.id;
    const userId = req.session.user?.id;
    try {
        await db.verifyVote(voteId);
        console.info(`[ADMIN] Vote ID ${voteId} verified by user ${userId}`);
        logToFile(`[ADMIN] Vote ID ${voteId} verified by user ${userId}`);
        req.session.error = ['verifysuccess'];
    } catch (err) {
        console.error(`[ADMIN] Vote ID ${voteId} failed to be verified by user ${userId}:`, err);
        logToFile(`[ADMIN] Vote ID ${voteId} failed to be verified by user ${userId}:`, err);
        req.session.error = ['verifyfail'];
    }
    res.redirect('/admin');
});

router.post('/addusers',
    body('username').notEmpty(),
    body('nickname').notEmpty(),
    body('password').isLength({ min: 3 }),
    body('roles_id').notEmpty(),
    async (req, res) => {
        const adminId = req.session.user?.id;
        const result = validationResult(req);
        if (!result.isEmpty()) {
            req.session.error = ['invalidcredc'];
            return res.redirect('/admin');
        }
        const { username, nickname, password, roles_id } = req.body;
        try {
            const existing = await db.checkUserExists(username, nickname);
            if (existing.length > 0) {
                console.warn(`[ADD USER] Duplicate by admin ${adminId}: ${username}, ${nickname}`);
                logToFile(`[ADD USER] Duplicate by admin ${adminId}: ${username}, ${nickname}`);
                req.session.error = ['duplicate'];
                return res.redirect('/admin');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.insertUser({ username, nickname, password: hashedPassword, roles_id }, adminId);
            console.info(`[ADD USER] User created by admin ${adminId}: ${username}`);
            logToFile(`[ADD USER] User created by admin ${adminId}: ${username}`);
            req.session.error = ['useraddsuccess'];
            return res.redirect('/admin');
        } catch (err) {
            console.error(`[ADD USER] Failed to create user (admin ${adminId}):`, err);
            logToFile(`[ADD USER] Failed to create user (admin ${adminId}):`, err);
            req.session.error = ['useraddfail'];
            return res.redirect('/admin');
        }
    }
);

router.post('/users/edit/:id',
    body('username').notEmpty(),
    body('nickname').notEmpty(),
    async (req, res) => {
        const adminId = req.session.user?.id;
        const { username, nickname, password, roles_id, users_id } = req.body;
        try {
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.updateUserWithPassword([username, nickname, hashedPassword, roles_id, users_id], adminId);
            } else {
                await db.updateUserWithoutPassword([username, nickname, roles_id, users_id], adminId);
            }
            console.info(`[EDIT USER] User ${users_id} updated by admin ${adminId}`);
            logToFile(`[EDIT USER] User ${users_id} updated by admin ${adminId}`);
            req.session.error = ['usereditsuccess'];
            return res.redirect('/admin');
        } catch (err) {
            console.error(`[EDIT USER] Failed to update user ${users_id} (admin ${adminId}):`, err);
            logToFile(`[EDIT USER] Failed to update user ${users_id} (admin ${adminId}):`, err);
            req.session.error = ['usereditfail'];
            return res.redirect('/admin');
        }
    }
);

router.post('/addnotice',
    body('notice_location').notEmpty(),
    body('notice_court').notEmpty(),
    body('notice_datetime').notEmpty(),
    async (req, res) => {
        const userId = req.session.user?.id;
        try {
            const { notice_location, notice_court, notice_datetime, notice_duration } = req.body;
            await db.upsertNotice({
                notice_location,
                notice_court,
                notice_datetime,
                notice_duration
            }, userId);
            console.info(`[NOTICE] Notice updated/created by user ${userId}`);
            logToFile(`[NOTICE] Notice updated/created by user ${userId}`);
            req.session.error = ['noticesuccess'];
            res.redirect('/admin');
        } catch (err) {
            console.error(`[NOTICE] Failed to update/create notice (user ${userId}):`, err);
            logToFile(`[NOTICE] Failed to update/create notice (user ${userId}):`, err);
            req.session.error = ['noticefail'];
            res.redirect('/admin');
        }
    }
);

router.post('/addmonthly', async (req, res) => {
    const userId = req.session.user?.id;
    const { users_id, month_id, monthly_amount, monthly_receipt } = req.body;
    try {
        const existing = await db.getMonthlyRecord(users_id, month_id);
        if (existing.length > 0) {
            console.warn(`[MONTHLY] Duplicate entry by user ${userId} for user ${users_id}`);
            logToFile(`[MONTHLY] Duplicate entry by user ${userId} for user ${users_id}`);
            req.session.error = ['monthlyduplicate'];
            return res.redirect('/spending');
        }
        await db.insertMonthly({ users_id, month_id, monthly_amount, monthly_receipt }, userId);
        console.info(`[MONTHLY] Monthly payment added by user ${userId} for user ${users_id}`);
        logToFile(`[MONTHLY] Monthly payment added by user ${userId} for user ${users_id}`);
        req.session.error = ['monthlysuccess'];
        return res.redirect('/spending');
    } catch (err) {
        console.error(`[MONTHLY] Failed to insert payment (user ${userId}):`, err);
        logToFile(`[MONTHLY] Failed to insert payment (user ${userId}):`, err);
        req.session.error = ['monthlyfail'];
        return res.redirect('/spending');
    }
});

router.post('/addfunding', async (req, res) => {
    const userId = req.session.user?.id;
    const { funding_amount, funding_desc, funding_receipt } = req.body;
    try {
        await db.insertFunding({ funding_amount, funding_description: funding_desc, funding_receipt }, userId);
        console.info(`[FUNDING] Funding added by user ${userId}`);
        logToFile(`[FUNDING] Funding added by user ${userId}`);
        req.session.error = ['fundingsuccess'];
        return res.redirect('/spending');
    } catch (err) {
        console.error(`[FUNDING] Failed to insert funding (user ${userId}):`, err);
        logToFile(`[FUNDING] Failed to insert funding (user ${userId}):`, err);
        req.session.error = ['fundingfail'];
        return res.redirect('/spending');
    }
});

router.post('/addspending', async (req, res) => {
    const userId = req.session.user?.id;
    const { expenses_amount, expenses_desc, expenses_receipt } = req.body;
    try {
        await db.insertSpending({ expenses_amount, expenses_description: expenses_desc, expenses_receipt }, userId);
        console.info(`[SPENDING] Spending added by user ${userId}`);
        logToFile(`[SPENDING] Spending added by user ${userId}`);
        req.session.error = ['spendingsuccess'];
        return res.redirect('/spending');
    } catch (err) {
        console.error(`[SPENDING] Failed to insert spending (user ${userId}):`, err);
        logToFile(`[SPENDING] Failed to insert spending (user ${userId}):`, err);
        req.session.error = ['spendingfail'];
        return res.redirect('/spending');
    }
});

module.exports = router;