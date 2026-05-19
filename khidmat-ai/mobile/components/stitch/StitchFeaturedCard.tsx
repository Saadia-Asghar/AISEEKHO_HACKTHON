import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { stitchAssets } from '../../constants/stitchDesign';

export default function StitchFeaturedCard() {
  return (
    <Pressable style={styles.wrap} onPress={() => router.push('/browse')}>
      <Image source={{ uri: stitchAssets.featuredHero }} style={styles.image} resizeMode="cover" />
      <View style={styles.gradient} />
      <View style={styles.content}>
        <View style={styles.textCol}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified Pros</Text>
          </View>
          <Text style={styles.title}>Express Maintenance</Text>
        </View>
        <View style={styles.arrow}>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 208,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19,19,21,0.55)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textCol: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.jade,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: fonts.body,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: { color: colors.onPrimaryContainer, fontSize: 20, fontWeight: '700' },
});
