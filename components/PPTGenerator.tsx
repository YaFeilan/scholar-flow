
import React, { useState, useRef } from 'react';
import { Upload, User, Layout, Palette, MonitorPlay, ChevronRight, ChevronLeft, Loader2, CheckCircle, FileText, Download, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generatePPTStyleSuggestions, generatePPTContent, generateSlideImage } from '../services/geminiService';
import { jsPDF } from 'jspdf';

interface PPTGeneratorProps {
  language: Language;
}

const PPTGenerator: React.FC<PPTGeneratorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].ppt;
  
  // State
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [userInfo, setUserInfo] = useState({ name: '', school: '' });
  const [config, setConfig] = useState({ density: 'Rich', pages: 15 });
  const [styles, setStyles] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [pptContent, setPptContent] = useState<any>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  
  // Loading States
  const [analyzingStyles, setAnalyzingStyles] = useState(false);
  const [generatingPPT, setGeneratingPPT] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStyleAnalysis = async () => {
    if (!file) return;
    setAnalyzingStyles(true);
    setStep(3); // Move to step 3 visually while loading
    const suggestions = await generatePPTStyleSuggestions(file, language);
    setStyles(suggestions);
    setAnalyzingStyles(false);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setGeneratingPPT(true);
    setStep(4);
    const content = await generatePPTContent(file, { ...userInfo, ...config, style: selectedStyle }, language);
    setPptContent(content);
    setGeneratingPPT(false);
  };

  const handleGenerateImage = async (index: number, visualSuggestion: string) => {
    if (!visualSuggestion) return;
    setGeneratingImages(prev => ({...prev, [index]: true}));
    
    const styleDescription = styles.find(s => s.name === selectedStyle)?.description || selectedStyle || 'Professional';
    const imageUrl = await generateSlideImage(visualSuggestion, styleDescription);
    
    if (imageUrl) {
      const newSlides = [...pptContent.slides];
      newSlides[index].generatedImage = imageUrl;
      setPptContent({...pptContent, slides: newSlides});
    }
    setGeneratingImages(prev => ({...prev, [index]: false}));
  };

  const handleDownload = () => {
    if (!pptContent) return;
    
    // Create PDF
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Title Slide
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(pptContent.title || "Presentation", pageWidth / 2, pageHeight / 3, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(userInfo.name, pageWidth / 2, pageHeight / 2, { align: "center" });
    doc.text(userInfo.school, pageWidth / 2, pageHeight / 2 + 10, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Theme: ${selectedStyle}`, pageWidth / 2, pageHeight - 20, { align: "center" });
    doc.setTextColor(0);

    // Slides
    if (Array.isArray(pptContent.slides)) {
        pptContent.slides.forEach((slide: any, i: number) => {
            doc.addPage();
            
            // Slide Number
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`${i + 1}`, pageWidth - margin, margin);
            doc.setTextColor(0);

            // Title
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text(slide.title || `Slide ${i + 1}`, margin, margin + 10);
            
            // Layout Logic
            const contentX = margin;
            const contentY = margin + 25;
            const contentWidth = pageWidth - (margin * 2);
            
            // Content Text
            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            
            let currentY = contentY;

            if (Array.isArray(slide.content)) {
                slide.content.forEach((point: any) => {
                    const text = typeof point === 'string' ? point : (point.text || JSON.stringify(point));
                    const lines = doc.splitTextToSize(`• ${text}`, contentWidth);
                    
                    // Simple page break check for text
                    if (currentY + (lines.length * 7) > pageHeight - 20) {
                        doc.addPage();
                        currentY = margin;
                    }

                    doc.text(lines, contentX, currentY);
                    currentY += (lines.length * 7) + 2;
                });
            }

            // Image (if generated)
            if (slide.generatedImage) {
                const imgWidth = 120;
                const imgHeight = 70;
                
                // Check remaining space
                const spaceRemaining = pageHeight - currentY - 20; 
                
                if (spaceRemaining > imgHeight) {
                     // Add to current page
                     const xPos = (pageWidth - imgWidth) / 2;
                     doc.addImage(slide.generatedImage, 'PNG', xPos, currentY + 5, imgWidth, imgHeight);
                } else {
                     // Add new page for image if text took too much space
                     doc.addPage();
                     doc.text(`${slide.title} (Visual)`, margin, margin + 10);
                     doc.addImage(slide.generatedImage, 'PNG', (pageWidth - imgWidth) / 2, margin + 20, imgWidth, imgHeight);
                }
            } else if (slide.visualSuggestion) {
                 // Print suggestion as placeholder text if no image generated
                 doc.setFontSize(10);
                 doc.setTextColor(100);
                 const suggLines = doc.splitTextToSize(`[Visual Idea: ${slide.visualSuggestion}]`, contentWidth);
                 doc.text(suggLines, margin, pageHeight - 30);
                 doc.setTextColor(0);
            }

            // Speaker Notes
            if (slide.speakerNotes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(100);
                const notes = `Speaker Notes: ${slide.speakerNotes}`;
                const splitNotes = doc.splitTextToSize(notes, pageWidth - (margin * 2));
                doc.text(splitNotes, margin, pageHeight - 15);
                doc.setTextColor(0);
            }
        });
    }

    doc.save(`${userInfo.name}_Presentation.pdf`);
  };

  // Step Indicators
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
       {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}
             `}>
                {s}
             </div>
             {s < 4 && <div className={`w-12 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
          </div>
       ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
         <h2 className="text-3xl font-serif font-bold text-slate-900">{t.title} <span className="text-red-500 text-sm align-super">(Test)</span></h2>
         <p className="text-slate-500">{t.subtitle}</p>
      </div>

      <StepIndicator />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
        {/* Step 1: Upload & Info */}
        {step === 1 && (
          <div className="p-8 flex-grow flex flex-col items-center justify-center space-y-8 animate-fadeIn">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full max-w-lg border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-colors"
             >
                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} />
                {file ? (
                   <>
                      {file.type.startsWith('image/') ? (
                         <div className="mb-4 relative group">
                            <img src={URL.createObjectURL(file)} alt="Preview" className="h-48 object-contain rounded-lg shadow-sm" />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                               <ImageIcon size={12} /> Image
                            </div>
                         </div>
                      ) : (
                         <FileText size={48} className="text-blue-500 mb-4" />
                      )}
                      <p className="font-bold text-lg text-slate-800">{file.name}</p>
                      <p className="text-sm text-slate-400">{(file.size/1024/1024).toFixed(2)} MB</p>
                   </>
                ) : (
                   <>
                      <div className="flex gap-2 mb-4 text-slate-300">
                         <Upload size={48} />
                      </div>
                      <p className="font-bold text-lg text-slate-600">{t.uploadLabel}</p>
                      <p className="text-sm text-slate-400">PDF or Image (PNG/JPG)</p>
                   </>
                )}
             </div>

             <div className="w-full max-w-lg space-y-4">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">{t.nameLabel}</label>
                   <div className="relative">
                      <User size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="text" 
                        value={userInfo.name}
                        onChange={e => setUserInfo({...userInfo, name: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. John Doe"
                     />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">{t.schoolLabel}</label>
                   <div className="relative">
                      <Layout size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="text" 
                        value={userInfo.school}
                        onChange={e => setUserInfo({...userInfo, school: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. University of Science"
                     />
                   </div>
                </div>
             </div>

             <button 
               disabled={!file || !userInfo.name || !userInfo.school}
               onClick={() => setStep(2)}
               className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
             >
                Next Step <ChevronRight size={18} />
             </button>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="p-8 flex-grow flex flex-col justify-center max-w-2xl mx-auto w-full animate-fadeIn">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Layout className="text-blue-500" /> {t.steps[2]}
             </h3>
             
             <div className="space-y-8">
                {/* Density */}
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-3">{t.densityLabel}</label>
                   <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setConfig({...config, density: 'Simple'})}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${config.density === 'Simple' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <div className="font-bold text-slate-800 mb-1">{t.densityLow}</div>
                         <div className="text-xs text-slate-500">Focus on headlines and minimal bullet points.</div>
                      </div>
                      <div 
                        onClick={() => setConfig({...config, density: 'Rich'})}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${config.density === 'Rich' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <div className="font-bold text-slate-800 mb-1">{t.densityHigh}</div>
                         <div className="text-xs text-slate-500">Detailed explanations, data points, and extensive speaker notes.</div>
                      </div>
                   </div>
                </div>

                {/* Pages */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700">{t.pagesLabel}</label>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">{config.pages} Pages</span>
                   </div>
                   <input 
                     type="range" 
                     min="5" 
                     max="30" 
                     value={config.pages}
                     onChange={(e) => setConfig({...config, pages: parseInt(e.target.value)})}
                     className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                   />
                   <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>5</span>
                      <span>15</span>
                      <span>30</span>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Back</button>
                   <button 
                     onClick={handleStyleAnalysis}
                     className="flex-grow bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                   >
                      <Palette size={18} /> {t.styleBtn}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Step 3: Style Selection */}
        {step === 3 && (
           <div className="p-8 flex-grow flex flex-col animate-fadeIn">
              {analyzingStyles ? (
                 <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-bold text-slate-800">{t.analyzing}</p>
                 </div>
              ) : (
                 <>
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">{t.steps[3]}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                       {styles.map((style) => (
                          <div 
                             key={style.id}
                             onClick={() => setSelectedStyle(style.name)}
                             className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg group
                                ${selectedStyle === style.name ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}
                             `}
                          >
                             {/* Mock Preview Header */}
                             <div className="h-24" style={{background: `linear-gradient(135deg, ${style.colorPalette[0]}, ${style.colorPalette[1]})`}}></div>
                             <div className="p-5">
                                <h4 className="font-bold text-slate-800 mb-2">{style.name}</h4>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{style.description}</p>
                                <div className="flex gap-2">
                                   {style.colorPalette.map((c: string, i: number) => (
                                      <div key={i} className="w-6 h-6 rounded-full border border-slate-100" style={{backgroundColor: c}}></div>
                                   ))}
                                </div>
                             </div>
                             {selectedStyle === style.name && (
                                <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                                   <CheckCircle size={16} />
                                </div>
                             )}
                          </div>
                       ))}
                    </div>

                    <div className="flex justify-center gap-4 mt-auto">
                        <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Back</button>
                        <button 
                           disabled={!selectedStyle}
                           onClick={handleGenerate}
                           className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                           <MonitorPlay size={18} /> {t.genBtn}
                        </button>
                    </div>
                 </>
              )}
           </div>
        )}

        {/* Step 4: Generating / Result */}
        {step === 4 && (
           <div className="p-8 flex-grow flex flex-col animate-fadeIn">
              {generatingPPT ? (
                 <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-bold text-slate-800">{t.generating}</p>
                    <p className="text-sm text-slate-500 mt-2">Extracting visuals and writing {config.pages} slides...</p>
                 </div>
              ) : pptContent ? (
                 <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                       <div>
                          <h3 className="text-2xl font-bold text-slate-900">{pptContent.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">{userInfo.name} • {userInfo.school}</p>
                       </div>
                       <button 
                         onClick={handleDownload}
                         className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-100"
                       >
                          <Download size={18} /> Download Slides (PDF)
                       </button>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-grow overflow-y-auto bg-slate-100 rounded-xl p-8 border border-slate-200">
                       <div className="max-w-3xl mx-auto space-y-8">
                          {Array.isArray(pptContent.slides) ? pptContent.slides.map((slide: any, idx: number) => (
                             <div key={idx} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 aspect-video flex flex-col relative overflow-hidden group">
                                <div className="border-b-2 border-slate-100 pb-4 mb-4 flex justify-between items-center relative z-10">
                                   <h4 className="text-xl font-bold text-slate-800">{slide.title}</h4>
                                   <span className="text-xs font-bold text-slate-300">{idx + 1}</span>
                                </div>
                                
                                <div className="flex-grow space-y-3 relative z-10">
                                    {/* Visual Suggestion Box with Generate Button */}
                                    {slide.visualSuggestion && (
                                       <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start justify-between gap-4">
                                          <div className="text-xs text-blue-800 flex items-start gap-2">
                                            <ImageIcon size={16} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="font-bold block">Visual Layout:</span>
                                                {slide.visualSuggestion}
                                            </div>
                                          </div>
                                          <button 
                                            onClick={() => handleGenerateImage(idx, slide.visualSuggestion)}
                                            disabled={generatingImages[idx] || !!slide.generatedImage}
                                            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                          >
                                            {generatingImages[idx] ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                            {slide.generatedImage ? 'Regenerate' : 'Generate Visual'}
                                          </button>
                                       </div>
                                    )}

                                   {/* Generated Image Display */}
                                   {slide.generatedImage && (
                                      <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group/image">
                                         <img src={slide.generatedImage} alt={`Slide ${idx + 1} Visual`} className="w-full h-48 object-cover" />
                                      </div>
                                   )}

                                   {Array.isArray(slide.content) && slide.content.map((point: any, i: number) => (
                                      <div key={i} className="flex gap-2 text-slate-700">
                                         <span className="text-blue-500">•</span>
                                         <span>
                                            {typeof point === 'object' 
                                                ? (point.text || point.description || JSON.stringify(point)) 
                                                : point}
                                         </span>
                                      </div>
                                   ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-xs text-slate-400 italic relative z-10">
                                   <span className="font-bold not-italic mr-1">Speaker Notes:</span> {slide.speakerNotes}
                                </div>

                                {/* Mock Visual Background for Layout (only shown if no generated image) */}
                                {(!slide.generatedImage && (slide.layout === 'ImageWithText' || slide.layout === 'DiagramFocused')) && (
                                    <div className="absolute top-20 right-10 w-1/3 h-1/2 bg-slate-50 border-2 border-dashed border-slate-200 rounded flex items-center justify-center opacity-50 z-0 pointer-events-none">
                                        <ImageIcon size={32} className="text-slate-300" />
                                    </div>
                                )}
                             </div>
                          )) : (
                             <div className="text-center text-slate-500 p-8">
                                No slides generated. Please try again.
                             </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                       <button onClick={() => setStep(1)} className="text-slate-500 hover:text-blue-600 font-medium text-sm">Create Another Presentation</button>
                    </div>
                 </div>
              ) : null}
           </div>
        )}
      </div>
    </div>
  );
};

export default PPTGenerator;
