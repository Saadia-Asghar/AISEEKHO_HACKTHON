import { type ReactNode } from 'react';
import PageHeader from './PageHeader';

/** Gradient page title — matches education/fitness kit headers */
export default function ScreenGuide({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return <PageHeader title={title} subtitle={subtitle} onBack={onBack} right={right} />;
}
