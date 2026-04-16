import { OverlaySection, type OverlaySectionProps } from '../surfaces/OverlaySection';
import { cx } from '../utils/cx';

export interface ConfigPanelSectionProps extends OverlaySectionProps {}

export function ConfigPanelSection({ className, ...props }: ConfigPanelSectionProps) {
  return <OverlaySection className={cx('ds-config-panel-section', className)} {...props} />;
}
