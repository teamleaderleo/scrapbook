import { inter } from '@/components/ui/assets/fonts';
import { Layers } from 'lucide-react';

export default function AcmeLogo() {
  return (
    <div className={`${inter.className} flex items-center space-x-2 text-white`}>
      <Layers className="h-8 w-8" />
      <span className="text-2xl font">Setzen</span>
    </div>
  );
}