import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Main from './Main';
import Expo from 'expo';
export default class App extends React.Component {
  state = {}
  render() {
    // if (!this.state.loaded) {
    //   return <Expo.AppLoading />
    // }
    return (
      <View style={{ flex: 1 }}>

        <Main onLoaded={game => {
          this.setState({ loaded: true, game })
        }} />
        <Dpad onPress={direction => {
          if (this.state.game) {
            this.state.game.player.controls[direction] = true;
          }
        }} onPressOut={direction => {
          if (this.state.game) {
            this.state.game.player.controls[direction] = null;
          }
        }} style={{ position: 'absolute', bottom: 8, left: 8 }} />
        <Dpad style={{ position: 'absolute', bottom: 8, right: 8 }}  onPress={direction => {
          if (this.state.game) {
            this.state.game.player.controls["rocket"] = true;
          }
        }} onPressOut={direction => {
          if (this.state.game) {
            this.state.game.player.controls["rocket"] = null;
          }
        }}/>
      </View>
    );
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
  render() {
    const { onPress, onPressOut, style } = this.props
    return (
      <View pointerEvents={'box-none'} style={[styles.container, style]}>
        <View pointerEvents={'box-none'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.forward}
          />
        </View>
        <View pointerEvents={'box-none'} style={{ flexDirection: 'row' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.left}
          />
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.up}
          />
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.right}
          />
        </View>
        <View pointerEvents={'box-none'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.backward}
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