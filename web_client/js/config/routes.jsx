import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import About from 'components/About';
import History from 'components/History';
import NotFound from 'components/NotFound';
import Stocks from 'containers/Stocks';

const rootPath = '/';

export const path = {
  stocks: rootPath,
  about: `${ rootPath }about`,
  docs: `${ rootPath }docs`,
  history: `${ rootPath }history`
};

export default () => (
  <Switch>
    <Route exact path={ rootPath } component={ Stocks } />
    <Route path={ path.about } component={ About } />
    <Route path={ path.docs } render= { () => (window.location.assign('/docs/index.html')) } />
    <Route path={ path.history } component={ History } />
    <Route path='*' component={ NotFound } />
  </Switch>
);
