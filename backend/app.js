var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2');
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");

var usersRouter = require('./routes/users');

var app = express();

app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "eldenring", 
  database: "my_database", 
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database.");
  }
});

db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prefix VARCHAR(10),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    dateOfBirth DATE,
    age INT,
    profilePicture VARCHAR(255),
    lastModified DATETIME
  )
`, (err) => {
  if (err) {
    console.error("Error creating table:", err);
  } else {
    console.log("Table 'users' ready.");
  }
});

// GET: Fetch all users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Error fetching data" });
    } else {
      res.json(results);
    }
  });
});

// POST: Add a new user
app.post("/users/registerUser", upload.single("profilePicture"), (req, res) => {
  const {
    prefix,
    firstName,
    lastName,
    dateOfBirth,
    age,
    lastModified,
  } = req.body;

  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO users (prefix, firstName, lastName, dateOfBirth, age, profilePicture, lastModified) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [prefix, firstName, lastName, dateOfBirth, age, profilePicture, lastModified],
    (err, results) => {
      if (err) {
        console.error("Error saving data:", err);
        res.status(500).json({ error: "Error saving data" });
      } else {
        res.json({ message: "User saved successfully" });
      }
    }
  );
});








// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
