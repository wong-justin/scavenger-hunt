// misc helpers
const { execSync } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
// db
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const db = lowdb(new FileSync('.data/db.json'));  // db location
// express
const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());        // to read POST deploy from github

// routing
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/views/index.html'));
});

// testing db

let defaults = {
  users: [
    {"firstName":"John", "lastName":"Hancock"},
    {"firstName":"Liz",  "lastName":"Smith"},
    {"firstName":"Ahmed","lastName":"Khan"}
  ]
}
db.defaults(defaults)
  .write();
  
app.get("/write", (req, res) => {
  db.get('users')
    .push({firstName: req.query.first, lastName: req.query.last})
    .write();

  res.redirect("/");
});

app.get("/read", (req, res) => {
  res.send(db.get('users')
             .value());
});

app.get("/clear", (req, res) => {
  db.get('users')
    .remove()
    .write();
  res.redirect("/");
});

// auto deploys from github
app.post('/deploy', (req, res) => {
  if (req.query.secret !== process.env.SECRET) {
    res.status(401).send();
    return
  }

  if (req.body.ref !== 'refs/heads/glitch') {
    res.status(200).send('Push was not to glitch branch, so did not deploy.');
    return
  }

  const repoUrl = req.body.repository.git_url;

  console.log('Fetching latest changes.')
  const output = execSync(
    `git checkout -- ./ && git pull -X theirs ${repoUrl} glitch && refresh`
  ).toString();
  console.log(output);
  res.status(200).send();
});

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
