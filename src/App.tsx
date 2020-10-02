import React from 'react';

import './App.css';

const App = () => {
  console.log(process.env.ENV_TEST_VAR);
  return (
    <div className="App">
      <h1>App</h1>
    </div>
  );
};

export default App;
