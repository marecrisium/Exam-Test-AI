import React from 'react';
import { XIcon, QuestionMarkCircleIcon } from './icons';

interface HelpPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xs font-syne font-extrabold uppercase tracking-widest text-accent border-b border-slate-700/50 pb-1.5 mb-2">{title}</h3>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            {children}
        </div>
    </div>
);


export const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#1E293B] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700/50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-panel-title"
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#0F172A]">
                        <div className="flex items-center gap-3">
                            <QuestionMarkCircleIcon className="w-6 h-6 text-accent" />
                            <h2 id="help-panel-title" className="text-sm font-syne font-extrabold uppercase tracking-widest text-[#F8FAFC]">YARDIM & İPUÇLARI</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-accent focus:outline-none"
                            aria-label="Yardım panelini kapat"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <HelpSection title="Kullanım Önerileri">
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Fotoğraf Kalitesi:</strong> En iyi sonuçlar için net, iyi aydınlatılmış ve gölgesiz fotoğraflar çekin.</li>
                                <li><strong>Çekim Açısı:</strong> Kağıdı düz bir zemine koyarak, kamerayı tam tepeden ve paralel tutarak çekim yapın.</li>
                                <li><strong>Format Benzerliği:</strong> Cevap anahtarı ve öğrenci kağıtlarındaki formatın (örneğin soru-cevap tablosu) benzer olması analiz doğruluğunu artırır.</li>
                            </ul>
                        </HelpSection>

                        <HelpSection title="Tavsiyeler">
                             <ul className="list-disc list-inside space-y-2">
                                <li><strong>Otomatik Notlandırma:</strong> "Cevap Anahtarı Analizi" modunu kullanarak notlandırma işlemini otomatikleştirin. Bu mod, önce cevap anahtarını analiz eder, sonra öğrenci kağıtlarındaki cevapları bu anahtarla karşılaştırarak puanları hesaplar.</li>
                                <li><strong>Toplu Analiz:</strong> Çok sayıda kağıt analiz ediyorsanız, işlem biraz zaman alabilir. Lütfen sabırla bekleyiniz.</li>
                                <li><strong>Excel Özelleştirme:</strong> Analiz sonrası Excel'e aktarmadan önce "Excel Sütun Başlıkları" bölümünden dışa aktarılacak verileri ve başlıklarını özelleştirebilirsiniz.</li>
                             </ul>
                        </HelpSection>

                        <HelpSection title="İpuçları ve Püf Noktaları">
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Önbellekleme:</strong> Cevap anahtarı bir kez analiz edildikten sonra, yeni bir anahtar yüklenene kadar sonuçları önbellekte tutulur. Bu, aynı anahtarla birden çok öğrenci grubu için analiz yaparken size zaman ve maliyet tasarrufu sağlar.</li>
                                <li><strong>Soru Sayısı:</strong> Analize başlamadan önce doğru soru sayısını seçtiğinizden emin olun. Bu, puan hesaplaması ve veri çıkarımı için kritiktir. Yanlış seçimi düzeltirseniz, anahtar otomatik olarak yeniden analiz edilir.</li>
                                <li><strong>Hata Durumunda:</strong> Eğer bir analiz başarısız olursa, ilk olarak fotoğraf kalitesini kontrol edin ve tekrar deneyin. Bazen küçük bir açı farkı veya ışık yansıması bile sonucu etkileyebilir.</li>
                            </ul>
                        </HelpSection>

                        <HelpSection title="Limitlemeler">
                             <ul className="list-disc list-inside space-y-2">
                                <li><strong>Sınav Tipi:</strong> Uygulama, standart çoktan seçmeli (A, B, C, D, E gibi) sınav formatları için optimize edilmiştir. Açık uçlu veya karmaşık cevap tabloları olan sınavlarda doğruluk oranı düşebilir.</li>
                                <li><strong>El Yazısı:</strong> El yazısı okuma performansı, yazının okunaklılığına bağlıdır. Çok silik veya karmaşık el yazıları yanlış okunabilir.</li>
                                <li><strong>Tek Kağıt Kuralı:</strong> Uygulama aynı anda birden fazla öğrenciye ait bilgiyi tek bir fotoğraftan çıkaramaz. Her fotoğraf yalnızca bir öğrenci kağıdı içermelidir.</li>
                             </ul>
                        </HelpSection>
                    </div>
                </div>
            </div>
        </>
    );
};