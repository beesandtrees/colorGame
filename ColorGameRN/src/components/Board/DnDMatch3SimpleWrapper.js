import React from 'react';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import DnDMatch3Simple from './DnDMatch3Simple';
import { updateClicks, updateScore, updateMatchesMade } from '../../actions';

const DnDMatch3SimpleWrapper = (props) => {
  return (
    <View style={styles.container}>
      <DnDMatch3Simple 
        updateClicks={props.updateClicks}
        updateScore={props.updateScore}
        updateMatchesMade={props.updateMatchesMade}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const mapStateToProps = (state) => ({
  game: state.gameReducer
});

export default connect(mapStateToProps, {
  updateClicks,
  updateScore,
  updateMatchesMade
})(DnDMatch3SimpleWrapper);