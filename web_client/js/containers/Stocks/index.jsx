import History from '../../components/History';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { feedStart, setProp } from 'actions/app';
import { NavLink } from 'react-router-dom';
import { routeCodes } from '../../config/routes.jsx';

@connect(state => ({
  socketError: state.app.socketError,
  feedLoaded: state.app.feedLoaded,
  feedLoading: state.app.feedLoading,
  lastStocks: state.app.lastStocks,
  lastUpdate: state.app.lastUpdate,
  marketIsOpen: state.app.marketIsOpen,
  selectedStock: state.app.selectedStock,
  stocks: state.app.stocks
}))

export default class Stocks extends Component {
  static propTypes = {
    socketError: PropTypes.object,
    feedLoaded: PropTypes.array,
    feedLoading: PropTypes.bool,
    lastStocks: PropTypes.array,
    lastUpdate: PropTypes.number,
    marketIsOpen: PropTypes.bool,
    selectedStock: PropTypes.string,
    stocks: PropTypes.object,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
    this.setFeedClick = this.setFeedClick.bind(this);
  }

  setFeedClick(stockId) {
    const { dispatch, feedLoaded } = this.props;
    const isLoaded = feedLoaded.indexOf(stockId) !== -1;
    if (isLoaded) {
      dispatch(setProp('selectedStock', stockId));
    } else {
      dispatch(feedStart(stockId));
    }
  }

  render() {
    const {
      dispatch,
      feedLoaded,
      feedLoading,
      lastStocks,
      lastUpdate,
      marketIsOpen,
      selectedStock,
      socketError,
      stocks
    } = this.props;

    const marketStatus = marketIsOpen ? ' is open' : ' is closed';

    let message = 'This service is available every business day from 09:30 to 16:00 EDT.';
    let stockBlock = new Array();
    let history = '';

    if (lastUpdate) {
      const lastDate = new Date(lastUpdate * 1000);
      message = `Last Update: ${lastDate.toLocaleString()}`;

      if (selectedStock) {

        const stock = lastStocks.filter((stock) => { return stock.id === selectedStock });
        const keys = Object.keys(stock[0]).map ((key) => { return key });
        console.log('HOLA')
        history = <History
          dispatch={dispatch}
          keys={keys}
          stocks={stocks[selectedStock]}
          selectedStock={selectedStock}
          stockName={stock[0].t}
          stockPrice={stock[0].l}
          tradeMarket={stock[0].e}
          />;

      } else {

        lastStocks.forEach(stock => {

          const stockName = stock.t;
          const tradeMarket = stock.e;
          const price = stock.l;

          stockBlock.push(
              <h3 key={`k${stock.id}`}>{stockName} [{tradeMarket}] USD {price}
                <button
                  className='Button-link'
                  disabled={ feedLoading }
                  onTouchTap={ () => this.setFeedClick(stock.id) }
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
        <h1>Stock Market {marketStatus}</h1>
        <p>
          {message}
        </p>
        <p className='Error'>
          {socketError && socketError.message}
        </p>
        <hr />
        <div>{stockBlock}</div>
        {history}
      </div>
    );
  }
}
