
import React from 'react';
import { XCircleIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
            {children}
        </ul>
    </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div 
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 id="help-modal-title" className="text-xl font-bold text-slate-800">Yardım & İpuçları</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500 transition-colors"
            aria-label="Yardım menüsünü kapat"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
            <HelpSection title="Kullanım Önerileri">
                <li><strong>Fotoğraf Kalitesi:</strong> En iyi sonuçlar için net, iyi aydınlatılmış ve gölgesiz fotoğraflar çekin.</li>
                <li><strong>Çekim Açısı:</strong> Kağıdı düz bir zemine koyarak, kamerayı tam tepeden ve paralel tutarak çekim yapın.</li>
                <li><strong>Format Benzerliği:</strong> Cevap anahtarı ve öğrenci kağıtlarındaki formatın (örneğin soru-cevap tablosu) benzer olması analiz doğruluğunu artırır.</li>
            </HelpSection>

            <HelpSection title="Tavsiyeler">
                <li><strong>Otomatik Notlandırma:</strong> "Cevap Anahtarı Analizi" modunu kullanarak notlandırma işlemini otomatikleştirin. Bu mod, önce cevap anahtarını analiz eder, sonra öğrenci kağıtlarındaki cevapları bu anahtarla karşılaştırarak puanları hesaplar.</li>
                <li><strong>Toplu Analiz:</strong> Çok sayıda kağıt analiz ediyorsanız, işlem biraz zaman alabilir. Lütfen sabırla bekleyiniz.</li>
                <li><strong>Excel Özelleştirme:</strong> Analiz sonrası Excel'e aktarmadan önce "Excel Sütun Başlıkları" bölümünden dışa aktarılacak verileri ve başlıklarını özelleştirebilirsiniz.</li>
            </HelpSection>

            <HelpSection title="İpuçları ve Püf Noktaları">
                <li><strong>Önbellekleme:</strong> Cevap anahtarı bir kez analiz edildikten sonra, yeni bir anahtar yüklenene kadar sonuçları önbellekte tutulur. Bu, aynı anahtarla birden çok öğrenci grubu için analiz yaparken size zaman ve maliyet tasarrufu sağlar.</li>
                <li><strong>Soru Sayısı:</strong> Analize başlamadan önce doğru soru sayısını seçtiğinizden emin olun. Bu, puan hesaplaması ve veri çıkarımı için kritiktir.</li>
                <li><strong>Hata Durumunda:</strong> Eğer bir analiz başarısız olursa, ilk olarak fotoğraf kalitesini kontrol edin ve tekrar deneyin. Bazen küçük bir açı farkı veya ışık yansıması bile sonucu etkileyebilir.</li>
            </HelpSection>

            <HelpSection title="Limitlemeler">
                <li><strong>Sınav Tipi:</strong> Uygulama, standart çoktan seçmeli (A, B, C, D, E gibi) sınav formatları için optimize edilmiştir. Açık uçlu veya karmaşık cevap tabloları olan sınavlarda doğruluk oranı düşebilir.</li>
                <li><strong>El Yazısı:</strong> El yazısı okuma performansı, yazının okunaklılığına bağlıdır. Çok silik veya karmaşık el yazıları yanlış okunabilir.</li>
                <li><strong>Tek Kağıt Kuralı:</strong> Uygulama aynı anda birden fazla öğrenciye ait bilgiyi tek bir fotoğraftan çıkaramaz. Her fotoğraf yalnızca bir öğrenci kağıdı içermelidir.</li>
            </HelpSection>
        </main>
      </div>
    </div>
  );
};
