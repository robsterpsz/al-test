# AL TASK

## What is this?
A test project to demonstrate a React client served by Node.js with Redis back-up and Socket.io

### Requirements
NodeJS HTTP Server (without any framework)  6.11.0
Redis                                       4.0.1
react
socket.io                                   2.0.3
Babel (ES6)                                 6.24.1

#### Usage

##### Install:
```bash
git clone https://github.com/robsterpsz/al-test.git
cd altest
npm install
```

##### Run:

```bash
###############################################################
npm run start
###############################################################
```

#### Development CLI History
mkdir altest
cd altest
npm init
npm install --save-dev redis
npm install --save socket-io
npm install --save-dev babel-cli
npm install --save-dev babel-preset-es2015 babel-preset-stage-2
npm install --save-dev nodemon
modify package.json:
```javascript
  "scripts": {
    "start": "nodemon index.js --exec babel-node --presets es2015,stage-2",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/robsterpsz/al-test.git"
  },  
```
git init
git remote add origin https://github.com/robsterpz/al-test.git
git remote -v
touch .gitignore
modify .gitignore:
```bash
# Dependency directories
node_modules
```
git status
git add .
