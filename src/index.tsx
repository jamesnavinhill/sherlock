import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* v7 is the default behavior in react-router 7; the v6 future flags are gone. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
