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

    //
    //
    // <Dpad
    //   onPress={pressIn}
    //   onPressOut={pressOut}
    //   style={{ position: "absolute", bottom: 8, left: 8 }}
    // />
    // <Dpad
    //   buttonMap={rightButtonMap}
    //   style={{ position: "absolute", bottom: 8, right: 8 }}
    //   onPress={pressIn}
    //   onPressOut={pressOut}
    // />
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden={false} />
        {<Main onLoaded={game => this.setState({ loaded: true, game })} />}
        {
          <FooterControls
            onHotBarPress={item => {
              console.warn(item, this.state.game.player.weapon);
              this.setState({ selected: item });
              this.state.game.player.weapon = item;
            }}
            selected={this.state.selected}
            pressIn={pressIn}
            pressOut={pressOut}
            items={Object.keys(Weapon)}
          />
        }

        {!this.state.loaded && <Loading />}
      </View>
    );
  }
}
class Loading extends React.PureComponent {
  render() {
    return (
      <Expo.LinearGradient
        style={StyleSheet.flatten([
          StyleSheet.absoluteFill,
          { flex: 1, justifyContent: "center", alignItems: "center" }
        ])}
        colors={["#4c669f", "#3b5998", "#056ecf"]}
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
      </Expo.LinearGradient>
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
    const size = 32;
    const { style } = this.props;
    return (
      <TapGestureHandler onHandlerStateChange={this._onSingleTap}>
        <View
          style={[
            {
              margin: 1,
              width: size,
              height: size,
              backgroundColor: "rgba(128, 128, 128, 0.6)",
              borderRadius: 3
            },
            style
          ]}
        >
          {icons.hasOwnProperty(id) && (
            <Image
              source={icons[id]}
              style={{ flex: 1, backgroundColor: "red", resizeMode: "contain" }}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    height: 100,
    aspectRatio: 1
  },
  uiComponent: {
    backgroundColor: "gray"
  },
  button: {
    aspectRatio: 1
  },
  roundButton: {
    width: 50,
    aspectRatio: 1,
    borderRadius: 25
  }
});

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
            borderWidth: item === selected ? 5 : 1,
            borderColor: "white",
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
            <View style={{ flex: 1, backgroundColor: "gray" }} />
          </TouchableOpacity>
        </View>
      );
    })}
  </View>
);

const RightControls = ({ pressIn, pressOut, style }) => (
  <View
    style={[
      { aspectRatio: 1, width: 100, backgroundColor: "rgba(255,255,255,0.5)" },
      style
    ]}
  >
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
