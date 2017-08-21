import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { routeCodes } from '../../config/routes.jsx';
import { setProp } from 'actions/app';

export default class History extends Component {

  static propTypes = {
    selectedStock: PropTypes.string,
    stockName: PropTypes.string,
    stockPrice: PropTypes.string,
    stocks: PropTypes.array,
    tradeMarket: PropTypes.string,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
    this.setPropClick = this.setPropClick.bind(this);
  }

  setPropClick(key, value) {
    const { dispatch } = this.props;
    dispatch(setProp(key, value));
  }

  render() {

    const { stockPrice, selectedStock, stockName, stocks, tradeMarket } = this.props;
    const orderStocks = stocks.map((stock, i) => {
            return (<div key={`${i}${stock[9]}`}>
              {stock[0]}&nbsp;
              {stock[1]}&nbsp;
              {stock[2]}&nbsp;
              {stock[3]}&nbsp;
              {stock[4]}&nbsp;
              {stock[5]}&nbsp;
              {stock[6]}&nbsp;
              {stock[7]}&nbsp;
              {stock[8]}&nbsp;
              {stock[9]}&nbsp;
              {stock[10]}&nbsp;
              {stock[11]}&nbsp;
              {stock[12]}&nbsp;
              {stock[13]}&nbsp;
              {stock[14]}&nbsp;
              {stock[15]}&nbsp;
              {stock[16]}&nbsp;
              {stock[17]}&nbsp;
              {stock[18]}&nbsp;
              {stock[19]}&nbsp;
              {stock[20]}&nbsp;
              {stock[21]}&nbsp;
              {stock[22]}&nbsp;
              {stock[23]}&nbsp;
              {stock[24]}&nbsp;
              {stock[25]}&nbsp;
              {stock[26]}
              <hr />
              </div>)
          }).reverse();
    return (
      <div>
        <h3>{stockName} [{tradeMarket}] USD {stockPrice}
          <button
            className='Button-link'
            onTouchTap={ () => this.setPropClick('selectedStock', '') }
          >
            Close
          </button>
        </h3>
        <div className='Example'>
          {orderStocks}
        </div>
      </div>
    );
  }
}


