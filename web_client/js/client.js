import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';
import 'babel-polyfill';

import configureStore from 'config/store';
import Client from 'components/Client';

//import es6Promise from 'es6-promise';
//import 'isomorphic-fetch';

// Load SCSS
import '../scss/app.scss';

//es6Promise.polyfill();

import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

configureStore().then((store) => {

  const render = Component => {
    ReactDOM.render(
      <AppContainer>
        <Provider store={ store }>
          <Component />
        </Provider>
      </AppContainer>,
      document.getElementById('root')
    );
  };

  // Render app
  render(Client);

  if (module.hot) {
    module.hot.accept('./components/Client/', () => {
      const NewClient = require('./components/Client/index').default; // eslint-disable-line global-require

      render(NewClient);
    });
  }

});
