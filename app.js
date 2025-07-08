const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./db');
const bcrypt = require('bcrypt');
const port = 5000;
const domain = 'http://localhost:';

const errorm = 'Error 400 : Unable to fetch data';
const erroru = 'Error 402 : Update failed';
const errorr = 'Error 403 : Access denied';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
var session = require('express-session');
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.listen(port, function () {
  console.log('Server is running on', domain, port);
});

app.get('/login', (req, res) => {
  var error = req.query.error || null;
  res.render('login', { error });
});

app.get('/', function (req, res) {
  var collectedquery = 'SELECT total_collected FROM total_collected';
  var spentquery = 'SELECT total_spent FROM total_spent';
  var availablequery = 'SELECT total_available FROM total_available';
  var userquery = 'SELECT * FROM users';
  var monthquery = 'SELECT * FROM months ORDER BY month_id';
  var paymentquery = 'SELECT users_id, month_id FROM monthly';
  connection.query(collectedquery, function (error, collectedresult) {
    if (error) return res.render('error', { message: errorm });
    connection.query(spentquery, function (error, spentresult) {
      if (error) return res.render('error', { message: errorm });
      connection.query(availablequery, function (error, availableresult) {
        if (error) return res.render('error', { message: errorm });
        connection.query(userquery, function (error, users) {
          if (error) return res.render('error', { message: errorm });
          connection.query(monthquery, function (error, months) {
            if (error) return res.render('error', { message: errorm });
            connection.query(paymentquery, function (error, payments) {
              if (error) return res.render('error', { message: errorm });
              res.render('home', {
                collected: (collectedresult && collectedresult.length > 0) ? collectedresult[0].total_collected : 0,
                spent: (spentresult && spentresult.length > 0) ? spentresult[0].total_spent : 0,
                available: (availableresult && availableresult.length > 0) ? availableresult[0].total_available : 0,
                users: users,
                months: months,
                payments: payments
              });
            });
          });
        });
      });
    });
  });
});

app.get('/spending', isAuthenticated, isAdmin, function (req, res) {
  var usersquery = 'SELECT * FROM users';
  var monthsquery = 'SELECT * FROM months ORDER BY month_id';
  var perror = req.query.error;
  connection.query(usersquery, function (error, users) {
    if (error) return res.render('error', { message: errorm });
    connection.query(monthsquery, function (error, months) {
      if (error) return res.render('error', { message: errorm });
      res.render('spending', {
        users: users,
        months: months,
        error: perror
      });
    });
  });
})

app.get('/user', isAuthenticated, isAdmin, (req, res) => {
  // app.get('/user', (req, res) => {
  var perror = req.query.error;
  var userquery = 'SELECT * FROM users';
  var rolesquery = 'SELECT * FROM roles';
  connection.query(userquery, (error, userresults) => {
    if (error) return res.render('error', { message: errorm });
    connection.query(rolesquery, (error, roleresults) => {
      if (error) return res.render('error', { message: errorm });
      res.render('user_management', {
        users: userresults,
        roles: roleresults,
        error: perror
      });
    });
  });
});

app.get('/api/users/:id', (req, res) => {
  var userId = req.params.id;
  connection.query('SELECT * FROM users WHERE users_id = ?', [userId], (error, results) => {
    if (error) return res.render(error, { errorm });
    if (results.length === 0) return res.render(error, { erroru });
    res.json(results[0]);
  });
});

app.get('/report', isAuthenticated, (req, res) => {
  var usersquery = 'SELECT * FROM user_report';
  var fundquery = 'SELECT * FROM funding';
  var spendingquery = 'SELECT * FROM expenses';
  connection.query(usersquery, (error, user_report) => {
    if (error) return res.render('error', { message: errorm });
    connection.query(fundquery, (error, funding) => {
      if (error) return res.render('error', { message: errorm });
      connection.query(spendingquery, (error, expenses) => {
        if (error) return res.render('error', { message: errorm });
        res.render('report', { user_report, funding, expenses });
      });
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/error', function (req, res) {
  res.render('error', { message: errorm });
});

app.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var loginquery = 'SELECT * FROM users WHERE username = ?';
  connection.query(loginquery, [username], async (error, results) => {
    if (error) return res.render('error', { message: errorm });
    if (results.length === 0) {
      return res.redirect('/login?error=invalidcredu');
    }
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect('/login?error=invalidcredp');
    }
    req.session.user = {
      id: user.users_id,
      username: user.username,
      role: user.roles_id
    };
    console.log('User logged in:', req.session.user);
    return res.redirect('/');
  });
});

app.post('/addusers', async (req, res) => {
  var username = req.body.username;
  var nickname = req.body.nickname;
  var password = req.body.password;
  var roles_id = req.body.roles_id;
  var hashedpassword = await bcrypt.hash(password, 10);
  var checkquery = 'SELECT * FROM users WHERE username = ? OR nickname = ?';
  connection.query(checkquery, [username, nickname], function (error, results) {
    if (error) return res.render('error', { message: errorm });
    if (results.length > 0) {
      res.redirect('/user?error=duplicate');
    } else {
      var user = {
        username,
        nickname,
        password: hashedpassword,
        roles_id
      };
      var insertquery = 'INSERT INTO users SET ?';
      connection.query(insertquery, user, (error, results) => {
        if (error) return res.render('error', { message: errorm });
        console.log(results);
        res.redirect('/user');
      });
    }
  });
});

app.post('/users/edit/:id', async (req, res) => {
  var userId = req.body.users_id;
  var username = req.body.username;
  var nickname = req.body.nickname;
  var password = req.body.password;
  var roles_id = req.body.roles_id;
  var hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  var updateQuery = hashedPassword
    ? 'UPDATE users SET username = ?, nickname = ?, password = ?, roles_id = ? WHERE users_id = ?'
    : 'UPDATE users SET username = ?, nickname = ?, roles_id = ? WHERE users_id = ?';
  var queryValues = hashedPassword
    ? [username, nickname, hashedPassword, roles_id, userId]
    : [username, nickname, roles_id, userId];
  connection.query(updateQuery, queryValues, (error, results) => {
    if (error) return res.render('error', { message: erroru });
    console.log(updateQuery, queryValues, results);
    res.redirect('/user');
  });
});

app.post('/addmonthly', function (req, res) {
  var users_id = req.body.users_id;
  var month_id = req.body.month_id;
  var checkquery = 'SELECT * FROM monthly WHERE users_id = ? AND month_id = ?';
  connection.query(checkquery, [users_id, month_id], function (error, result) {
    if (error) return res.render('error', { message: errorm });
    if (result.length > 0) {
      res.redirect(`/spending?error=duplicate`);
    } else {
      var addmonthly = {
        users_id: users_id,
        monthly_amount: req.body.monthly_amount,
        month_id: month_id,
        monthly_receipt: req.body.monthly_receipt
      };
      var insertmonthly = 'INSERT INTO monthly SET ?';
      connection.query(insertmonthly, addmonthly, function (error, results) {
        if (error) return res.render('error', { message: errorm });
        console.log(results);
        res.redirect('/spending');
      });
    }
  });
});

app.post('/addfunding', function (req, res) {
  var addfunding = {
    funding_amount: req.body.funding_amount,
    funding_description: req.body.funding_desc,
    funding_receipt: req.body.funding_receipt
  };
  var insertfunding = 'INSERT INTO funding SET ?';
  connection.query(insertfunding, addfunding, function (error, results) {
    if (error) return res.render('error', { message: errorm });
    console.log(results);
    res.redirect('/spending');
  }
  );
});

app.post('/addspending', function (req, res) {
  var addspending = {
    expenses_amount: req.body.expenses_amount,
    expenses_description: req.body.expenses_desc,
    expenses_receipt: req.body.expenses_receipt
  };
  var insertspending = 'INSERT INTO expenses SET ?';
  connection.query(insertspending, addspending, function (error, results) {
    if (error) return res.render('error', { message: errorm });
    console.log(results);
    res.redirect('/spending');
  }
  );
});

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && Number(req.session.user.role) === 2) return next();
  res.render('error', { message: errorr });
}