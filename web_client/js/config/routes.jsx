import React from 'react';
import { Route, Switch } from 'react-router-dom';

import About from 'views/About';
import History from 'views/History';
import NotFound from 'views/NotFound';
import Stocks from 'views/Stocks';

const publicPath = '/';

export const routeCodes = {
  STOCKS: publicPath,
  AAPL: `${ publicPath }AAPL`,
  ABC: `${ publicPath }ABC`,
  MSFT: `${ publicPath }MSFT`,
  TSLA: `${ publicPath }TSLA`,
  F: `${ publicPath }F`,
  ABOUT: `${ publicPath }about`,
  HISTORY: `${ publicPath }History`
};

export default () => (
  <Switch>
    <Route exact path={ publicPath } component={ Stocks } />
    <Route path={ routeCodes.ABOUT } component={ About } />
    <Route path={ routeCodes.HISTORY } component={ History } />
    <Route exact path={ routeCodes.AAPL } component={ History } />
    <Route exact path={ routeCodes.ABC } component={ History } />
    <Route exact path={ routeCodes.MSFT } component={ History } />
    <Route exact path={ routeCodes.TSLA } component={ History } />
    <Route exact path={ routeCodes.F } component={ History } />
    <Route path='*' component={ NotFound } />
  </Switch>
);
