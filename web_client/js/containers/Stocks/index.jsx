import History from '../../components/History';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import StockHeader from './header';
import { connect } from 'react-redux';
import { feedStart, setProp } from 'actions/app';

// watch out for semis!!! weird ES7 decorators stuff :P
// http://blog.spoonx.nl/babel-es7-leading-decorators-must-be-attached-to-a-class-declaration/
@connect(state => ({
  cacheSync: state.app.cacheSync,
  lastUpdate: state.app.lastUpdate,
  loading: state.app.loading,
  market: state.app.market,
  selectedStockId: state.app.selectedStockId,
  socketError: state.app.socketError,
  stockCache: state.app.stockCache,
  stocks: state.app.stocks
}))

export default class Stocks extends Component {
  static propTypes = {
    cacheSync: PropTypes.array,
    lastUpdate: PropTypes.number,
    loading: PropTypes.bool,
    market: PropTypes.object,
    selectedStockId: PropTypes.string,
    socketError: PropTypes.object,
    stockCache: PropTypes.object,
    stocks: PropTypes.object,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
    this.setFeedClick = this.setFeedClick.bind(this);
  }

  setFeedClick(stockId) {
    const { dispatch, cacheSync, selectedStockId } = this.props;
    if (stockId === selectedStockId) {
      dispatch(setProp('selectedStockId', ''));
    } else {
      dispatch(feedStart(stockId, cacheSync[stockId]));
    }
  }

  render() {
    const {
      cacheSync,
      lastUpdate,
      loading,
      market,
      selectedStockId,
      socketError,
      stockCache,
      stocks
    } = this.props;

    const stockBlock = Object.keys(stocks)
      .sort((a, b) => {
        return stocks[a][0][1] > stocks[b][0][1];
      })
      .map((key) => {

        const stock = stocks[key][stocks[key].length-1];
        const stockName = stock[1];
        const tradeMarket = stock[2];
        const price = stock[3];

        let history = '';
        if (selectedStockId === key) {
          history = <History
            stock={stocks[selectedStockId]}
            stockCache={stockCache[selectedStockId]}
          />;
        }

        return (
          <div key={key}>
            <button
              className='Button-list'
              disabled={ loading && market.isOpen && !cacheSync[key]}
              onTouchTap={ () => this.setFeedClick(key) }
            >
              {stockName} [{tradeMarket}] USD {price}
            </button>
            {history}
          </div>
        );

      });

    return (
      <div>
        <StockHeader
          lastUpdate={lastUpdate}
          market={market}
          socketError={socketError}
        />
        <hr />
        <div>{stockBlock}</div>
      </div>
    );
  }
}
