const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./db');
const port = 5001;
const domain = 'http://localhost:';

const errorm = 'Error 400 : Unable to fetch data';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static(__dirname + '/public'));

app.listen(port, function () {
  console.log('Server is running on', domain, port);
});

app.get('/', function(req, res) {
  var collectedquery = 'SELECT total_collected FROM total_collected';
  var spentquery = 'SELECT total_spent FROM total_spent';
  var availablequery = 'SELECT total_available FROM total_available';
  var userquery = 'SELECT * FROM users';
  var monthquery = 'SELECT * FROM months ORDER BY month_id';
  var paymentquery = 'SELECT users_id, month_id FROM monthly';
  connection.query(collectedquery, function(error, collectedresult) {
    if (error) return res.render('error', { message: errorm });
    connection.query(spentquery, function(error, spentresult) {
      if (error) return res.render('error', { message: errorm });
      connection.query(availablequery, function(error, availableresult) {
        if (error) return res.render('error', { message: errorm });
        connection.query(userquery, function(error, users) {
          if (error) return res.render('error', { message: errorm });
          connection.query(monthquery, function(error, months) {
            if (error) return res.render('error', { message: errorm });
            connection.query(paymentquery, function(error, payments) {
              if (error) return res.render('error', { message: errorm });
              res.render('home', {
                collected: collectedresult[0].total_collected,
                spent: spentresult[0].total_spent,
                available: availableresult[0].total_available,
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

app.get('/spending', function(req, res){
  var usersquery = 'SELECT * FROM users';
  var monthsquery = 'SELECT * FROM months ORDER BY month_id';
  var perror = req.query.error;
  connection.query(usersquery, function(error, users) {
    if (error) return res.render('error', { message: errorm });
    connection.query(monthsquery, function(error, months){
      if (error) return res.render('error', { message: errorm });
      res.render('spending', { 
          users: users,
          months: months,
          error: perror
      });  
    });
  });
})

app.get('/users', function(req, res){
  var perror = req.query.error;
  res.render('users', { error: perror });
});

app.get('/report', (req, res) => {
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

app.get('/error', function(req, res){
  res.render('error', { message: errorm });
});

app.post('/addusers', function(req, res){
  var username = req.body.users_name;
  var nickname = req.body.users_nickname;
  var checkquery = 'SELECT * FROM users WHERE username = ? OR nickname = ?';
  connection.query(checkquery, [username, nickname], function(error, result) {
    if (error) return res.render('error', { message: errorm });
    if (result.length > 0) {
      res.redirect('/users?error=duplicate');
    } else {
      var adduser = {
        username: username,
        nickname: nickname
      };
      var insertuser = 'INSERT INTO users SET ?';
      connection.query(insertuser, adduser, function(error, results) {
        if (error) return res.render('error', { message: errorm });
        console.log(results);
        res.redirect('/users');
      });
    }
  });
});

app.post('/addmonthly', function(req, res){
  var users_id = req.body.users_id;
  var month_id = req.body.month_id;
  var checkquery = 'SELECT * FROM monthly WHERE users_id = ? AND month_id = ?';
  connection.query(checkquery, [users_id, month_id], function(error, result) {
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
      connection.query(insertmonthly, addmonthly, function(error, results) {
        if (error) return res.render('error', { message: errorm });
        console.log(results);
        res.redirect('/spending');
      });
    }
  });
});

app.post('/addfunding', function(req, res){
  var addfunding = {
    funding_amount: req.body.funding_amount,
    funding_description: req.body.funding_desc,
    funding_receipt: req.body.funding_receipt
  };
  var insertfunding = ('INSERT INTO funding SET ?');
  connection.query(insertfunding, addfunding, function(error, results)
    {if (error) return res.render('error', { message: errorm });
      console.log(results);
      res.redirect('/spending');
    }
  );
});

app.post('/addspending', function(req, res){
  var addspending = {
    expenses_amount: req.body.expenses_amount,
    expenses_description: req.body.expenses_desc,
    expenses_receipt: req.body.expenses_receipt
  };
  var insertspending = ('INSERT INTO expenses SET ?');
  connection.query(insertspending, addspending, function(error, results)
    {if (error) return res.render('error', { message: errorm });
      console.log(results);
      res.redirect('/spending');
    }
  );
});