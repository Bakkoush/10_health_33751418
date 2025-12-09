// index.js
const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const db = require('./db'); // <-- ONLY ONE db import

const app = express();


// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));

// Sessions (basic, like in labs)
app.use(
  session({
    secret: 'change_this_secret_33751418',
    resave: false,
    saveUninitialized: false
  })
);

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// HOME – shows latest workouts (read from DB)
app.get('/', async (req, res) => {
  let latestWorkouts = [];
  try {
    const [rows] = await db.query(
      `SELECT w.workout_date, w.activity, w.duration_minutes, u.username
       FROM workouts w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.workout_date DESC, w.id DESC
       LIMIT 5`
    );
    latestWorkouts = rows;
  } catch (err) {
    console.error('Error loading home page workouts', err);
  }
  res.render('home', { latestWorkouts });
});

// ABOUT – simple static description page
app.get('/about', (req, res) => {
  res.render('about');
});

// LOGIN – GET
app.get('/login', (req, res) => {
  // if already logged in, go to workouts
  if (req.session.user) {
    return res.redirect('/workouts');
  }
  res.render('login', { error: null });
});

// LOGIN – POST (gold/smiths from DB)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 1) {
      req.session.user = {
        id: rows[0].id,
        username: rows[0].username
      };
      return res.redirect('/workouts');
    } else {
      return res.render('login', { error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error', err);
    return res.render('login', { error: 'An error occurred while logging in' });
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// LIST WORKOUTS – requires login
app.get('/workouts', requireLogin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT workout_date, activity, duration_minutes, intensity, notes
       FROM workouts
       WHERE user_id = ?
       ORDER BY workout_date DESC, id DESC`,
      [req.session.user.id]
    );
    res.render('workouts', { workouts: rows });
  } catch (err) {
    console.error('Error loading workouts', err);
    res.status(500).send('Error loading workouts');
  }
});

// ADD WORKOUT – form
app.get('/workouts/add', requireLogin, (req, res) => {
  res.render('workout_form', { error: null });
});

// ADD WORKOUT – handle POST, insert into DB (compulsory form feature)
app.post('/workouts/add', requireLogin, async (req, res) => {
  const { workout_date, activity, duration_minutes, intensity, notes } = req.body;

  if (!workout_date || !activity || !duration_minutes) {
    return res.render('workout_form', {
      error: 'Please provide a date, activity and duration.'
    });
  }

  try {
    await db.query(
      `INSERT INTO workouts (user_id, workout_date, activity, duration_minutes, intensity, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        workout_date,
        activity,
        duration_minutes,
        intensity || null,
        notes || null
      ]
    );
    res.redirect('/workouts');
  } catch (err) {
    console.error('Error inserting workout', err);
    res.render('workout_form', { error: 'Error saving workout.' });
  }
});

// SEARCH – form page
app.get('/search', (req, res) => {
  res.render('search', {
    results: null,
    query: '',
    message: null
  });
});

// SEARCH RESULTS – search against DB (compulsory search feature)
app.get('/search/results', async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.render('search', {
      results: [],
      query: '',
      message: 'Please enter a search term.'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT w.workout_date, w.activity, w.duration_minutes, w.intensity, u.username
       FROM workouts w
       JOIN users u ON w.user_id = u.id
       WHERE w.activity LIKE ? OR u.username LIKE ?`,
      [`%${q}%`, `%${q}%`]
    );

    res.render('search_results', {
      results: rows,
      query: q,
      message: rows.length === 0 ? 'No workouts found.' : null
    });
  } catch (err) {
    console.error('Error searching workouts', err);
    res.render('search_results', {
      results: [],
      query: q,
      message: 'An error occurred while searching.'
    });
  }
});

// REGISTER – GET
app.get('/register', (req, res) => {
  // If already logged in, skip registration
  if (req.session.user) return res.redirect('/workouts');

  res.render('register', { error: null });
});

// REGISTER – POST
app.post('/register', async (req, res) => {
  const { username, password, confirm_password } = req.body;

  // Basic validation
  if (!username || !password || !confirm_password) {
    return res.render('register', { error: 'All fields are required.' });
  }

  if (password !== confirm_password) {
    return res.render('register', { error: 'Passwords do not match.' });
  }

  try {
    // Check if username exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existing.length > 0) {
      return res.render('register', { error: 'Username already taken.' });
    }

    // Insert user
    await db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password] // plain text allowed per brief
    );

    // Redirect to login
    res.redirect('/login');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { error: 'Error creating account.' });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('<h1>404 – Page not found</h1>');
});

// Start server on port 8000 (required)
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Workout Tracker running at http://localhost:${PORT}`);
});
