import React, { Component } from "react";
import {
  StyleSheet,
  Image,
  PanResponder,
  StatusBar,
  Text,
  Animated,
  TouchableOpacity,
  View
} from "react-native";
import Main from "./Main";
import Expo from "expo";
import TouchableBounce from "react-native/Libraries/Components/Touchable/TouchableBounce";

import cacheAssetsAsync from "./util/cacheAssetsAsync";
import arrayFromObject from "./util/arrayFromObject";
import DirectionType from "./enums/Direction";

import Maps from "./Maps";
import Models from "./Models";

import Weapon from "./enums/Weapon";

const { TapGestureHandler, State } = Expo.DangerZone.GestureHandler;

const icons = {
  rocket: require("./assets/images/missile.png"),
  explosive: require("./assets/images/grenade.png"),
  shotgun: require("./assets/images/shotgun.png"),
  none: require("./assets/images/fist.png")
};

export default class App extends React.Component {
  state = { assetsLoaded: false, loaded: false };

  async componentWillMount() {
    // await this._preload();
    this.setState({ assetsLoaded: true });
  }
  async _preload() {
    const files = arrayFromObject(Models).concat(arrayFromObject(Maps));
    return await cacheAssetsAsync({
      files: files
    });
  }

  render() {
    if (!this.state.assetsLoaded) {
      return <Loading />;
    }
    const pressIn = id => {
      if (this.state.game) {
        this.state.game.player.controls[id] = true;
      }
    };
    const pressOut = id => {
      if (this.state.game) {
        this.state.game.player.controls[id] = null;
      }
    };
    //jump
    //die
    //none
    const rightButtonMap = {
      top: "explosive",
      left: "shotgun",
      middle: "fire",
      right: "rocket",
      bottom: "die"
    };

    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden={false} />
        {<Main onLoaded={game => this.setState({ loaded: true, game })} />}
        <Button
          pressOut={pressOut}
          pressIn={pressIn}
          id="die"
          style={{
            width: 25,
            height: 25,
            borderRadius: 12.5,
            position: "absolute",
            top: 20,
            left: 8
          }}
        />

        <FooterControls
          onHotBarPress={item => {
            this.setState({ selected: item });
            this.state.game.player.weapon = item;
          }}
          selected={this.state.selected}
          pressIn={pressIn}
          pressOut={pressOut}
          items={Object.keys(Weapon)}
        />

        {!this.state.loaded && <Loading />}
      </View>
    );
  }
}

class Loading extends React.PureComponent {
  render() {
    return (
      <View
        style={StyleSheet.flatten([
          StyleSheet.absoluteFill,
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#056ecf"
          }
        ])}
      >
        <TouchableBounce
          style={{
            aspectRatio: 1,
            height: "60%",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Image
            style={{ aspectRatio: 1, height: "100%", resizeMode: "contain" }}
            source={require("./assets/icons/loading-icon.png")}
          />
        </TouchableBounce>
      </View>
    );
  }
}

class Button extends React.PureComponent {
  _onSingleTap = ({ nativeEvent: { state } }) => {
    const { pressIn, id, pressOut } = this.props;

    switch (state) {
      case State.BEGAN:
        pressIn(id);
        break;
      case State.ACTIVE:
        pressOut(id);
        break;
      default:
        break;
    }
  };

  render() {
    const { style, id } = this.props;
    return (
      <TapGestureHandler onHandlerStateChange={this._onSingleTap}>
        <View
          style={[
            {
              flex: 1,
              aspectRatio: 1,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderRadius: 3
            },
            style
          ]}
        >
          {icons.hasOwnProperty(id) && (
            <Image
              source={icons[id]}
              style={{ flex: 1, resizeMode: "contain" }}
            />
          )}
        </View>
      </TapGestureHandler>
    );
  }
}

export class DPad extends React.Component {
  static defaultProps = {
    buttonMap: {
      top: DirectionType.forward,
      left: DirectionType.left,
      middle: DirectionType.up,
      right: DirectionType.right,
      bottom: DirectionType.backward
    }
  };

  render() {
    const { pressIn, pressOut, style, buttonMap } = this.props;
    return (
      <View pointerEvents={"box-none"} style={[styles.container, style]}>
        <View
          pointerEvents={"box-none"}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Button pressOut={pressOut} pressIn={pressIn} id={buttonMap.top} />
        </View>
        <View pointerEvents={"box-none"} style={{ flexDirection: "row" }}>
          <Button pressOut={pressOut} pressIn={pressIn} id={buttonMap.left} />
          <Button pressOut={pressOut} pressIn={pressIn} id={buttonMap.middle} />
          <Button pressOut={pressOut} pressIn={pressIn} id={buttonMap.right} />
        </View>
        <View
          pointerEvents={"box-none"}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Button pressOut={pressOut} pressIn={pressIn} id={buttonMap.bottom} />
        </View>
      </View>
    );
  }
}

export class FooterControls extends Component {
  render() {
    const { pressIn, pressOut, items, onHotBarPress, selected } = this.props;
    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 8,
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "flex-end"
        }}
      >
        <DPad pressIn={pressIn} pressOut={pressOut} />
        <HotBar items={items} selected={selected} onPress={onHotBarPress} />
        <RightControls pressIn={pressIn} pressOut={pressOut} />
      </View>
    );
  }
}

const HotBar = ({ items, selected, onPress }) => (
  <View
    style={[
      styles.uiComponent,
      {
        flexDirection: "row",
        borderRadius: 4,
        height: 50
      }
    ]}
  >
    {items.map((item, index) => {
      return (
        <View
          key={index}
          style={{
            transform: [{ scale: item === selected ? 1 : 0.6 }],
            aspectRatio: 1,
            minWidth: 50
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              onPress(item);
            }}
          >
            <Image
              source={icons[item]}
              style={{ flex: 1, width: 50, height: 50, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      );
    })}
  </View>
);

const RightControls = ({ pressIn, pressOut, style }) => (
  <View style={[{ aspectRatio: 1, width: 100 }, style]}>
    <View style={{ alignItems: "flex-end", flex: 1 }}>
      <Button
        style={styles.roundButton}
        id="fire"
        pressIn={pressIn}
        pressOut={pressOut}
      />
    </View>
    <View style={{ alignItems: "flex-start", flex: 1 }}>
      <Button
        style={styles.roundButton}
        id="explosive"
        pressIn={pressIn}
        pressOut={pressOut}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    height: 100,
    aspectRatio: 1
  },
  uiComponent: {},
  button: {
    aspectRatio: 1
  },
  roundButton: {
    width: 50,
    aspectRatio: 1,
    borderRadius: 25
  }
});
