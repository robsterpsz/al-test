import io from 'socket.io-client';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { feedError, feedStart, feedSuccess, newStock } from 'actions/app';
import { NavLink } from 'react-router-dom';
import { routeCodes } from '../../config/routes.jsx';
import { toJS } from 'immutable';

let socket;

@connect(state => ({
  feedError: state.app.get('feedError'),
  feedLoading: state.app.get('feedLoading'),
  feedStock: state.app.get('feedStock'),
  newStock: state.app.get('newStock'),
  selectedStock: state.app.get('selectedStock')
}))

export default class Stocks extends Component {
  static propTypes = {
    feedError: PropTypes.object,
    feedLoading: PropTypes.bool,
    feedStock: PropTypes.object,
    newStock: PropTypes.object,
    selectedStock: PropTypes.string,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
    this.feedClick = this.feedClick.bind(this);

    const port = process.env.PORT || 8080

    socket = io('http://localhost:' + port);

    socket.on('newStock', data => {
      const { dispatch, feedStock } = this.props;
      let updateData = {};
      const feed = feedStock.toJS();
      const stocks = JSON.parse(data.updateData).map((stock) => {
        const stockName = stock.t;
        const len = Object.keys(feed[stockName]).length;
        updateData[stockName] = {[len]: stock}
      });

      dispatch(newStock(data, updateData));
    });

    socket.on('feedError', error => {
      const { dispatch } = this.props;
      dispatch(feedError(error));
    });

    socket.on('feedSuccess', data => {
      const { dispatch } = this.props;
      dispatch(feedSuccess(data));
    });
  }

  componentWillUnmount() {
     socket.disconnect()
  }

  feedClick(stockName) {
    const { dispatch } = this.props;
    dispatch(feedStart(socket, stockName));
  }

  render() {
    const { feedError, feedLoading, newStock, selectedStock } = this.props;

    let message = 'Opening soon. Stay tuned.';
    let isOpen = '';
    let stockBlock = new Array();

    if (newStock) {

      isOpen = newStock.marketIsOpen === 'true' ? ' is open' : ' is closed';
      const unixTime = parseInt(newStock.lastUpdate, 10);
      const lastUpdate = new Date(unixTime * 1000);
      message = `Last Update: ${lastUpdate.toLocaleString()}`;

      const stocks = JSON.parse(newStock.updateData);
      stocks.forEach(stock => {
        const stockName = stock.t;
        const tradeMarket = stock.e;

        stockBlock.push(
            <h3 key={stock.id}>{stockName} [{tradeMarket}] USD {stock.l}
                <NavLink
                  activeClassName='Button-link--active'
                  className='Button-link'
                  to={ routeCodes.HISTORY }
                >
                  History
                </NavLink>
            </h3>
          );
      });

    }

    return (
      <div>
        <h1>Stock Market {isOpen}</h1>
        <p>
          {message}
        </p>
        <hr />
        <div>{stockBlock}</div>
      </div>
    );
  }
}
