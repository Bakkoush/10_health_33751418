The Workout Tracker is a simple web application that allows users to log, manage, and search workout activities.
It features user authentication, personalised workout logs, and global search across all users.
The project demonstrates dynamic web development skills using Node.js, Express, EJS, and MySQL.

Features
User Accounts

Register a new user

Login using session-based authentication

Logout securely

Workout Logging

Add a workout (date, activity, duration, intensity, notes)

View all logged workouts for the current user

Search

Search workouts globally by activity or username

Clean UI

Dynamic navigation depending on login state

Custom home page with hero section and feature cards

Technologies Used
Application Tier

Node.js

Express.js

EJS templating engine

express-session for login persistence

Data Tier

MySQL database

mysql2 (Promise-based query support)

Project Structure
10_health_33751418/
│
├── index.js               # Main server file (Express app)
├── db.js                  # Database connection (MySQL)
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables (not included in repo)
│
├── views/                 # EJS Templates
│   ├── home.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── workouts.ejs
│   ├── workout_form.ejs
│   ├── search.ejs
│   ├── search_results.ejs
│   ├── loggedin.ejs
│   └── partials/
│        ├── header.ejs
│        └── footer.ejs
│
├── public/
│   └── css/
│       └── style.css      # Main stylesheet
│
└── README.md              # Documentation

⚙️ Installation & Setup
Install Dependencies

Run inside the project folder:

npm install

Configure Environment Variables

Create a .env file:

HEALTH_HOST=localhost
HEALTH_USER=your_mysql_user
HEALTH_PASSWORD=your_mysql_password
HEALTH_DATABASE=health
HEALTH_PORT=3306

Create MySQL Database
CREATE DATABASE health;


Required tables:

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  workout_date DATE,
  activity VARCHAR(100),
  duration_minutes INT,
  intensity VARCHAR(20),
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

Start the App
node index.js


App will run at:

http://localhost:8000

Login Behaviour

After logging in, users are shown a loggedin.ejs confirmation page.

Login-protected pages show 401 errors instead of redirecting (as required).

Navigation updates based on the user's authentication state.

Testing the Application

Register a user

Log in

Add a workout

View your workouts

Use the search function

Try accessing /workouts while logged out (should show 401 message)

Advanced Features Included

Middleware-driven user state:
Automatically passes currentUser into all EJS templates:

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});


No redirect login protection:
Routes use:

return res.status(401).send("You must be logged in");


Secure parameterised MySQL queries
