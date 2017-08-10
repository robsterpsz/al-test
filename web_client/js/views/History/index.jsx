import io from 'socket.io-client';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { feedError, feedStart, feedSuccess, newStock, setProp } from 'actions/app';
import { routeCodes } from '../../config/routes.jsx';
import { toJS } from 'immutable';

@connect(state => ({
  AAPL: state.app.AAPL,
  ABC: state.app.ABC,
  F: state.app.F,
  MSFT: state.app.MSFT,
  TSLA: state.app.TSLA
}))

export default class History extends Component {

  static propTypes = {
    AAPL: PropTypes.array,
    ABC: PropTypes.array,
    F: PropTypes.array,
    MSFT: PropTypes.array,
    selectedStock: PropTypes.string,
    TSLA: PropTypes.array,
    dispatch: PropTypes.func
  }

  constructor() {
    super();
    this.setPropClick = this.setPropClick.bind(this);
  }

  componentWillUnmount() {
     const { dispatch } = this.props;
     dispatch(setProp('selectedStock', ''));
  }

  setPropClick(key, value) {
    const { dispatch } = this.props;
    dispatch(setProp(key, value));
  }

  render() {
    return (
      <div>
        <h3>{this.props.selectedStock}
          <button
            className='Button-link'
            onTouchTap={ () => this.setPropClick('selectedStock', '') }
          >
            Close
          </button>
        </h3>
        <div className='Example'>
          {this.props[this.props.selectedStock].map((item, i) => {
            return (<div key={i}>
              id: {item.id}
              t: {item.t}
              e: {item.e}
              l: {item.l}
              l_fix: {item.l_fix}
              l_cur: {item.l_cur}
              s: {item.s}
              ltt: {item.ltt}
              lt: {item.lt}
              lt_dts: {item.lt_dts}
              c: {item.c}
              c_fix: {item.c_fix}
              cp: {item.cp}
              cp_fix: {item.cp_fix}
              ccol: {item.ccol}
              pcls_fix: {item.pcls_fix}
              el:{item.el}
              el_fix: {item.el_fix}
              el_cur: {item.el_cur}
              elt: {item.elt}
              ec: {item.ec}
              ec_fix: {item.ec_fix}
              ecp: {item.ecp}
              ecp_fix: {item.ecp_fix}
              eccol: {item.eccol}
              div: {item.div}
              yld: {item.yld}
              <hr />
              </div>)
          })}
        </div>
      </div>
    );
  }
}


