import React, { Component } from 'react';
import Routes from 'config/routes';
import PropTypes from 'prop-types';

import Menu from 'components/global/Menu';

export default class App extends Component {
  static propTypes = {
    children: PropTypes.object,
  }

  render() {
    return (
      <div className='App'>
        <Menu />
        <div className='Page'>
          <Routes />
        </div>
      </div>
    );
  }
}
