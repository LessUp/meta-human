import { ServicesProvider } from '@/services';
import AdvancedDigitalHumanPage from '@/pages/AdvancedDigitalHumanPage';

export default function AdvancedDigitalHumanAppPage() {
  return (
    <ServicesProvider>
      <AdvancedDigitalHumanPage />
    </ServicesProvider>
  );
}
