const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../models/queries');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const errorm = 'Error 400 : Unable to fetch data';
const erroru = 'Error 402 : Update failed';

router.get('/login', (req, res) => {
    const errors = req.session.error || [];
    req.session.error = null;
    res.render('login', { error: errors });
});

router.get('/', async (req, res) => {
    try {
        const notice = await db.getNotice();
        res.render('home', { notice: notice[0] || {} });
    } catch (err) {
        console.error(`[HOME] Failed to fetch notice:`, err);
        res.render('error', { message: errorm });
    }
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
        res.render('error', { message: errorm });
    }
});

router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.session.user?.id;
    const errors = req.session.error || [];
    req.session.error = null;
    try {
        const [users, roles, noticeResult] = await Promise.all([
            db.getAllUsers(userId),
            db.getAllRoles(userId),
            db.getNotice(userId),
        ]);
        const notice = noticeResult?.[0] || null;
        res.render('admin', { users, roles, notice, error: errors });
    } catch (err) {
        console.error(`[ADMIN] Failed to load admin data (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/api/users/:id', async (req, res) => {
    try {
        const results = await db.getUserById(req.params.id);
        if (!results.length) {
            console.warn(`[API] User not found: ${req.params.id}`);
            return res.render('error', { message: erroru });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(`[API] Failed to fetch user:`, err);
        res.render('error', { message: errorm });
    }
});

router.get('/logout', (req, res) => {
    const userId = req.session.user?.id;
    req.session.destroy();
    console.log(`[LOGOUT] User ${userId} logged out`);
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
            const errors = [];
            if (!results.length) {
                console.warn(`[LOGIN] Invalid username: ${username}`);
                errors.push('invalidcredu');
            } else {
                const user = results[0];
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    console.warn(`[LOGIN] Invalid password for user: ${username}`);
                    errors.push('invalidcredp');
                } else {
                    console.info(`[LOGIN] User authenticated: ${username}`);
                    req.session.user = {
                        id: user.users_id,
                        username: user.username,
                        role: user.roles_id
                    };
                    req.session.error = null;
                    return res.redirect('/');
                }
            }
            req.session.error = errors;
            res.redirect('/login');
        } catch (err) {
            console.error(`[LOGIN] Error during login for ${username}:`, err);
            res.render('error', { message: errorm });
        }
    }
);

router.post('/addusers',
    body('username').notEmpty(),
    body('nickname').notEmpty(),
    body('password').isLength({ min: 3 }),
    body('roles_id').notEmpty(),
    async (req, res) => {
        const adminId = req.session.user?.id;
        const result = validationResult(req);
        const errors = [];
        if (!result.isEmpty()) {
            errors.push('invalidcredc');
        }
        const { username, nickname, password, roles_id } = req.body;
        try {
            const existing = await db.checkUserExists(username, nickname);
            if (existing.length > 0) {
                console.warn(`[ADD USER] Duplicate by admin ${adminId}: ${username}, ${nickname}`);
                errors.push('duplicate');
            }

            if (errors.length > 0) {
                req.session.error = errors;
                return res.redirect('/admin');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.insertUser({ username, nickname, password: hashedPassword, roles_id }, adminId);
            console.info(`[ADD USER] User created by admin ${adminId}: ${username}`);
            res.redirect('/admin');
        } catch (err) {
            console.error(`[ADD USER] Failed to create user (admin ${adminId}):`, err);
            res.render('error', { message: errorm });
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
            res.redirect('/admin');
        } catch (err) {
            console.error(`[EDIT USER] Failed to update user ${users_id} (admin ${adminId}):`, err);
            req.session.error = ['invalidcredc'];
            res.redirect('/admin');
        }
    }
);

router.post('/addnotice',
    body('notice_location').notEmpty(),
    body('notice_court').notEmpty(),
    body('notice_players').notEmpty(),
    body('notice_datetime').notEmpty(),
    async (req, res) => {
        const userId = req.session.user?.id;
        try {
            const { notice_location, notice_court, notice_players, notice_datetime, notice_duration } = req.body;
            await db.upsertNotice({
                notice_location,
                notice_court,
                notice_players,
                notice_datetime,
                notice_duration
            }, userId);
            console.info(`[NOTICE] Notice updated/created by user ${userId}`);
            res.redirect('/admin');
        } catch (err) {
            console.error(`[NOTICE] Failed to update/create notice (user ${userId}):`, err);
            res.render('error', { message: errorm });
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
            req.session.error = ['duplicate'];
            return res.redirect('/spending');
        }
        await db.insertMonthly({ users_id, month_id, monthly_amount, monthly_receipt }, userId);
        console.info(`[MONTHLY] Monthly payment added by user ${userId} for user ${users_id}`);
        res.redirect('/spending');
    } catch (err) {
        console.error(`[MONTHLY] Failed to insert payment (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.post('/addfunding', async (req, res) => {
    const userId = req.session.user?.id;
    const { funding_amount, funding_desc, funding_receipt } = req.body;
    try {
        await db.insertFunding({ funding_amount, funding_description: funding_desc, funding_receipt }, userId);
        console.info(`[FUNDING] Funding added by user ${userId}`);
        res.redirect('/spending');
    } catch (err) {
        console.error(`[FUNDING] Failed to insert funding (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

router.post('/addspending', async (req, res) => {
    const userId = req.session.user?.id;
    const { expenses_amount, expenses_desc, expenses_receipt } = req.body;
    try {
        await db.insertSpending({ expenses_amount, expenses_description: expenses_desc, expenses_receipt }, userId);
        console.info(`[SPENDING] Spending added by user ${userId}`);
        res.redirect('/spending');
    } catch (err) {
        console.error(`[SPENDING] Failed to insert spending (user ${userId}):`, err);
        res.render('error', { message: errorm });
    }
});

module.exports = router;