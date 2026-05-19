import StitchLoadingOverlay from './stitch/StitchLoadingOverlay';

/** Discover / search loading — Stitch `loading_state` */
export default function ShimmerOverlay({
  visible,
  subtitle,
}: {
  visible: boolean;
  subtitle?: string;
}) {
  return <StitchLoadingOverlay visible={visible} subtitle={subtitle} />;
}
