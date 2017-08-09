import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Stocks from 'views/Stocks';
import About from 'views/About';
import History from 'views/History';
import NotFound from 'views/NotFound';

const publicPath = '/';

export const routeCodes = {
  STOCKS: publicPath,
  ABOUT: `${ publicPath }about`,
  HISTORY: `${ publicPath }History`
};

export default () => (
  <Switch>
    <Route exact path={ publicPath } component={ Stocks } />
    <Route path={ routeCodes.ABOUT } component={ About } />
    <Route path={ routeCodes.History } component={ History } />
    <Route path='*' component={ NotFound } />
  </Switch>
);
