import { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import HazirLogo from '../components/HazirLogo';
import HapticPressable from '../components/HapticPressable';
import { BRAND, TAGLINE, FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { setOnboardingDone } from '../storage/authStorage';

const SLIDES = [
  {
    title: 'You speak, we do',
    body: 'Describe any home service in Urdu, Roman Urdu, or English. HazirAI agents find the right worker.',
  },
  {
    title: 'Trusted pros near you',
    body: 'Ratings, verified badges, and PKR pricing across G-9, G-13, F-7, F-10, and I-8.',
  },
  {
    title: 'Book in one tap',
    body: 'Confirm instantly, get your code, and track every agent step in the trace timeline.',
  },
];

type Props = { onComplete: () => void };

export default function OnboardingScreen({ onComplete }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const width = Dimensions.get('window').width;

  const finish = async () => {
    await setOnboardingDone();
    onComplete();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <HazirLogo size={80} />
            <Text style={[styles.brand, { color: colors.primary, fontFamily: FONT_BOLD }]}>{BRAND}</Text>
            <Text style={[styles.tag, { color: colors.muted, fontFamily: FONT_REGULAR }]}>{TAGLINE}</Text>
            <Text style={[styles.title, { color: colors.text, fontFamily: FONT_BOLD }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.muted, fontFamily: FONT_REGULAR }]}>{item.body}</Text>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.primary : colors.border,
                shadowColor: i === index ? colors.primary : 'transparent',
                shadowOpacity: i === index ? 0.6 : 0,
                shadowRadius: 6,
              },
            ]}
          />
        ))}
      </View>
      <HapticPressable
        haptic="medium"
        style={[
          styles.btn,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
            shadowRadius: 12,
          },
        ]}
        onPress={() => {
          if (index < SLIDES.length - 1) {
            ref.current?.scrollToIndex({ index: index + 1 });
          } else {
            finish();
          }
        }}
      >
        <Text style={[styles.btnText, { fontFamily: FONT_BOLD }]}>
          {index < SLIDES.length - 1 ? 'Next' : 'Get started'}
        </Text>
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { padding: 28, paddingTop: 60, alignItems: 'center' },
  brand: { fontSize: 22, fontWeight: '800', marginTop: 16 },
  tag: { fontSize: 13, marginTop: 4, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btn: { margin: 20, padding: 16, borderRadius: RADIUS_XL, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
