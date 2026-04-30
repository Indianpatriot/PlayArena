import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from './theme';

export const GlobalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  screenPadding: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Typography
  displayText: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.black,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  headingXL: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headingLG: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headingMD: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  bodyBase: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.base * 1.6,
  },
  bodySm: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.regular,
    color: Colors.textSecondary,
  },
  accentText: {
    color: Colors.neonGreen,
    fontWeight: Typography.fontWeights.semibold,
  },

  // Cards
  glassCard: {
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    flex: 1,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.neonGreenGlow,
    borderWidth: 1,
    borderColor: Colors.neonGreen,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
