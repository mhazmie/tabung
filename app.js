const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const connection = require('./db');
const port = 5001;
const domain = 'http://localhost:';

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
  connection.query(collectedquery, function(err, collectedresult) {
    if (err) throw err;
    connection.query(spentquery, function(err, spentresult) {
      if (err) throw err;
      connection.query(availablequery, function(err, availableresult) {
        if (err) throw err;
        connection.query(userquery, function(err, users) {
          if (err) throw err;
          connection.query(monthquery, function(err, months) {
            if (err) throw err;
            connection.query(paymentquery, function(err, payments) {
              if (err) throw err;
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


app.get('/users', function(req, res){
    res.render('users');
});

app.get('/monthly', function(req, res){
  var usersquery = 'SELECT * FROM users';
  var monthsquery = 'SELECT * FROM months ORDER BY month_id'
  connection.query(usersquery, function(error, users) {
    if (error) throw error;
    connection.query(monthsquery, function(error, months){
        if(error) throw error;
            res.render('monthly', { 
                users: users,
                months: months
            });  
    });
  });
});

app.get('/funding', function(req, res){
    res.render('funding');
});

app.get('/spend', function(req, res){
    res.render('spend');
});

app.post('/addusers', function(req, res){
  var adduser = {
    username: req.body.users_name,
    nickname: req.body.users_nickname
  };
  var insertuser = ('INSERT INTO users SET ?');
  connection.query(insertuser, adduser, function(error, results)
    {if (error) throw error;
      console.log(results);
      res.redirect('/users');
    }
  );
});

app.post('/addmonthly', function(req, res){
  var addmonthly = {
    users_id: req.body.users_id,
    monthly_amount: req.body.monthly_amount,
    month_id: req.body.month_id,
    monthly_receipt: req.body.monthly_receipt
  };
  var insertmonthly = ('INSERT INTO monthly SET ?');
  connection.query(insertmonthly, addmonthly, function(error, results)
    {if (error) throw error;
      console.log(results);
      res.redirect('/monthly');
    }
  );
});

app.post('/addfunding', function(req, res){
  var addfunding = {
    funding_amount: req.body.funding_amount,
    funding_description: req.body.funding_desc,
    funding_receipt: req.body.funding_receipt
  };
  var insertfunding = ('INSERT INTO funding SET ?');
  connection.query(insertfunding, addfunding, function(error, results)
    {if (error) throw error;
      console.log(results);
      res.redirect('/funding');
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
    {if (error) throw error;
      console.log(results);
      res.redirect('/spend');
    }
  );
});