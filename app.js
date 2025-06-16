var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rootpassword',
  database: 'tabung'
});

const port = 5001;
const domain = 'http://localhost:';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static(__dirname + '/public'));

app.listen(port, function () {
  console.log('Server is running on', domain, port);
});

app.get('/', function(req, res){
    res.render('home');
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