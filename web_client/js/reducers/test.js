console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);

//import update from 'immutability-helper';
const update = require('immutability-helper');

// var date = new Date();
// var utc = date.getUTCDate();
// console.log('date:', date);
// console.log('utc:', utc);

const state = {
  stocks: {}
};

let action = {
  stocks: [
    { id: 'id1', a: '1' },
    { id: 'id2', a: '1' },
    { id: 'id3', a: '1' },
    { id: 'id4', a: '1' }
  ]
};

let stocks = new Object();
action.stocks.forEach((stock) => { stocks[stock.id] = [stock]; });
const z = update(state, {
  stocks: {  $merge: stocks }
});
console.log('z:', z);

action = {
  stockId: 'a',
  // stocks: {
  //   a: [{ id: 'id1', a: '2' }],
  //   b: [{ id: 'id2', a: '2' }],
  //   c: [{ id: 'id3', a: '2' }],
  //   d: [{ id: 'id4', a: '2' }]
  // }
  stocks: [
    { id: 'id1', a: '2' },
    { id: 'id2', a: '2' },
    { id: 'id3', a: '2' },
    { id: 'id4', a: '2' }
  ]
};

//const stocks = new Object();
// action.stocks.forEach((stock) => {
//   if (state.stocks[stock.id]) {
//     stocks[stock.id] = state.stocks[stock.id];
//     stocks[stock.id].push(stock);
//   } else {
//     stocks[stock.id] = [stock];
//   }
// });
stocks = Object.assign({}, z.stocks);
action.stocks.forEach((stock) => { stocks[stock.id].push(stock); });
console.log('stocks:', stocks);
const x = update(z, {
  stocks: { $set: stocks }
});

console.log('x:', x.stocks);
