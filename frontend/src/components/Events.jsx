import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

const EventPage = () => {
  const [activeYear, setActiveYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [serverYears, setServerYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [contentByYear, setContentByYear] = useState({});
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to normalize backend content -> UI shape
  const normalizeContent = (doc) => {
    if (!doc) return { video: null, photos: [], awards: [], partners: [] };

    const video = doc.videoLink || doc.video || null;

    const photos = Array.isArray(doc.photos)
      ? doc.photos.map(p => (typeof p === 'string' ? p : (p.url || p.path || ''))).filter(Boolean)
      : [];

    const partners = Array.isArray(doc.partners)
      ? doc.partners.map(p => (typeof p === 'string' ? p : (p.url || p.path || ''))).filter(Boolean)
      : [];

    const awards = Array.isArray(doc.awards)
      ? doc.awards.map(a => ({
          category: a.category || a.name || 'Untitled',
          winner: {
            name: a.winner?.name || a.winner?.title || '',
            photo: a.winner?.photo?.url || a.winner?.photo || a.winner?.url || '',
          },
          firstRunnerUp: {
            name: a.firstRunnerUp?.name || a.firstRunnerUp?.title || '',
            photo: a.firstRunnerUp?.photo?.url || a.firstRunnerUp?.photo || a.firstRunnerUp?.url || '',
          },
          secondRunnerUp: {
            name: a.secondRunnerUp?.name || a.secondRunnerUp?.title || '',
            photo: a.secondRunnerUp?.photo?.url || a.secondRunnerUp?.photo || a.secondRunnerUp?.url || '',
          },
        }))
      : [];

    return { video, photos, awards, partners };
  };

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextModalImage = () => {
    const currentData = contentByYear[activeYear] || { photos: [] };
    setCurrentPhotoIndex(prev => 
      prev === currentData.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevModalImage = () => {
    const currentData = contentByYear[activeYear] || { photos: [] };
    setCurrentPhotoIndex(prev => 
      prev === 0 ? currentData.photos.length - 1 : prev - 1
    );
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextModalImage();
      if (e.key === 'ArrowLeft') prevModalImage();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // fetch list of years from backend and build availableYears (include current + next)
  useEffect(() => {
    let mounted = true;
    const fetchYears = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/content`);
        if (!res.ok) throw new Error(`Failed to load years (${res.status})`);
        const list = await res.json();

        const yearsNums = Array.isArray(list)
          ? list.map(d => Number(d.year)).filter(n => !Number.isNaN(n))
          : [];

        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        if (!yearsNums.includes(currentYear)) yearsNums.push(currentYear);
        if (!yearsNums.includes(nextYear)) yearsNums.push(nextYear);

        const finalYears = Array.from(new Set(yearsNums))
          .sort((a, b) => b - a)
          .map(String);

        if (!mounted) return;

        const serverYearStrings = Array.isArray(list) ? list.map(d => String(Number(d.year))).filter(y => y && y !== 'NaN') : [];
        setServerYears(serverYearStrings);

        setAvailableYears(finalYears);
        setActiveYear(String(new Date().getFullYear()));
      } catch (err) {
        console.error('fetchYears err', err);
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const fallback = [String(nextYear), String(currentYear)];
        if (mounted) {
          setAvailableYears(fallback);
          setServerYears([]);
          setActiveYear(String(currentYear));
          setError('Could not load years from server');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchYears();
    return () => { mounted = false; };
  }, []);

  // fetch content for activeYear whenever it changes (and not already cached)
  useEffect(() => {
    if (!activeYear) return;
    let mounted = true;
    const fetchContent = async (year) => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/content/${encodeURIComponent(year)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) setContentByYear(prev => ({ ...prev, [year]: { video: null, photos: [], awards: [], partners: [] } }));
            return;
          }
          throw new Error(`Failed to load content (${res.status})`);
        }
        const doc = await res.json();
        if (!mounted) return;
        const normalized = normalizeContent(doc);
        setContentByYear(prev => ({ ...prev, [year]: normalized }));
        setCurrentPhotoIndex(0);
      } catch (err) {
        console.error('fetchContent err', err);
        if (mounted) setError(`Could not load content for ${year}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!contentByYear[activeYear]) fetchContent(activeYear);
  }, [activeYear, contentByYear]);

  const handleYearChange = (year) => {
    if (!availableYears.includes(year)) return;
    const cached = contentByYear[year];
    const cachedHasContent = !!cached && (
      (cached.photos && cached.photos.length > 0) ||
      !!cached.video ||
      (cached.awards && cached.awards.length > 0) ||
      (cached.partners && cached.partners.length > 0)
    );
    const hasData = serverYears.includes(year) || cachedHasContent;
    if (!hasData) return;

    setActiveYear(year);
    setError('');
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    const currentData = contentByYear[activeYear] || { photos: [] };
    setCurrentPhotoIndex(prev =>
      prev === currentData.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    const currentData = contentByYear[activeYear] || { photos: [] };
    setCurrentPhotoIndex(prev =>
      prev === 0 ? Math.max(0, currentData.photos.length - 1) : prev - 1
    );
  };

  const currentData = contentByYear[activeYear] || { video: null, photos: [], awards: [], partners: [] };

  if (loading && !currentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgba(162,25,66,1)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {activeYear || ''} data...</p>
        </div>
      </div>
    );
  }
  // Preload all photos in the background
useEffect(() => {
  if (currentData?.photos?.length > 0) {
    currentData.photos.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }
}, [currentData]);


  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Year Tabs */}
        <div className="flex justify-start mb-12">
          <div className="flex space-x-4">
            {availableYears.map((year) => {
              const cached = contentByYear[year];
              const cachedHasContent = !!cached && (
                (cached.photos && cached.photos.length > 0) ||
                !!cached.video ||
                (cached.awards && cached.awards.length > 0) ||
                (cached.partners && cached.partners.length > 0)
              );

              const hasData = serverYears.includes(year) || cachedHasContent;
              const isActive = activeYear === year;

              return (
                <div key={year} className="ml-10 flex flex-col items-center">
                  <button
                    onClick={() => hasData && handleYearChange(year)}
                    className={` px-12 py-3 text-lg font-semibold rounded-lg relative transition-all duration-300 ${isActive
                      ? 'text-white bg-[rgba(162,25,66,1)]'
                      : hasData
                        ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      }`}
                    disabled={!hasData}
                  >
                    {year}
                  </button>

                  {isActive && (
                    <div className="mt-1 flex justify-center w-full">
                      <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[16px] border-l-transparent border-r-transparent border-t-[rgba(162,25,66,1)]"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Section */}
        <div className="rounded-xl p-2 md:p-6 mb-8 ">
          <div className="bg-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-[4/3] md:aspect-[16/9]
">
              {currentData?.video ? (
                <iframe
                  src={currentData.video}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Event Video"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No video available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Gallery Section - KEEP THE ORIGINAL CAROUSEL */}
        <div className="rounded-xl p-2 md:p-6 mb-8 ">
          <div className="mb-8 text-left">
            <div className="relative inline-block">
              <h2 className="px-12 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(63,126,68,1)]">
                Photo Highlights
              </h2>

              <div className="absolute left-1/2 transform -translate-x-1/2 mt-1">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(63,126,68,1)]"></div>
              </div>
            </div>
          </div>

          {currentData?.photos?.length > 0 ? (
            <div className="relative">
              {/* Main photo - clickable to open modal */}
              <div 
                className="aspect-[4/3] md:aspect-[16/9] rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                onClick={openModal}
              >
                <img
                  src={currentData.photos[currentPhotoIndex]}
                   loading="lazy"
                  alt={`Event photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {currentData.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2  hover:bg-black/30 p-2 rounded-full transition-all "
                  >
                    <ChevronLeft className="md:w-32 md:h-32 w-10 h-10  text-white" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2  hover:bg-black/30 p-2 rounded-full  transition-all "
                  >
                    <ChevronRight className="md:w-32 md:h-32 w-10 h-10 text-white" />
                  </button>

                  <div className="flex justify-center mt-4 space-x-2 hidden md:block">
                    {currentData.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${index === currentPhotoIndex
                          ? 'bg-[rgba(162,25,66,1)]'
                          : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              No photos available
            </div>
          )}
        </div>

        {/* Awards Section */}
        <div className="rounded-xl p-6 mb-8 ">
          <div className="mb- text-left">
            <div className="relative inline-block">
              <h2 className="px-12 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(10,151,217,1)]">
                Awarded Films
              </h2>
            </div>
          </div>

          {currentData?.awards?.length > 0 ? (
            <div className="space-y-8">
              {currentData.awards.map((award, index) => (
                <div key={index} className=" rounded-lg p-6 pt-0 px-0">
                  <h3 className="text-xl py-3 px-2 font-semibold text-white mb-10 text-center bg-[rgba(174,174,174,1)] relative">
                    {award.category}
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-4">
                      <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(174,174,174,1)]"></div>
                    </div>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center md:text-start">
                      <div className="mx-auto md:mx-0 w-full max-w-xs md:max-w-none">
                        <div className="bg-gray-200 rounded-lg overflow-hidden w-full">
                          <img
                            src={award.winner.photo}
                            alt={award.winner.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <p className="font-medium text-gray-700 mt-2">{award.winner.name}</p>
                      <h4 className="font-semibold text-gray-800 mb-2">Winner</h4>
                    </div>

                    <div className="text-center md:text-start">
                      <div className="mx-auto md:mx-0 w-full max-w-xs md:max-w-none">
                        <div className=" bg-gray-200 rounded-lg overflow-hidden w-full">
                          <img
                            src={award.firstRunnerUp.photo}
                            alt={award.firstRunnerUp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <p className="font-medium text-gray-700 mt-2">{award.firstRunnerUp.name}</p>
                      <h4 className="font-semibold text-gray-800 mb-2">First Runner Up</h4>
                    </div>

                    <div className="text-center md:text-start">
                      <div className="mx-auto md:mx-0 w-full max-w-xs md:max-w-none">
                        <div className=" bg-gray-200 rounded-lg overflow-hidden w-full">
                          <img
                            src={award.secondRunnerUp.photo}
                            alt={award.secondRunnerUp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <p className="font-medium text-gray-700 mt-2">{award.secondRunnerUp.name}</p>
                      <h4 className="font-semibold text-gray-800 mb-2">Second Runner Up</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No awards data available
            </div>
          )}
        </div>

        {/* Partners Section */}
        <div className="rounded-xl p-6 ">
          <div className="mb-8 text-left">
            <div className="relative inline-block">
              <h2 className="px-12 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(253,105,37,1)]">
                Our Partners
              </h2>

              <div className="absolute left-1/2 transform -translate-x-1/2 mt-1">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(253,105,37,1)]"></div>
              </div>
            </div>
          </div>

{currentData?.partners?.length > 0 ? (
  <div className="flex flex-wrap justify-center items-center gap-6">
    {currentData.partners.map((partner, index) => (
      <div
        key={index}
        className="flex items-center justify-center w-[45%] sm:w-[30%] md:w-[22%] lg:w-[18%] h-24 sm:h-28 md:h-32"
      >
        <img
          src={partner}
          alt={`Partner ${index + 1}`}
          className="max-w-[50%] max-h-full object-contain mx-auto"
        />
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-8 text-gray-500">
    No partners data available
  </div>
)}

<div className="flex justify-center w-full mb-20 mt-[7rem] md:mt-[15rem]">
  <img
    src="/images/logo.png"
    alt="Logo"
    className="w-[60%] sm:w-[40%] object-contain"
  />
</div>

{error && (
  <div className="text-center text-red-600 mt-6">
    {error}
  </div>
)}

</div>

        {/* Image Modal - Only shows when clicking the main carousel image */}
        {isModalOpen && currentData?.photos?.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation buttons */}
              {currentData.photos.length > 1 && (
                <>
                  <button
                    onClick={prevModalImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextModalImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {currentData.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {currentData.photos.length}
                </div>
              )}

              {/* Main modal image */}
              <img
                src={currentData.photos[currentPhotoIndex]}
                alt={`Event photo ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;
