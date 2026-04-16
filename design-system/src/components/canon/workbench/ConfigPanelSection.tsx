import { ContentSection, type ContentSectionProps } from '../surfaces/ContentSection';
import { cx } from '../utils/cx';

export interface ConfigPanelSectionProps extends ContentSectionProps {}

export function ConfigPanelSection({ className, ...props }: ConfigPanelSectionProps) {
  return <ContentSection className={cx('ds-config-panel-section', className)} {...props} />;
}
