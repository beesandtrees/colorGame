import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';
import PrototypeApp from './PrototypeApp';

// Check if we're running the prototype version
// On development, check for a custom parameter
const runPrototype = process.env.PROTOTYPE === 'true' || 
  (Platform.OS === 'web' && window.location.search.includes('prototype=true'));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(runPrototype ? PrototypeApp : App);

console.log(`Running ${runPrototype ? 'PROTOTYPE' : 'REGULAR'} version of the app`);
