import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import helmet from "helmet";
import lusca from "lusca";
import dotenv from "dotenv";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import expressValidator from "express-validator";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env.example" });

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as memberController from "./controllers/member";
import * as apiController from "./controllers/api";
import * as contactController from "./controllers/contact";
import * as reportController from "./controllers/report";


// API keys and Passport configuration
import * as passportConfig from "./config/passport";

// Role Based Access Control configuration
import * as rbacConfig from "./config/accessControl";

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
(<any>mongoose).Promise = bluebird;
mongoose.connect(mongoUrl, {useMongoClient: true}).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
  console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET,
  store: new MongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(helmet());
app.use(helmet.noCache());
app.use(lusca.csrf());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path == "/account") {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);
app.get("/login", userController.getLogin);
app.post("/login", userController.postLogin);
app.get("/logout", userController.logout);
app.get("/forgot", userController.getForgot);
app.post("/forgot", userController.postForgot);
app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);

app.get("/signup", passportConfig.isAuthenticated, rbacConfig.hasAccess("user:signup"), userController.getSignup);
app.post("/signup", passportConfig.isAuthenticated, rbacConfig.hasAccess("user:signup"), userController.postSignup);

// app.get("/contact", contactController.getContact);
// app.post("/contact", contactController.postContact);

app.get("/account", passportConfig.isAuthenticated, rbacConfig.hasAccess("user:updateProfile"), userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, rbacConfig.hasAccess("user:updateProfile"), userController.postUpdateProfile);
app.post("/account/password", passportConfig.isAuthenticated, rbacConfig.hasAccess("user:updateProfile"), userController.postUpdatePassword);
// app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
// app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);

// Member module
app.get("/members", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:list"), memberController.getMembers);
app.get("/member/create", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:create"), memberController.getMemberCreate);
app.post("/member/create", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:create"), memberController.postMemberCreate);
app.get("/member/:id", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:view"), memberController.getMemberDetail);
app.get("/member/:id/update", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:edit"), memberController.getMemberUpdate);
app.post("/member/:id/update", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:edit"), memberController.postMemberUpdate);
app.get("/members/notifyId", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:notifyId"), memberController.getMembersNotifyId);
app.post("/member/:id/notifyId", passportConfig.isAuthenticated, rbacConfig.hasAccess("member:notifyId"), memberController.postMemberNotifyId);

// Report module
app.get("/report/members", passportConfig.isAuthenticated, rbacConfig.hasAccess("report:members"), reportController.getMembers);
app.get("/report/members/download", passportConfig.isAuthenticated, rbacConfig.hasAccess("report:members"), reportController.getMembersDownload);

/**
 * API examples routes.
 */
// app.get("/api", apiController.getApi);
// app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get("/api/heartbeat", apiController.getHeartbeat);

/**
 * OAuth authentication routes. (Sign in)
 */
// app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
// app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
//   res.redirect(req.session.returnTo || "/");
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err: any = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export const ROOT_DIR = __dirname;

export default app;