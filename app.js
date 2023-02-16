const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http:/localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Register/Add USER//
app.post("/register", async (request, response) => {
  const addUserDetail = request.body;
  console.log(addUserDetail);
  const { username, password, name, gender, location } = addUserDetail;

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);

  const checkUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(checkUserQuery);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (dbUser === undefined) {
      const createUserQuery = `
            INSERT INTO 
            user(username, name, password, gender, location)
            VALUES
            ('${username}', '${name}', 
              '${hashedPassword}', '${gender}', '${location}')`;

      const createUser = await db.run(createUserQuery);
      console.log(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//User LOGIN//
app.post("/login", async (request, response) => {
  const loginUserDetail = request.body;
  console.log(loginUserDetail);
  const { username, password } = loginUserDetail;
  const checkUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(checkUserQuery);
  console.log(dbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    console.log(comparePassword);
    if (comparePassword) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change/Update Password//
app.put("/change-password", async (request, response) => {
  const changePasswordDetail = request.body;
  const { username, oldPassword, newPassword } = changePasswordDetail;
  console.log(changePasswordDetail);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const checkCurrentPassword = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (checkCurrentPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE user
            SET password = '${newHashedPassword}'
            WHERE username = '${username}'`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
