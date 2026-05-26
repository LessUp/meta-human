import { ServicesProvider } from '@/core/services';
import AdvancedDigitalHumanPage from '@/pages/AdvancedDigitalHumanPage';

export default function AdvancedDigitalHumanAppPage() {
  return (
    <ServicesProvider>
      <AdvancedDigitalHumanPage />
    </ServicesProvider>
  );
}
