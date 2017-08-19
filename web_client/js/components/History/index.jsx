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
          { stocks.map((stock, i) => {
            return (<div key={i}>
              id: {stock.id}
              t: {stock.t}
              e: {stock.e}
              l: {stock.l}
              l_fix: {stock.l_fix}
              l_cur: {stock.l_cur}
              s: {stock.s}
              ltt: {stock.ltt}
              lt: {stock.lt}
              lt_dts: {stock.lt_dts}
              c: {stock.c}
              c_fix: {stock.c_fix}
              cp: {stock.cp}
              cp_fix: {stock.cp_fix}
              ccol: {stock.ccol}
              pcls_fix: {stock.pcls_fix}
              el:{stock.el}
              el_fix: {stock.el_fix}
              el_cur: {stock.el_cur}
              elt: {stock.elt}
              ec: {stock.ec}
              ec_fix: {stock.ec_fix}
              ecp: {stock.ecp}
              ecp_fix: {stock.ecp_fix}
              eccol: {stock.eccol}
              div: {stock.div}
              yld: {stock.yld}
              <hr />
              </div>)
          }) }
        </div>
      </div>
    );
  }
}


