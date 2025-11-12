import React from 'react';


const HeroSection = () => {
  return (
    <>
    <section className="relative h-[90vh] sm:h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/banner.jpg")',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Content Container */}
      <div className="relative h-full flex items-end pb-48 sm:pb-40 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-10xl text-left">
            {/* Main Heading */}
<h1 className="text-4xl sm:text-[4rem] lg:text-[5rem] xl:text-[7rem] font-bold text-white leading-none mb-4">
  <span className="block">Inspiring Sustainability</span>
  <span className="block -mt-2 sm:-mt-4">Through the Lens...</span>
</h1>


            {/* Buttons Container */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Get Tickets Button */}
              <button 
                className="px-8 md:px-24 sm:px-16 py-4  text-lg font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
                style={{ backgroundColor: 'rgba(38, 189, 226, 1)' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(38, 189, 226, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(38, 189, 226, 1)';
                }}
              >
                Get Tickets
              </button>

              {/* Submit Film Button */}
              <button 
                className="px-8 md:px-24 sm:px-16 py-4 text-lg font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
                style={{ backgroundColor: 'rgba(252, 195, 11, 1)' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(252, 195, 11, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(252, 195, 11, 1)';
                }}
              >
                Submit Film
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </div>
    </section>
    <section className='pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28'>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-light text-gray-800 leading-relaxed sm:leading-relaxed lg:leading-relaxed xl:leading-relaxed text-center tracking-tight">
            The African SDGs Film Festival aims to inspire, educate, and mobilize communities across Africa towards achieving the Sustainable Development Goals by 2030 by showcasing films that highlight critical issues such as poverty, gender equality, climate change, and sustainable practices, to foster dialogue, empathy, and action.
          </h1>
        </div>
      </div>
    </section>
    </>
  );
};

export default HeroSection;