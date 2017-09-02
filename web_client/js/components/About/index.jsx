import React, { Component } from 'react';

export default class About extends Component {
  render() {
    return (
      <div className='About'>
        <h1>About This</h1>
        <p>
          <a href='https://robsterlabs.herokuapp.com'>Robster</a> is cooking.
        </p>
        <p>
          If you want to see code, you may look at <a href='./docs/index.html' target='_blank'>Docs</a>.
        </p>
        <p>
          Or you may visit <a href='https://github.com/robsterpsz/al-test'>GitHub</a> for more info.
        </p>
      </div>
    );
  }
}
