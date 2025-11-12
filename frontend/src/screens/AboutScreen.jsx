import React from 'react';

function AboutScreen() {
  return (
    <div className='text-green-200'>
      <section className='pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28'>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-5xl mx-auto">
            <div className=" text-center mb-[5rem]">
              <div className="relative inline-block">
                <h2 className="px-32 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(38,189,226,1)]">
                  About
                </h2>

                <div className="absolute left-1/2 transform -translate-x-1/2 mt-1">
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(38,189,226,1)]"></div>
                </div>
              </div>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-light text-gray-800 leading-relaxed sm:leading-relaxed lg:leading-relaxed xl:leading-relaxed text-left tracking-tight">
              The Sustainable Development Goals (SDGs), established at the United Nations Conference on Sustainable Development in Rio de Janeiro in 2012 with the objective of creating universal goals to address urgent environmental, political, and economic challenges, have effectively defined the global development strategy. However, despite widespread acceptance of these goals, the world has also experienced increased climate change, internal and external conflicts, and a deadly virus that threatened the lives of billions.
            </h1>
            <div className="flex justify-center w-full my-[4rem]">
              <img
                src="/images/about2.webp"
                alt="Logo"
                className="w-[100%] md:w-[100%]   object-contain"
              />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-light text-gray-800 leading-relaxed sm:leading-relaxed lg:leading-relaxed xl:leading-relaxed text-left tracking-tight">
              Though significant, these drawbacks have created an avenue for a deepened sense of responsibility to the world and the need to strengthen coalitions to accelerate efforts in view of the 2030 achievement timeline. At the heart of driving this kind of individual, organisational, and governmental ownership is increasing awareness of the goals and the part we must collectively play at the local level. It becomes highly necessary to design creative and locally relevant strategies that can drive ownership by all members of society. Understanding this, it becomes important to utilise storytelling as a tool for social change and to promote platforms that incentivise grassroots actors and creatives to produce more on the SDGs, reaching a wider audience, and hopefully fostering wider ownership.
            </h1>
                        <div className="flex justify-center w-full my-[4rem]">
              <img
                src="/images/about1.webp"
                alt="Logo"
                className="w-[100%] md:w-[100%]  h-[50%] object-contain"
              />
            </div>
            <div className=" text-center my-[3rem]">
              <div className="relative inline-block">
                <h2 className="px-32 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(253,105,37,1)]">

                  Festival Objectives
                </h2>

                <div className="absolute left-1/2 transform -translate-x-1/2 mt-1">
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(253,105,37,1)]"></div>
                </div>
              </div>
            </div>
            <div className="p-6 text-gray-800 text-left text-lg sm:text-xl lg:text-xl xl:text-2xl">
              <ul className="list-disc space-y-4">
                <li>
                  <strong>Promote the SDGs:</strong> The festival will curate films that highlight the importance of each SDG, emphasising their interconnections and inspiring individuals and communities to contribute to their achievement.
                </li>
                <li>
                  <strong>Raise Environmental Awareness:</strong> Through a diverse selection of thought-provoking films, the festival will increase understanding and awareness of pressing environmental and social challenges such as waste management, climate change, gender inequality and discrimination, biodiversity loss, quality education, sustainable resource management, and the effects of poverty.
                </li>
                <li>
                  <strong>Encourage Sustainable Practices:</strong> The festival will serve as a platform to promote eco-friendly behaviours, sustainable lifestyles, equity and innovative solutions, and encourage individuals and organisations to adopt sustainable practices, invest in economic and social change, and advocate for social inclusion and gender parity.
                </li>
                <li>
                  <strong>Celebrate African Culture:</strong> Through the array of films and exhibitions, the African culture would be highlighted, showcasing the nexus between our culture and the sustainable development goals.
                </li>
                <li>
                  <strong>Facilitate Collaboration and Networking:</strong> The event will facilitate meaningful dialogue, knowledge-sharing, and networking opportunities among creative filmmakers, environmental and development experts, policymakers, NGOs, businesses, and the general public, fostering collaboration for a more sustainable future.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex center justify-start items-centerflex-col sm:flex-row gap-4 sm:gap-6 mt-5 max-w-5xl mx-auto ">
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

      </section>

    </div>
  );
}

export default AboutScreen;
