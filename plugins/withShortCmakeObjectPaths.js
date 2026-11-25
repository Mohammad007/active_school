/**
 * Windows build fix: keep native (C++) object-file paths under 260 characters.
 *
 * Expo's root Gradle plugin passes -DCMAKE_OBJECT_PATH_MAX=1024 to every native
 * module, which stops CMake from shortening object paths. With the project at
 * D:\activeschool\active_school_app, libraries such as react-native-reanimated
 * then produce paths like
 *   ...\.cxx\RelWithDebInfo\<hash>\arm64-v8a\CMakeFiles\reanimated.dir\D_\activeschool\...\file.cpp.o
 * longer than Windows' MAX_PATH, and the Ninja bundled with AGP's CMake 3.22.1
 * fails with "ninja: error: mkdir(...): No such file or directory".
 *
 * Expo's documented switch for this is the `expo.android.cmakeObjectPathMax`
 * Gradle property. 258 (Windows' real limit is 259) makes CMake hash over-long
 * object paths so they fit; a lower value fails for files whose hashed path
 * is still ~250 characters (gesture-handler codegen in the app module).
 * Harmless on macOS/Linux/EAS, where paths are short anyway.
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'expo.android.cmakeObjectPathMax';
const VALUE = '258';

module.exports = function withShortCmakeObjectPaths(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === KEY));
    cfg.modResults.push({ type: 'property', key: KEY, value: VALUE });
    return cfg;
  });
};
