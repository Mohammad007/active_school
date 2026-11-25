/** Compact type scale: body 14-15, titles 17-20. System font. */
export const Font = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const Type = {
  display: { fontSize: 22, lineHeight: 28, fontWeight: Font.bold, letterSpacing: -0.3 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: Font.bold, letterSpacing: -0.2 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: Font.semibold },
  subheading: { fontSize: 15, lineHeight: 20, fontWeight: Font.semibold },
  bodyLg: { fontSize: 15, lineHeight: 22, fontWeight: Font.regular },
  body: { fontSize: 14, lineHeight: 20, fontWeight: Font.regular },
  small: { fontSize: 13, lineHeight: 18, fontWeight: Font.regular },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: Font.regular },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: Font.medium },
  button: { fontSize: 15, lineHeight: 20, fontWeight: Font.semibold },
  stat: { fontSize: 18, lineHeight: 22, fontWeight: Font.bold },
} as const;
