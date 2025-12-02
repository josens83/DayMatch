export { colors, type ColorKey } from './colors';
export { typography, fontSize, fontWeight, lineHeight, fontFamily } from './typography';
export { spacing, borderRadius, shadow } from './spacing';

export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  shadow: require('./spacing').shadow,
};

export default theme;
