import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'light-content'} />
      <View style={styles.content}>
        <Text style={styles.title}>Gym OS</Text>
        <Text style={styles.subtitle}>Mobil Uygulamasına Hoş Geldiniz!!!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e', // Koyu bir arkaplan
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 20,
    color: '#a0a0a0',
  },
});

export default App;
