# AL TASK

## What is this?
A test project to demonstrate a React client served by Node.js (with ES6 via babel) with Redis DB and Socket.io, to be deployed at Heroku.

At this stage React is using redux-saga to handle socket.io.

## Details for this version
All branches pushed in the public repo are meant to be run on their own and are fully functional, so you can take a peek on my ramblings about code.

This is how state is looking as I'm thinking about the tiniest possible state:

![state](https://image.ibb.co/fZcaHQ/Screenshot_20170825_142548.png)

I am also testing different approaches to get a balanced performance on web client. 

This time I'm using arrays instead of flatten array-like objects, both for 'static' cached data and 'volatile' data, and I will keep watching how it performs... not bad so far.

## CHANGELOG:
* Persistence for web client, thanks to redux-persist.
* Basic sync flow for data caching on a daily basis.
* Webpack config for node.
* Esdoc to publish html node docs.
* Added a timer saga to be run after market closes.
* New timer on network error simulation.

## TODO:
* Provide history directly from URL, REST style.
* Manage traffic from a third party API.
* Graphic display: add a clock component, charts and some fancy styles.
* Make tests.
* Keep thinking about the best way to manage state.

### Requirements
* NodeJS HTTP Server (without any framework)  6.11.0
* Redis                                       4.0.1
* React                                       15.6.1
* socket.io                                   2.0.3
* Babel (ES6)                                 6.24.1

##### Install:
```bash
git clone https://github.com/robsterpsz/al-test.git
cd altest
npm install
```

##### You should run on dev mode:

To get the node server up and running:
```bash
###############################################################
npm run dev:server
###############################################################
```

In a separate console, to get the web client running:
```bash
###############################################################
npm run dev:client # or simply: npm run dev 
###############################################################
```