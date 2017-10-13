import React from 'react';
import { StyleSheet, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Main from './Main';
import Expo from 'expo';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

import cacheAssetsAsync from './util/cacheAssetsAsync';
import arrayFromObject from './util/arrayFromObject';

import Maps from './Maps'
import Models from './Models'
export default class App extends React.Component {
  state = { assetsLoaded: false }

  async componentWillMount() {
    await this._preload();
    this.setState({ assetsLoaded: true })
  }
  async _preload() {
    const files = arrayFromObject(Models).concat(arrayFromObject(Maps));
    return await cacheAssetsAsync({
      files: files
    })
  }

  render() {
    if (!this.state.assetsLoaded) {
      return (<Loading />);
    }
    const pressIn = direction => {
      if (this.state.game) {
        this.state.game.player.controls[direction] = true;
      }
    }
    const pressOut = direction => {
      if (this.state.game) {
        this.state.game.player.controls[direction] = null;
      }
    }
    //jump
    //die
    //none
    const rightButtonMap = {
      top: "explosive",
      left: "shotgun",
      middle: "fire",
      right: "rocket",
      bottom: "die",
    }
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden={false} />
        <Main onLoaded={game => this.setState({ loaded: true, game })} />
        <Dpad onPress={pressIn} onPressOut={pressOut} style={{ position: 'absolute', bottom: 8, left: 8 }} />
        <Dpad buttonMap={rightButtonMap} style={{ position: 'absolute', bottom: 8, right: 8 }} onPress={pressIn} onPressOut={pressOut} />
        {!this.state.loaded && <Loading />}

      </View>
    );
  }
}


class Loading extends React.PureComponent {
  render() {
    return (
      <Expo.LinearGradient style={StyleSheet.flatten([StyleSheet.absoluteFill, { flex: 1, justifyContent: 'center', alignItems: 'center' }])} colors={['#4c669f', '#3b5998', '#056ecf']}>
        <TouchableBounce style={{ aspectRatio: 1, height: "60%", alignItems: 'center', justifyContent: 'center' }}><Image style={{ aspectRatio: 1, height: "100%", resizeMode: 'contain' }} source={require('./assets/icons/loading-icon.png')} /></TouchableBounce>
      </Expo.LinearGradient>
    )
  }
}

class Button extends React.PureComponent {
  render() {
    const size = 50 - 4
    const { style, onPress, id, onPressOut } = this.props
    return (
      <TouchableOpacity style={[style, { padding: 2 }]} onPressOut={_ => onPressOut(id)} onPressIn={_ => { onPress(id) }}>
        <View style={{ width: size, height: size, backgroundColor: 'rgba(128, 128, 128, 0.6)', borderRadius: 3 }}>
        </View>
      </TouchableOpacity>
    )
  }
}

import DirectionType from './js/Direction'
export class Dpad extends React.Component {
  static defaultProps = {
    buttonMap: {
      top: DirectionType.forward,
      left: DirectionType.left,
      middle: DirectionType.up,
      right: DirectionType.right,
      bottom: DirectionType.backward,
    }
  }
  render() {
    const { onPress, onPressOut, style, buttonMap } = this.props
    return (
      <View pointerEvents={'box-none'} style={[styles.container, style]}>
        <View pointerEvents={'box-none'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={buttonMap.top}
          />
        </View>
        <View pointerEvents={'box-none'} style={{ flexDirection: 'row' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={buttonMap.left}
          />
          <Button onPressOut={onPressOut} onPress={onPress} id={buttonMap.middle}
          />
          <Button onPressOut={onPressOut} onPress={onPress} id={buttonMap.right}
          />
        </View>
        <View pointerEvents={'box-none'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={buttonMap.bottom}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    height: 50 * 3,
    width: 50 * 3
  }
});