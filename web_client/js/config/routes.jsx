import React from 'react';
import { Route, Switch } from 'react-router-dom';

import About from 'components/About';
import History from 'components/History';
import NotFound from 'components/NotFound';
import Stocks from 'containers/Stocks';

const publicPath = '/';

export const routeCodes = {
  STOCKS: publicPath,
  ABOUT: `${ publicPath }about`,
  HISTORY: `${ publicPath }history`
};

export default () => (
  <Switch>
    <Route exact path={ publicPath } component={ Stocks } />
    <Route path={ routeCodes.ABOUT } component={ About } />
    <Route path={ routeCodes.HISTORY } component={ History } />
    <Route path='*' component={ NotFound } />
  </Switch>
);
