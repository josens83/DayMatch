import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
};

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const typography = {
  h1: {
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight['3xl'],
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight['2xl'],
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semiBold,
  },
  h4: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semiBold,
  },
  subtitle1: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.medium,
  },
  subtitle2: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.medium,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  body1: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  body2: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
  },
  button: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.semiBold,
  },
};
