import React from "react";
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
const { TapGestureHandler, State } = Expo.DangerZone.GestureHandler;

export default class App extends React.Component {
  state = { assetsLoaded: false, loaded: true };

  constructor() {
    super();
    this._translateX = new Animated.Value(0);
    this._translateY = new Animated.Value(0);
    this._lastOffset = { x: 0, y: 0 };
    this._onGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationX: this._translateX,
            translationY: this._translateY
          }
        }
      ],
      { useNativeDriver: false }
    );
  }
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
    const pressIn = direction => {
      if (this.state.game) {
        this.state.game.player.controls[direction] = true;
      }
    };
    const pressOut = direction => {
      if (this.state.game) {
        this.state.game.player.controls[direction] = null;
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

    // {<Main onLoaded={game => this.setState({ loaded: true, game })} />}
    // 
    //
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden={false} />


        {<FooterControls />}
        <Dpad
          onPress={pressIn}
          onPressOut={pressOut}
          style={{ position: "absolute", bottom: 8, left: 8 }}
        />
        <Dpad
          buttonMap={rightButtonMap}
          style={{ position: "absolute", bottom: 8, right: 8 }}
          onPress={pressIn}
          onPressOut={pressOut}
        />
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
    const { onPress, id, onPressOut } = this.props;

    switch (state) {
      case State.BEGAN:
        onPress(id);
        break;
      case State.ACTIVE:
        onPressOut(id);
        break;
      default:
        break;
    }
  };

  render() {
    const size = 50 - 4;
    const { style, onPress, id, onPressOut } = this.props;
    return (
      <View
        style={[style, { padding: 2 }]}>
        <TapGestureHandler onHandlerStateChange={this._onSingleTap}>
          <View
            style={{
              width: size,
              height: size,
              backgroundColor: "rgba(128, 128, 128, 0.6)",
              borderRadius: 3
            }}
          />
        </TapGestureHandler>
      </View>
    );
  }
}

export class Dpad extends React.Component {
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
    const { onPress, onPressOut, style, buttonMap } = this.props;
    return (
      <View pointerEvents={"box-none"} style={[styles.container, style]}>
        <View
          pointerEvents={"box-none"}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Button
            onPressOut={onPressOut}
            onPress={onPress}
            id={buttonMap.top}
          />
        </View>
        <View pointerEvents={"box-none"} style={{ flexDirection: "row" }}>
          <Button
            onPressOut={onPressOut}
            onPress={onPress}
            id={buttonMap.left}
          />
          <Button
            onPressOut={onPressOut}
            onPress={onPress}
            id={buttonMap.middle}
          />
          <Button
            onPressOut={onPressOut}
            onPress={onPress}
            id={buttonMap.right}
          />
        </View>
        <View
          pointerEvents={"box-none"}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Button
            onPressOut={onPressOut}
            onPress={onPress}
            id={buttonMap.bottom}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    height: 50 * 3,
    width: 50 * 3
  },
  uiComponent: {
    backgroundColor: 'gray',
  },
  button: {
    aspectRatio: 1,
  },
  roundButton: {
    width: 50,
    borderRadius: 25,
  },

});

export default class FooterControls extends Component {
  render() {
    const items = [
      {
        name: 'rocket',
        id: 'rocket',
        selected: true,
      },
      {
        name: 'hand',
        id: 'hand',
        selected: false,
      }
    ];
    return (
        <View
          style={{
            position: 'absolute',
            backgroundColor: 'red',
            bottom: 0,
            left: 0,
            right: 0,
            paddding: 24,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'flex-end'
          }}>

          <DPad />
          <HotBar items={items}/>
          <RightControls />
        </View>
    );
  }
}

const HotBar = ({items}) => (
  <View style={[styles.uiComponent, {alignItems: 'stretch', height: 50, flexDirection: 'row', borderRadius: 4}]}>
    {
      items.map((item, index) => {
        return (
          <Button key={index} style={{ borderWidth: item.selected ? 5 : 1, borderColor: 'white' }} />
          )
      })
    }
  </View>
  );


const RightControls = ({ pressIn, pressOut, style }) => (
  <View style={[{ aspectRatio: 1, width: 100, backgroundColor: 'rbga(255,255,255,100)' }, style]}>
    <View style={{ alignItems: 'flex-end', flex: 1 }}>
      <Button
        style={styles.roundButton}
        id="a"
        pressIn={pressIn}
        pressOut={pressOut}
      />
    </View>
    <View style={{ alignItems: 'flex-start', flex: 1 }}>
      <Button
        style={styles.roundButton}
        id="b"
        pressIn={pressIn}
        pressOut={pressOut}
      />
    </View>
  </View>
);

export class Button extends Component {
  render() {
    return (
      <View style={[styles.uiComponent, styles.button, this.props.style]} />
    );
  }
}

