import io from 'socket.io-client';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { routeCodes } from '../../config/routes.jsx';

export default class History extends Component {

  render() {
    return (
      <div className='History'>
        <h1>Stock Market is under development</h1>
        <p>
        </p>
        <hr />
        <div className='Example'>
          <h2>
            <NavLink exact to={ routeCodes.STOCKS }>
              This is work in progress...
            </NavLink>
          </h2>
        </div>
      </div>
    );
  }
}
