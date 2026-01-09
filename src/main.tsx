import React from 'react';
import ReactDOM from 'react-dom';
import { FluentProvider, webDarkTheme } from '@fluentui/react-components';
import './index.css';
import './plugins/i18n';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <FluentProvider theme={webDarkTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
