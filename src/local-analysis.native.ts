import { requireOptionalNativeModule } from 'expo';
import { photoUri } from './photos';
import { Evidence } from './analysis-domain';
const native = requireOptionalNativeModule<{ analyzeImage?: (source: string) => Promise<Evidence> }>('KombiqoCutout');
export async function localEvidence(source: string): Promise<Evidence> {
  return native?.analyzeImage ? native.analyzeImage(photoUri(source)) : {};
}
