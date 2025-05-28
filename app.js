//PACKAGES
const express = require("express");
const app = express();
const dotenv= require('dotenv');
const connectToDb = require('./config/db');
const cookieParser= require('cookie-parser');
const port = 3000;
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
dotenv.config();

//MIDDLEWARE SETUP
app.use(express.json());
app.use(cookieParser());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});
// Handle 404
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });
express-session
app.use(session({
    secret:"seceret",
    resave:false,
    saveUninitialized:true,
}))
app.use(passport.initialize());
app.use(passport.session());


const StudentRoutes= require('./Routes/Student_Routes');
const RecruiterRoutes= require('./Routes/Recruiter_Routes');


app.use("/Student",StudentRoutes);
app.use("/R",RecruiterRoutes);

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       return done(null, profile);
//     }
//   )
// );

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// app.get("/", (req, res) => {
//   res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => {
//     res.redirect("/profile");
//   }
// );

// app.get("/profile", (req, res) => {
//   res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//   req.logout(() => {
//     res.redirect("/");
//   });
// });


app.listen(3000, () => {
    connectToDb();
  console.log(`Server is running at port 3000`);
});