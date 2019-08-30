import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './index.css';
import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import { createStore } from 'redux';
import reducers from './reducers';

const store = createStore(reducers);
export default store;

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

serviceWorker.register();
