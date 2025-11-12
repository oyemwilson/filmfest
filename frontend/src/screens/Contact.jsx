// src/components/ContactForm.jsx
import React, { useState } from "react";
import { Phone, Mail } from "lucide-react";

/**
 * ContactForm
 * - Centered card with border: 1px solid rgba(197,25,45,1)
 * - Heading "Get in Touch" colored rgba(197,25,45,1)
 * - Send button background rgba(252,195,11,1)
 * - Phone/Email label color rgba(197,25,45,1) and their values black
 * - Simple client-side validation + success message
 *
 * Tailwind is used for layout; exact colors are applied inline to ensure they match.
 */

export default function ContactForm() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        source: "",
        message: "",
    });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("");

    const brandRed = "rgba(197, 25, 45, 1)";
    const sendYellow = "rgba(252, 195, 11, 1)";
    const brandOrange = "rgba(253,105,37,1)";

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.email.trim()) e.email = "Email is required";
        // simple email pattern
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
        if (!form.phone.trim()) e.phone = "Phone number is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (k) => (evt) => {
        setForm((prev) => ({ ...prev, [k]: evt.target.value }));
        setErrors((prev) => ({ ...prev, [k]: undefined }));
        setStatus("");
    };

    const handleSubmit = (evt) => {
        evt.preventDefault();
        if (!validate()) return;
        // simulate send
        setStatus("sending");
        setTimeout(() => {
            setStatus("sent");
            // reset
            setForm({ name: "", email: "", phone: "", source: "", message: "" });
            setErrors({});
            setTimeout(() => setStatus(""), 4000);
        }, 800);
    };

    return (
        <div className="py-2 ">
            <div className=" text-center my-[5rem]">
                <div className="relative inline-block">
                    <h2 className="px-20 py-3 text-2xl font-bold text-white flex items-center gap-2 bg-[rgba(38,189,226,1)]">
                        Contact Us
                    </h2>

                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-1">
                        <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-l-transparent border-r-transparent border-t-[rgba(38,189,226,1)]"></div>
                    </div>
                </div>
            </div>
            <div className="max-w-3xl mx-auto px-4 mt-10">
                <div
                    className="bg-white rounded-3xl mx-auto px-[2rem] md:px-[7rem] py-[5rem]"
                    style={{ border: `1px solid ${brandRed}`, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}
                >
                    {/* Heading */}
                    <div className="text-left mb-6">
                        <h2 className="text-5xl font-bold">
                            Get in <span style={{ color: brandOrange }}>Touch</span>
                        </h2>
                        <p className="mt-2 text-black">Help us make the festival better!</p>
                        <p className="text-black">Let us know your thoughts and feedback.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4" noValidate>
                        {/* NAME */}
                        <div>
                            <label htmlFor="name" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                                <span>Name</span>
                                <span className="text-red-500" aria-hidden>
                                    *
                                </span>
                            </label>
                            <input
                                id="name"
                                value={form.name}
                                onChange={handleChange("name")}
                                className={`w-full p-3 border rounded ${errors.name ? "border-red-400" : "border-gray-200"}`}
                                placeholder="Name"
                                aria-required="true"
                                aria-invalid={errors.name ? "true" : "false"}
                                required
                            />
                            {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                        </div>

                        {/* EMAIL + PHONE (stacked on mobile) */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="email" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                                    <span>Email</span>
                                    <span className="text-red-500" aria-hidden>
                                        *
                                    </span>
                                </label>
                                <input
                                    id="email"
                                    value={form.email}
                                    onChange={handleChange("email")}
                                    className={`w-full p-3 border rounded ${errors.email ? "border-red-400" : "border-gray-200"}`}
                                    placeholder="you@example.com"
                                    type="email"
                                    aria-required="true"
                                    aria-invalid={errors.email ? "true" : "false"}
                                    required
                                />
                                {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                            </div>

                            <div>
                                <label htmlFor="phone" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                                    <span>Phone</span>
                                    <span className="text-red-500" aria-hidden>
                                        *
                                    </span>
                                </label>
                                <input
                                    id="phone"
                                    value={form.phone}
                                    onChange={handleChange("phone")}
                                    className={`w-full p-3 border rounded ${errors.phone ? "border-red-400" : "border-gray-200"}`}
                                    placeholder="+234 800 000 0000"
                                    aria-required="true"
                                    aria-invalid={errors.phone ? "true" : "false"}
                                    required
                                />
                                {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
                            </div>
                        </div>

                        {/* SOURCE */}
                        <div>
                            <label htmlFor="source" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                <span>How did you hear about us</span>
                            </label>
                            <select
                                id="source"
                                value={form.source}
                                onChange={handleChange("source")}
                                className="w-full p-3 border rounded border-gray-200"
                            >
                                <option value="">Select an option</option>
                                <option>Social media</option>
                                <option>Friend / Word of mouth</option>
                                <option>Poster / Flyer</option>
                                <option>Press / Media</option>
                                <option>Other</option>
                            </select>
                        </div>

                        {/* SEND BUTTON */}
                        <div className="flex items-center justify-center mt-2">
                            <button
                                type="submit"
                                disabled={status === "sending"}
                                style={{ background: sendYellow }}
                                className="px-6 py-3 rounded font-semibold shadow-sm hover:shadow-md transition-all w-full"
                            >
                                <span style={{ color: "white" }}>{status === "sending" ? "Sending..." : "Send"}</span>
                            </button>
                        </div>

                        {status === "sent" && (
                            <div className="text-center text-green-600 mt-2">Thanks — your message was sent.</div>
                        )}
                    </form>

                    {/* Divider */}
                    <div className="border-t mt-6 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">

                            {/* PHONE */}
                            <div className="flex items-center justify-center gap-3">
                                {/* Custom Phone SVG */}
                                <svg
                                    width="29"
                                    height="29"
                                    viewBox="0 0 29 29"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="flex-shrink-0"
                                >
                                    <path d="M15.4715 0V1.92844C17.3789 1.92844 19.1658 2.41055 20.8323 3.37476C22.4184 4.3189 23.6833 5.58443 24.6269 7.17137C25.5907 8.83867 26.0725 10.6265 26.0725 12.5348H28C28 10.2649 27.4278 8.15568 26.2834 6.20716C25.1791 4.3189 23.6833 2.82235 21.796 1.71751C19.8485 0.572505 17.7403 0 15.4715 0ZM5.50296 2.89266C4.96086 2.89266 4.48903 3.0634 4.08748 3.4049L0.98548 6.56874L1.07583 6.50847C0.573887 6.93032 0.242605 7.45261 0.0819839 8.07533C-0.0585599 8.69805 -0.0184045 9.30069 0.20245 9.88324C0.764625 11.4501 1.51754 13.0571 2.46119 14.7043C3.78632 16.9743 5.36241 19.0132 7.18948 20.8211C10.1208 23.774 13.7649 26.1042 18.1218 27.8117H18.1519C18.7341 28.0126 19.3164 28.0527 19.8987 27.9322C20.501 27.8117 21.033 27.5505 21.4948 27.1488L24.5366 24.1055C24.9382 23.7037 25.1389 23.2116 25.1389 22.629C25.1389 22.0264 24.9382 21.5242 24.5366 21.1224L20.5913 17.145C20.1898 16.7433 19.6878 16.5424 19.0855 16.5424C18.4832 16.5424 17.9812 16.7433 17.5797 17.145L15.6823 19.0734C14.1564 18.3503 12.8313 17.4564 11.707 16.3917C10.5826 15.307 9.68915 13.9912 9.02659 12.4444L10.954 10.516C11.3757 10.0741 11.5865 9.55179 11.5865 8.94915C11.5865 8.32643 11.3456 7.82423 10.8637 7.44256L10.954 7.53296L6.91843 3.4049C6.51688 3.0634 6.04506 2.89266 5.50296 2.89266ZM15.4715 3.85687V5.78531C16.6963 5.78531 17.8206 6.08663 18.8446 6.68927C19.8886 7.2919 20.7118 8.11551 21.3141 9.16008C21.9165 10.1846 22.2176 11.3095 22.2176 12.5348H24.1451C24.1451 10.968 23.7536 9.51161 22.9705 8.16572C22.1875 6.86001 21.1435 5.81544 19.8384 5.03202C18.4932 4.24859 17.0376 3.85687 15.4715 3.85687ZM5.50296 4.82109C5.56319 4.82109 5.63346 4.85122 5.71377 4.91149L9.65904 8.94915C9.67912 9.0295 9.65904 9.09981 9.5988 9.16008L6.73774 11.9925L6.94855 12.5951L7.34007 13.4388C7.66131 14.1218 8.03275 14.7847 8.45438 15.4275C9.03663 16.3314 9.67912 17.1048 10.3818 17.7476C11.3255 18.6717 12.4599 19.5154 13.785 20.2787C14.4476 20.6604 15.0097 20.9416 15.4715 21.1224L16.0739 21.3936L18.9952 18.4708C19.0353 18.4306 19.0654 18.4105 19.0855 18.4105C19.1056 18.4105 19.1357 18.4306 19.1759 18.4708L23.2416 22.5386C23.2817 22.5788 23.3018 22.6089 23.3018 22.629C23.3018 22.629 23.2817 22.6491 23.2416 22.6893L20.2299 25.6723C19.7882 26.054 19.3064 26.1544 18.7843 25.9736C14.6885 24.3867 11.2753 22.2172 8.54473 19.4652C6.8582 17.7778 5.38249 15.8594 4.1176 13.71C3.2141 12.1632 2.51138 10.6667 2.00944 9.22034V9.19021C1.92913 9.00942 1.91909 8.79849 1.97932 8.55744C2.03956 8.2963 2.14999 8.09542 2.31061 7.9548L5.29214 4.91149C5.35238 4.85122 5.42265 4.82109 5.50296 4.82109ZM15.4715 7.71375V9.64218C16.2746 9.64218 16.9573 9.92342 17.5194 10.4859C18.0816 11.0483 18.3627 11.7313 18.3627 12.5348H20.2902C20.2902 11.6711 20.0693 10.8675 19.6276 10.1243C19.206 9.38104 18.6237 8.79849 17.8808 8.37665C17.138 7.93471 16.3349 7.71375 15.4715 7.71375Z" fill="black" />

                                </svg>

                                {/* Text content */}
                                <div className="flex flex-col items-start text-center">
                                    <div className="font-semibold text-sm">
                                        PHONE
                                    </div>
                                    <div style={{ color: brandRed }} className="text-base">
                                        +234 816 767 3292
                                    </div>
                                </div>
                            </div>



                            {/* EMAIL */}
                            <div className="flex items-center justify-center gap-3">
                                {/* Custom Email SVG */}
                                <svg
                                    width="25"
                                    height="23"
                                    viewBox="0 0 25 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="flex-shrink-0"
                                >
                                    <path
                                        d="M6.20455 0V1.97124L0 6.01065V22.75H24.8182V6.01065L18.6136 1.97124V0H6.20455ZM8.27273 2.06818H16.5455V10.0178L12.4091 12.6999L8.27273 10.0178V2.06818ZM9.30682 4.13636V6.20455H15.5114V4.13636H9.30682ZM6.20455 4.4272V8.66051L2.9407 6.56001L6.20455 4.4272ZM18.6136 4.4272L21.8775 6.56001L18.6136 8.66051V4.4272ZM9.30682 7.23864V9.30682H15.5114V7.23864H9.30682ZM2.06818 8.46662L12.4091 15.1559L22.75 8.46662V20.6818H2.06818V8.46662Z"
                                        fill="black"
                                    />
                                </svg>

                                {/* Text content */}
                                <div className="flex flex-col items-start text-center">
                                    <div className="font-semibold text-sm">
                                        EMAIL
                                    </div>
                                    <div style={{ color: brandRed }} className="text-base">
                                        info@sdgafricanfilmfestival.com
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
                        <div className="flex justify-center w-full mb-20 mt-[8rem]">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="w-[40%] md:w-[40%] object-contain"
          />
        </div>
            </div>
        </div>
    );
}
