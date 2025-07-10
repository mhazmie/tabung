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
        res.render('error', { message: errorm });
    }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const [collected, spent, available, users, months, payments] = await Promise.all([
            db.getTotalCollected(),
            db.getTotalSpent(),
            db.getTotalAvailable(),
            db.getAllUsers(),
            db.getAllMonths(),
            db.getMonthlyPayments(),
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
        res.render('error', { message: errorm });
    }
});

router.get('/spending', isAuthenticated, isAdmin, async (req, res) => {
    const errors = req.session.error || [];
    req.session.error = null;
    try {
        const users = await db.getAllUsers();
        const months = await db.getAllMonths();
        res.render('spending', { users, months, error: errors });
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    const errors = req.session.error || [];
    req.session.error = null;
    try {
        const [users, roles] = await Promise.all([
            db.getAllUsers(),
            db.getAllRoles(),
        ]);
        res.render('admin', { users, roles, error: errors });
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.get('/api/users/:id', async (req, res) => {
    try {
        const results = await db.getUserById(req.params.id);
        if (!results.length) return res.render('error', { message: erroru });
        res.json(results[0]);
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.get('/report', isAuthenticated, async (req, res) => {
    try {
        const [user_report, funding, expenses] = await Promise.all([
            db.getUserReports(),
            db.getFundingReports(),
            db.getExpensesReports(),
        ]);
        res.render('report', { user_report, funding, expenses });
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
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
                errors.push('invalidcredu');
            } else {
                const user = results[0];
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    errors.push('invalidcredp');
                } else {
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
        const result = validationResult(req);
        const errors = [];
        if (!result.isEmpty()) {
            errors.push('invalidcredc');
        }
        const { username, nickname, password, roles_id } = req.body;
        try {
            const existing = await db.checkUserExists(username, nickname);
            if (existing.length > 0) errors.push('duplicate');

            if (errors.length > 0) {
                req.session.error = errors;
                return res.redirect('/admin');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.insertUser({ username, nickname, password: hashedPassword, roles_id });
            res.redirect('/admin');
        } catch (err) {
            res.render('error', { message: errorm });
        }
    }
);

router.post('/users/edit/:id',
    body('username').notEmpty(),
    body('nickname').notEmpty(),
    async (req, res) => {
        const { username, nickname, password, roles_id, users_id } = req.body;
        try {
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.updateUserWithPassword([username, nickname, hashedPassword, roles_id, users_id]);
            } else {
                await db.updateUserWithoutPassword([username, nickname, roles_id, users_id]);
            }
            res.redirect('/admin');
        } catch (err) {
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
        try {
            const { notice_location, notice_court, notice_players, notice_datetime, notice_duration } = req.body;
            await db.insertNotice({ notice_location, notice_court, notice_players, notice_datetime, notice_duration });
            res.redirect('/admin');
        } catch (err) {
            res.render('error', { message: errorm });
        }
    }
);

router.post('/addmonthly', async (req, res) => {
    const { users_id, month_id, monthly_amount, monthly_receipt } = req.body;
    try {
        const existing = await db.getMonthlyRecord(users_id, month_id);
        if (existing.length > 0) {
            req.session.error = ['duplicate'];
            return res.redirect('/spending');
        }
        await db.insertMonthly({ users_id, month_id, monthly_amount, monthly_receipt });
        res.redirect('/spending');
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.post('/addfunding', async (req, res) => {
    const { funding_amount, funding_desc, funding_receipt } = req.body;
    try {
        await db.insertFunding({ funding_amount, funding_description: funding_desc, funding_receipt });
        res.redirect('/spending');
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

router.post('/addspending', async (req, res) => {
    const { expenses_amount, expenses_desc, expenses_receipt } = req.body;
    try {
        await db.insertSpending({ expenses_amount, expenses_description: expenses_desc, expenses_receipt });
        res.redirect('/spending');
    } catch (err) {
        res.render('error', { message: errorm });
    }
});

module.exports = router;