import History from '../History/index.jsx';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { feedError, feedSuccess, feedStart, newStock, setProp } from 'actions/app';
import { NavLink } from 'react-router-dom';
import { routeCodes } from '../../config/routes.jsx';

// TODO: To be handled by middleware
let socket;

@connect(state => ({
  feedError: state.app.feedError,
  feedLoading: state.app.feedLoading,
  feedStock: state.app.feedStock,
  newStock: state.app.newStock,
  selectedStock: state.app.selectedStock
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
    this.setPropClick = this.setPropClick.bind(this);

    socket = io();

    socket.on('newStock', data => {
      const { dispatch } = this.props;
      dispatch(newStock(data));
    });
  }

  componentDidMount() {
    if (!this.props.newStock) {
      socket.emit('sendStock');
    }
  }

  componentWillUnmount() {
     socket.disconnect()
  }

  setPropClick(key, value) {
    socket.emit('feedStart', value);

    socket.on('feedError', error => {
      const { dispatch } = this.props;
      dispatch(feedError(error));
    });

    socket.on('feedSuccess', data => {
      const { dispatch } = this.props;
      dispatch(feedSuccess(data));
      dispatch(setProp(key, value))
    });
  }

  render() {
    const { newStock, selectedStock } = this.props;

    let message = 'Opening soon. Stay tuned.';
    let isOpen = '';
    let stockBlock = new Array();
    let history = '';

    if (newStock) {

      isOpen = newStock.marketIsOpen === 'true' ? ' is open' : ' is closed';
      const unixTime = parseInt(newStock.lastUpdate, 10);
      const lastUpdate = new Date(unixTime * 1000);
      message = `Last Update: ${lastUpdate.toLocaleString()}`;

      if (selectedStock) {

        history = <History selectedStock={selectedStock} socket={socket} />;

      } else {

        const stocks = JSON.parse(newStock.updateData);
        stocks.forEach(stock => {
          const stockName = stock.t;
          const tradeMarket = stock.e;
          const price = stock.l;

          stockBlock.push(
              <h3 key={stock.id}>{stockName} [{tradeMarket}] USD {price}
                <button
                  className='Button-link'
                  onTouchTap={ () => this.setPropClick('selectedStock', stockName) }
                >
                  History
                </button>
              </h3>
            );
        });
      }

    }

    return (
      <div>
        <h1>Stock Market {isOpen}</h1>
        <p>
          {message}
        </p>
        <hr />
        <div>{stockBlock}</div>
        {history}
      </div>
    );
  }
}
