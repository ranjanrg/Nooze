declare module 'react-native-keep-awake' {
  interface KeepAwake {
    activate(): void;
    deactivate(): void;
  }
  
  const KeepAwake: KeepAwake;
  export default KeepAwake;
} 