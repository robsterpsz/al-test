import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { setProp } from 'actions/app';

export default class SocketError extends Component {
  static propTypes = {
    socketError: PropTypes.object
  }

  render() {

    return (
      <p className='Error'>
        {this.props.socketError.message}
      </p>
    );

  }
}
