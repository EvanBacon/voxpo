import Expo from "expo";
import React from "react";
import ExpoTHREE from "expo-three";
import Game from "./game/Game";
import ThreeView from "./ThreeView";
import { View, Dimensions } from "react-native";
import "./Three";
import "./window/domElement";
import "./window/resize";
import Touches from "./window/Touches";

const AR = false;

const { PanGestureHandler, State } = Expo.DangerZone.GestureHandler;

export default class App extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;
    return false;
  }
  _onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this.game.player.touchEnd();
    }
  };

  render = () => (
    <PanGestureHandler
      id="pan"
      onGestureEvent={({ nativeEvent: { translationX, translationY } }) => {
        this.game.player.touchMove({ dx: translationX, dy: translationY });
      }}
      onHandlerStateChange={this._onHandlerStateChange}
    >
      <View style={{ flex: 1 }}>
        <ThreeView
          pointerEvents="none"
          style={{ flex: 1 }}
          onContextCreate={this._onContextCreate}
          render={this._animate}
          enableAR={AR}
        />
      </View>
    </PanGestureHandler>
  );

  _onContextCreate = async (gl, arSession) => {
    this.game = new Game(gl);
    await this.game.init();
    Dimensions.addEventListener(
      "change",
      ({ screen: { width, height, scale } }) => {
        this.game.onResize({ width, height, scale });
      }
    );

    this.props.onLoaded(this.game);
  };

  _animate = delta => {
    this.game.animate(delta);
  };
}
