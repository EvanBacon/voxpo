import Expo from 'expo';
import React from 'react';
import ExpoTHREE from 'expo-three';
import Game from './js/Game';
import ThreeView from './ThreeView';

import './Three';
import './window/domElement';
import './window/resize';
import Touches from './window/Touches';

const AR = false;

class App extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    const {props, state} = this;
    return false;
  }
  
  render = () => (
    <ThreeView
      style={{ flex: 1 }}
      onContextCreate={this._onContextCreate}
      render={this._animate}
      enableAR={AR}
    />
  );

  _onContextCreate = async (gl, arSession) => {
    this.game = new Game(gl);
    await this.game.init();
    window.addEventListener('resize', this._onWindowResize, false);
    this.props.onLoaded(this.game);
  }


  _onWindowResize = () => {
    this.game.onWindowResize();
  }

  _animate = (delta) => { 
    this.game.animate(delta);
  }
}

// Wrap Touches Event Listener
const TouchesComponent = Touches(App);

export default TouchesComponent;