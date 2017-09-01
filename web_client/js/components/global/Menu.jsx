import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { path } from 'config/routes';
import Logo from '../../../assets/img/logo.svg';

export default class Menu extends Component {
  render() {
    return (
      <div className='Menu'>
        <div className='Menu-logo'>
          <a href='https://robsterlabs.herokuapp.com'>
            <img
              src={ Logo }
              alt='Robster Labs'
            />
          </a>
        </div>
        <div className='Menu-links'>
          <NavLink
            activeClassName='Menu-link--active'
            className='Menu-link'
            exact
            to={ path.stocks }
          >
            Home
          </NavLink>
          <NavLink
            activeClassName='Menu-link--active'
            className='Menu-link'
            to={ path.about }
          >
            About
          </NavLink>
        </div>
      </div>
    );
  }
}
