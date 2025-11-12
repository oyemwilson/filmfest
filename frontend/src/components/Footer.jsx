import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[rgba(0,104,157,1)] text-white py-8 px-6">
      <div className="max-w-6xl mx-auto text-center space-y-2">
        <p className="text-sm md:text-base font-medium">
          © African SGDs Film Festival. All rights reserved
        </p>
        <p className="text-sm md:text-base">
          <a
            href="mailto:info@sdgafricanfilmfestival.com"
            className="underline hover:text-gray-200"
          >
            info@sdgafricanfilmfestival.com
          </a>
        </p>
        <p className="text-sm md:text-base leading-relaxed">
          29 Ahmed Gambo Saleh Cres, Lawani Crescent, Jahi, F.C.T Abuja
        </p>
      </div>
    </footer>
  );
}
