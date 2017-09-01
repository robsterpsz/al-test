import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class History extends Component {

  static propTypes = {
    stock: PropTypes.array,
    stockCache: PropTypes.array
  }

  // TODO:
  // mount history from router
  // set graphical display
  render() {

    const { stockCache, stock } = this.props;

    const history = stockCache.concat(stock).reverse().map((stock) => {
      return (
        <div className='Line' key={`${stock[0]}`}>
          {stock.join(' ')}
        </div>);
    });

    return (
      <div className='Example'>
        {history}
      </div>
    );
  }
}


