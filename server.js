const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// const Admin = require('./models/admin');
app.use(express.static('public'));
passport.use('admin', new LocalStrategy(
  async (username, password, done) => {
    try {
      const admin = await Admin.findOne({ username: username });
      if (!admin) return done(null, false);
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) return done(null, false);
      return done(null, admin);
    } catch (error) {
            return done(error);
    }
  }
));


// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:paul@cluster0.xixsoro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

const electionSchema = new mongoose.Schema({
  electionName: String,
  voterNames: [String],
  isActive: { type: Boolean, default: true },
  endTime: Date
});
const Election = mongoose.model('Election', electionSchema);


const userVoteSchema = new mongoose.Schema({
  electionName: String,
  selectedVoter: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming you have a User model defined
  }
});

// Create UserVote model
const UserVote = mongoose.model('UserVote', userVoteSchema);
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

// Passport configuration
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) return done(null, false);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return done(null, false);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));



passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Routes
app.get('/', (req, res) => {
  res.render('home'); // Render the home.ejs page
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/signup'));
app.use('/', require('./routes/admin')); 
// Route to render the create-election form

app.get('/admin/create-election', isAdminAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/views/create-election.html');
});

function isAdminAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.redirect('/login'); // Redirect unauthorized users to login page
}
setInterval(async () => {
  const currentTime = new Date();
  const elections = await Election.find({ isActive: true });

  elections.forEach(async (election) => {
    if (currentTime > election.endTime) {
      await Election.findByIdAndUpdate(election._id, { isActive: false });
    }app.use('/', require('./routes/auth'));
    app.use('/', require('./routes/signup'));
    app.use('/', require('./routes/admin'));  
  });
}, 60000);

app.post('/admin/create-election', async (req, res) => {
  try {
    const { electionName, endTime } = req.body;
    const voterNames = Object.keys(req.body)
      .filter(key => key.startsWith('voter'))
      .map(key => req.body[key]);

    console.log(electionName, voterNames);
    const election = new Election({
      electionName,
      voterNames,
      endTime: new Date(endTime) // Convert endTime string to Date object
    });
    await election.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/delete-elections', isAdminAuthenticated, async (req, res) => {
  try {
    const elections = await Election.find();
    res.render('admin-delete', { elections });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/admin/delete-election/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Election.findByIdAndDelete(id);
    res.redirect('/admin/delete-elections');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/pause-elections', isAdminAuthenticated, async (req, res) => {
  try {
    const elections = await Election.find();
    res.render('admin-pause', { elections });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle pausing an election
app.post('/admin/pause-election/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Election.findByIdAndUpdate(id, { isActive: false });
    res.redirect('/admin/pause-elections');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/admin/resume-election/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Election.findByIdAndUpdate(id, { isActive: true });
    res.redirect('/admin/pause-elections');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



//user

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}



// Assuming '/active-elections' is the route where users view active elections
app.get('/active-elections',isAuthenticated, async (req, res) => {
  try {
    // Query the database for active elections
    const activeElections = await Election.find({ isActive: true });

    // Render the active elections page with the list of active elections
    res.render('active-elections', { activeElections });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Assuming '/active-election/:id' is the route where users view candidates and vote in a specific election
app.get('/active-election/:id', isAuthenticated,async (req, res) => {
  try {
    const { id } = req.params;
    // Query the database to get the selected election and its candidates
    const election = await Election.findById(id);
    const candidates = election.voterNames;

    // Render the page to view candidates and vote
    res.render('vote', { election, candidates });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Assuming '/submit-vote' is the route to handle user vote submissions
app.post('/submit-vote', isAuthenticated,async (req, res) => {
  try {
    const { electionId, selectedCandidate } = req.body;
    const userId = req.user.id; // Assuming user ID is available in the session
    const existingVote = await UserVote.findOne({ electionName: electionId, user: userId });
    if (existingVote) {
      return res.status(400).render('alreadyVoted');
    }

    // Create a new UserVote document with all required fields
    const userVote = new UserVote({
      electionName: electionId,
      selectedVoter: selectedCandidate,
      user: req.user // Use req.user directly as it contains the reference to the User model
    });
    await userVote.save();
    res.redirect('/thank-you'); // Redirect to a thank-you page after voting
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Server-side route to handle rendering election results
app.get('/view-results',isAuthenticated, async (req, res) => {
  try {
    // Query the database to retrieve election data
    const elections = await Election.find();

    // Query the user votes database to retrieve votes data
    const userVotes = await UserVote.find();

    // Prepare election results data
    const electionResults = [];

    // Loop through each election
    for (const election of elections) {
      const electionResult = {
        electionName: election.electionName,
        candidates: {}
      };

      // Initialize candidate votes count to 0
      for (const candidate of election.voterNames) {
        electionResult.candidates[candidate] = 0;
      }

      // Count votes for each candidate in the election
      for (const vote of userVotes) {
        // console.log( vote.selectedVoter in electionResult.candidates)
        if (vote.electionName === election._id.toString() && vote.selectedVoter in electionResult.candidates) {
          electionResult.candidates[vote.selectedVoter]++;
        }
      }

      // Add the election result to the array
      electionResults.push(electionResult);
    }

    // Render the view-results page with the election results data
    res.render('view-results', { electionResults });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
