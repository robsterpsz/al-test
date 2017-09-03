import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SocketError from './error';

export default class StockHeader extends Component {
  static propTypes = {
    lastUpdate: PropTypes.number,
    market: PropTypes.object,
    socketError: PropTypes.object,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
  }

  render() {
    const {
      lastUpdate,
      market,
      socketError
    } = this.props;

    let marketStatus = ' is open.';
    let message = lastUpdate && `Last Update: ${new Date(lastUpdate * 1000).toLocaleString()}` || '';

    if (!market.isOpen) {
      const apiDate = new Date(market.time * 1000).toUTCString();
      message = 'This service is available every business day from 09:30 to 16:00 EDT.';
      marketStatus = ` is closed [${apiDate}]`;
    }

    return (
      <div>
        <h1>Stock Market {marketStatus}</h1>
        <p>
          {message}
        </p>
        <SocketError
          socketError={socketError}
        />
      </div>
    );
  }
}
