// This file MUST be imported before any other imports in the app entry point.
// Web3Auth requires Buffer and crypto.getRandomValues which don't exist in React Native.
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
