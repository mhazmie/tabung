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

// app.get('/', function(req, res){
//     var getmonth = ('SELECT * FROM months');
//     connection.query(getmonth, function(error, results)
//     {if (error) throw error;
//       res.render('/home', {months:months});
//     }
//   );
// });

app.get('/', function(req, res){
    res.render('home');
});

// app.get('/pg1', function(req, res){
//     var getmonth = ('SELECT * FROM months');
//     connection.query(getmonth, function(error, results)
//     {if (error) throw error;
//       res.render('/pg1', {months:months});
//     }
//   );
// });

app.post('/adduser', function(req, res){
  var adduser = {
    username: req.body.name,
    nickname: req.body.nickname
  };
  var insertuser = ('INSERT INTO users SET ?');
  connection.query(insertuser, adduser, function(error, results)
    {if (error) throw error;
      console.log(results);
      res.redirect('/');
    }
  );
});

// app.post('/addmonthly', function(req, res){
//   var addmonthly = {
//     username: req.body.name,
//     nickname: req.body.nickname
//   };
//   var q = ('INSERT INTO users SET ?');
//   connection.query(q, addmonthly, function(error, results)
//     {if (error) throw error;
//       console.log(results);
//       res.redirect('/');
//     }
//   );
// });